# 🔒 Restriction de Génération d'Établissement de Devis par Type de Travaux

## 🎯 Correction Implémentée

**Objectif :** Restreindre la génération de la "DEMANDE D'ÉTABLISSEMENT DE DEVIS QUANTITATIF ET ESTIMATIF" **uniquement aux utilisateurs autorisés pour le type de travaux spécifique** de la demande.

---

## 📋 Problème Corrigé

### **Avant la correction :**

```typescript
// Dans WorkRequestList.tsx
{req.status === RequestStatus.VALIDATED && (
  <button>Générer la demande d'établissement</button>
)}
```

❌ **Problème :** TOUS les utilisateurs pouvaient générer une demande d'établissement dès que le statut était VALIDATED, même s'ils n'étaient pas autorisés pour ce type de travaux.

### **Après la correction :**

```typescript
// Dans WorkRequestList.tsx
{(() => {
  const workType = workTypes.find(wt => 
    wt.label.toLowerCase() === req.serviceType.toLowerCase()
  );
  
  const isAllowedForWorkType = workType?.allowedRoles && workType.allowedRoles.length > 0 
    ? workType.allowedRoles.includes(currentUser?.role)
    : false;
  
  return req.status === RequestStatus.VALIDATED && isAllowedForWorkType ? (
    <button>Générer la demande d'établissement</button>
  ) : null;
})()}
```

✅ **Solution :** Seuls les utilisateurs autorisés pour le type de travaux spécifique peuvent générer la demande d'établissement.

---

## 🔄 Logique de Vérification

### **Double Condition Requise :**

```
┌─────────────────────────────────────────────┐
│ CONDITION 1: Statut = VALIDATED ✅          │
│ La demande doit être validée par tous       │
└─────────────────────────────────────────────┘
                    ET
┌─────────────────────────────────────────────┐
│ CONDITION 2: Utilisateur autorisé ✅        │
│ L'utilisateur doit être dans allowedRoles   │
│ du type de travaux concerné                 │
└─────────────────────────────────────────────┘
```

---

## 📊 Exemples Concrets

### **Exemple 1 : Configuration des Types**

```
Types de travaux configurés :
┌──────────────────────────────────────────┐
│ "Branchement eau potable"                │
│ Rôles autorisés: [AGENT, CHEF_AGENCE]    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ "Audit technique"                        │
│ Rôles autorisés: [TECHICO_COMMERCIAL]    │
└──────────────────────────────────────────┘
```

### **Exemple 2 : Ahmed (ADMIN) - Demande "Branchement"**

```
Contexte:
- Demande: "Branchement eau potable"
- Statut: VALIDATED ✅
- Type autorisé: [AGENT, CHEF_AGENCE]
- Rôle Ahmed: ADMIN ❌ (pas dans la liste)

Résultat:
Bouton [📄 Document] N'APPARAÎT PAS ❌
Ahmed ne peut PAS générer l'établissement
```

### **Exemple 3 : Fatima (AGENT) - Demande "Branchement"**

```
Contexte:
- Demande: "Branchement eau potable"
- Statut: VALIDATED ✅
- Type autorisé: [AGENT, CHEF_AGENCE]
- Rôle Fatima: AGENT ✅ (dans la liste)

Résultat:
Bouton [📄 Document] APPARAÎT ✅
Fatima PEUT générer l'établissement
```

### **Exemple 4 : Pierre (TECHICO_COMMERCIAL) - Demande "Audit"**

```
Contexte:
- Demande: "Audit technique"
- Statut: VALIDATED ✅
- Type autorisé: [TECHICO_COMMERCIAL]
- Rôle Pierre: TECHICO_COMMERCIAL ✅ (dans la liste)

Résultat:
Bouton [📄 Document] APPARAÎT ✅
Pierre PEUT générer l'établissement
```

### **Exemple 5 : Mohamed (CHEF_AGENCE) - Demande "Audit"**

```
Contexte:
- Demande: "Audit technique"
- Statut: VALIDATED ✅
- Type autorisé: [TECHICO_COMMERCIAL]
- Rôle Mohamed: CHEF_AGENCE ❌ (pas dans la liste)

Résultat:
Bouton [📄 Document] N'APPARAÎT PAS ❌
Mohamed ne peut PAS générer l'établissement
```

---

## 🎨 Workflow Utilisateur

### **Cas 1 : Utilisateur Autorisé**

```
1. Utilisateur accède au Registre des Demandes
   ↓
2. Voit une demande avec statut VALIDATED ✅
   ↓
3. Le système vérifie :
   - Statut = VALIDATED ? ✅ OUI
   - Utilisateur dans allowedRoles du type ? ✅ OUI
   ↓
4. Bouton [📄 Document] VISIBLE ✅
   ↓
5. Clique sur le bouton
   ↓
6. Confirmation SweetAlert2
   ↓
7. Document A4 généré et imprimé
   ↓
8. Notification badge apparaît pour ADMIN/CHEF_CENTRE/TECHICO_COMMERCIAL
```

### **Cas 2 : Utilisateur NON Autorisé**

```
1. Utilisateur accède au Registre des Demandes
   ↓
2. Voit une demande avec statut VALIDATED ✅
   ↓
3. Le système vérifie :
   - Statut = VALIDATED ? ✅ OUI
   - Utilisateur dans allowedRoles du type ? ❌ NON
   ↓
4. Bouton [📄 Document] CACHÉ ❌
   ↓
5. Utilisateur ne voit PAS le bouton
   ↓
6. Ne peut PAS générer l'établissement
```

---

## 📝 Code Détaillé

### **Fonction de Vérification :**

```typescript
const canGenerateQuoteEstablishment = (
  request: WorkRequest,
  currentUser: User,
  workTypes: WorkType[]
): boolean => {
  // Condition 1: Statut VALIDATED
  if (request.status !== RequestStatus.VALIDATED) {
    return false;
  }
  
  // Condition 2: Utilisateur autorisé pour ce type
  const workType = workTypes.find(wt => 
    wt.label.toLowerCase() === request.serviceType.toLowerCase()
  );
  
  if (!workType?.allowedRoles || workType.allowedRoles.length === 0) {
    return false; // Aucun rôle défini = personne ne peut
  }
  
  const isAllowed = workType.allowedRoles.includes(currentUser.role);
  
  return isAllowed;
};
```

### **Implémentation dans le JSX :**

```typescript
{(() => {
  // Vérifier les permissions pour ce type de travaux
  const workType = workTypes.find(wt => 
    wt.label.toLowerCase() === req.serviceType.toLowerCase()
  );
  
  const isAllowedForWorkType = workType?.allowedRoles && workType.allowedRoles.length > 0 
    ? workType.allowedRoles.includes(currentUser?.role)
    : false;
  
  // Afficher uniquement si VALIDATED ET utilisateur autorisé
  return req.status === RequestStatus.VALIDATED && isAllowedForWorkType ? (
    <button 
      onClick={() => {
        Swal.fire({
          title: 'Générer la Demande d\'Établissement de Devis',
          text: `Cette action va générer un document officiel...`,
          icon: 'info',
          showCancelButton: true,
          confirmButtonColor: '#059669',
          confirmButtonText: '✅ Générer le document'
        }).then((result) => {
          if (result.isConfirmed) {
            setPrintingQuoteEstablishment(req);
          }
        });
      }} 
      className="text-emerald-600 hover:text-emerald-700 ..."
      title="Générer la demande d'établissement de devis"
    >
      📄
    </button>
  ) : null;
})()}
```

---

## 🔍 Comparaison Avant/Après

| Aspect | Avant ❌ | Après ✅ |
|--------|---------|----------|
| **Condition** | Statut VALIDATED uniquement | Statut VALIDATED + Permissions type |
| **Utilisateurs** | TOUS si VALIDATED | Uniquement autorisés pour le type |
| **Sécurité** | Faible ❌ | Élevée ✅ |
| **Cohérence** | Incohérent ❌ | Cohérent avec impression ✅ |
| **Workflow** | Brisé ❌ | Complet et logique ✅ |

---

## 🎯 Avantages de Cette Approche

| Avantage | Description |
|----------|-------------|
| **Sécurité** | ✅ Seuls les utilisateurs compétents peuvent générer |
| **Cohérence** | ✅ Même logique que l'impression et la création de demandes |
| **Responsabilité** | ✅ Chaque métier gère ses propres documents |
| **Flexibilité** | ✅ Configuration modifiable sans code via l'interface |
| **Traçabilité** | ✅ On sait qui a généré quel document |
| **Workflow** | ✅ Respecte le processus métier complet |

---

## 🔄 Cohérence avec le Système

### **Alignement avec Autres Restrictions :**

```
┌─────────────────────────────────────────────┐
│ IMPRESSION                                  │
│ Réservé aux utilisateurs autorisés          │
│ pour le type de travaux ✅                  │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ GÉNÉRATION ÉTABLISSEMENT                    │
│ Réservé aux utilisateurs autorisés          │
│ pour le type de travaux ✅                  │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ CRÉATION DEMANDES                           │
│ Réservé aux utilisateurs autorisés          │
│ pour le type de travaux ✅                  │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Comment Tester

### **Test 1 : Utilisateur Autorisé**

1. **Se connecter** avec un compte AGENT
2. **Vérifier** que "Branchement eau potable" a AGENT dans allowedRoles
3. **Trouver** une demande "Branchement eau potable" au statut VALIDATED
4. **Vérifier** que le bouton [📄 Document] est VISIBLE ✅
5. **Cliquer** et générer le document

### **Test 2 : Utilisateur NON Autorisé**

1. **Se connecter** avec un compte ADMIN
2. **Vérifier** que "Branchement eau potable" a [AGENT, CHEF_AGENCE] dans allowedRoles
3. **Trouver** une demande "Branchement eau potable" au statut VALIDATED
4. **Vérifier** que le bouton [📄 Document] est CACHÉ ❌
5. **Constater** que ADMIN ne peut PAS générer pour ce type

### **Test 3 : Type Différent**

1. **Se connecter** avec un compte TECHICO_COMMERCIAL
2. **Vérifier** que "Audit technique" a TECHICO_COMMERCIAL dans allowedRoles
3. **Trouver** une demande "Audit technique" au statut VALIDATED
4. **Vérifier** que le bouton [📄 Document] est VISIBLE ✅
5. **Cliquer** et générer le document

---

## 📊 Matrice des Permissions

### **Exemple de Configuration :**

| Type de Travail | Rôles Autorisés | Qui Peut Générer ? |
|-----------------|-----------------|-------------------|
| **Branchement eau potable** | AGENT, CHEF_AGENCE | ✅ AGENT<br>✅ CHEF_AGENCE<br>❌ ADMIN<br>❌ CHEF_CENTRE<br>❌ TECHICO_COMMERCIAL<br>❌ JURISTE |
| **Audit technique** | TECHICO_COMMERCIAL | ✅ TECHICO_COMMERCIAL<br>❌ Autres |
| **Changement compteur** | AGENT, CHEF_AGENCE, CHEF_CENTRE | ✅ AGENT<br>✅ CHEF_AGENCE<br>✅ CHEF_CENTRE<br>❌ Autres |
| **Résiliation contrat** | CHEF_AGENCE, JURISTE | ✅ CHEF_AGENCE<br>✅ JURISTE<br>❌ Autres |

---

## 💡 Impact sur le Workflow

### **Workflow Complet Corrigé :**

```
1. Création demande par utilisateur autorisé ✅
   ↓
2. Validations (Chef d'Agence, Clientèle, Juriste) ✅
   ↓
3. Statut passe à VALIDATED ✅
   ↓
4. Seuls utilisateurs autorisés pour le type voient [📄 Document] ✅
   ↓
5. Génération demande d'établissement ✅
   ↓
6. Notification badge pour ADMIN/CHEF_CENTRE/TECHICO_COMMERCIAL ✅
   ↓
7. Création du devis par utilisateurs autorisés ✅
   ↓
8. Statut passe à QUOTED ✅
```

---

## 📚 Résumé des Fichiers Modifiés

| Fichier | Modification | Impact |
|---------|--------------|--------|
| `WorkRequestList.tsx` | + Vérification workType.allowedRoles | 🔒 Sécurité renforcée |
| `WorkRequestList.tsx` | + Double condition (VALIDATED + allowedRoles) | ✅ Cohérence métier |
| `NOTIFICATION_ETABLISSEMENT_DEVIS.md` | 📖 Documentation mise à jour | 📚 Guide utilisateur |

---

## 🎯 Conclusion

Cette correction assure que **chaque métier ne peut générer des demandes d'établissement que pour les types de travaux qui le concernent**, garantissant ainsi :

✅ **Sécurité** : Contrôle d'accès basé sur les compétences  
✅ **Cohérence** : Aligné avec l'impression et la création de demandes  
✅ **Responsabilité** : Chaque métier est responsable de ses documents  
✅ **Conformité** : Respect des procédures administratives  

---

**Dernière mise à jour :** 31 Mars 2026  
**Version :** 4.1.0 - Avec restriction par type de travaux  
**Fichiers modifiés :** `components/WorkRequestList.tsx`
