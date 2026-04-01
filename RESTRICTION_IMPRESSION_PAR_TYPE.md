# 🔒 Restriction d'Impression par Type de Travaux - AEP Manager

## 🎯 Fonctionnalité Implémentée

**Objectif :** Réserver l'impression des demandes aux utilisateurs autorisés **pour chaque type de travail spécifique**, selon la configuration définie dans le formulaire "Liste des types de travaux enregistrés".

---

## 📋 Modifications Apportées

### 1️⃣ **WorkRequestList.tsx** - Gestion dynamique des permissions

#### **Avant :**
```typescript
// Ancienne logique - Rôles en dur
{(currentUser?.role === UserRole.ADMIN || 
  currentUser?.role === UserRole.CHEF_CENTRE || 
  currentUser?.role === UserRole.TECHICO_COMMERCIAL) && (
  <button>Imprimer</button>
)}
```

#### **Après :**
```typescript
// Nouvelle logique - Basée sur workTypes.allowedRoles
{(() => {
  // Vérifier si l'utilisateur actuel est autorisé pour ce type de travail spécifique
  const workType = workTypes.find(wt => 
    wt.label.toLowerCase() === req.serviceType.toLowerCase()
  );
  
  const isAllowedForWorkType = workType?.allowedRoles && workType.allowedRoles.length > 0 
    ? workType.allowedRoles.includes(currentUser?.role)
    : false;
  
  return isAllowedForWorkType ? (
    <button>Imprimer</button>
  ) : null;
})()}
```

---

### 2️⃣ **App.tsx** - Transmission du prop `workTypes`

**Ajout dans le composant WorkRequestList :**
```typescript
<WorkRequestList 
  requests={requests} 
  agencies={agencies}
  centres={centres}
  users={users}
  workTypes={workTypes}  // ← NOUVEAU
  onDelete={handleDeleteRequest} 
  // ... autres props
/>
```

---

## 🎨 Interface Utilisateur

### **Formulaire "Liste des types de travaux enregistrés"**

Dans ce formulaire, l'administrateur configure les rôles autorisés pour chaque type de travail :

```
┌─────────────────────────────────────────┐
│ Type: Branchement eau potable           │
│                                         │
│ Accès Autorisés:                        │
│ ☑ AGENT                                 │
│ ☑ CHEF_AGENCE                           │
│ ☐ CHEF_CENTRE                           │
│ ☐ TECHICO_COMMERCIAL                    │
│ ☐ JURISTE                               │
│ ☐ ADMIN                                 │
└─────────────────────────────────────────┘
```

### **Résultat dans le Registre des Demandes**

#### **Cas 1 : Utilisateur autorisé pour CE type de travail**
```
Demande: "Branchement eau potable"
Type configuré avec: [AGENT] [CHEF_AGENCE]

→ AGENT voit: [📄 Imprimer] ✅
→ CHEF_AGENCE voit: [📄 Imprimer] ✅
→ CHEF_CENTRE ne voit PAS: [📄 Imprimer] ❌
```

#### **Cas 2 : Utilisateur NON autorisé pour CE type de travail**
```
Demande: "Audit technique"
Type configuré avec: [TECHICO_COMMERCIAL] [CHEF_AGENCE]

→ AGENT ne voit PAS: [📄 Imprimer] ❌
→ CHEF_AGENCE voit: [📄 Imprimer] ✅
→ TECHICO_COMMERCIAL voit: [📄 Imprimer] ✅
```

---

## 🔄 Workflow Complet

### **Étape 1 : Configuration des Types de Travaux**
```
ADMIN se connecte
    ↓
Menu → Paramètres → Types de travaux
    ↓
Pour chaque type, sélectionne les rôles autorisés :
- "Branchement eau potable" → [AGENT, CHEF_AGENCE]
- "Audit technique" → [TECHICO_COMMERCIAL, CHEF_AGENCE]
- "Résiliation contrat" → [CHEF_AGENCE, JURISTE]
    ↓
Enregistrement dans workTypes[]
```

### **Étape 2 : Création d'une Demande**
```
Utilisateur crée une demande
    ↓
Sélectionne le type: "Branchement eau potable"
    ↓
La demande est sauvegardée avec:
{
  serviceType: "Branchement eau potable",
  // ... autres champs
}
```

### **Étape 3 : Affichage dans le Registre**
```
Registre des Demandes charge
    ↓
Pour chaque demande :
  1. Trouve le workType correspondant
  2. Vérifie workType.allowedRoles
  3. Compare avec currentUser.role
  4. Affiche/masque le bouton [📄 Imprimer]
```

---

## 📊 Exemples Concrets

### **Exemple 1 : Configuration Standard**

| Type de Travail | Rôles Autorisés | Qui Peut Imprimer ? |
|-----------------|-----------------|---------------------|
| **Branchement eau potable** | AGENT, CHEF_AGENCE | ✅ AGENT<br>✅ CHEF_AGENCE<br>❌ Autres |
| **Audit technique** | TECHICO_COMMERCIAL | ✅ TECHICO_COMMERCIAL<br>❌ Autres |
| **Changement compteur** | AGENT, CHEF_AGENCE, CHEF_CENTRE | ✅ AGENT<br>✅ CHEF_AGENCE<br>✅ CHEF_CENTRE<br>❌ Autres |

### **Exemple 2 : Scénario Réel**

```
Contexte:
- Ahmed est AGENT
- Fatima est CHEF_CENTRE
- Pierre est TECHICO_COMMERCIAL

Configuration:
- "Branchement eau potable" → [AGENT, CHEF_AGENCE]
- "Audit technique" → [TECHICO_COMMERCIAL]

Résultat:
┌──────────────────────────────────────────────┐
│ Demande #1: Branchement - M. Dupont          │
│ Type: Branchement eau potable                │
│                                              │
│ Ahmed (AGENT) voit:                          │
│   [📄 Imprimer] ✅                            │
│                                              │
│ Fatima (CHEF_CENTRE) voit:                   │
│   [📄 Imprimer] ❌ (PAS dans allowedRoles)    │
│                                              │
│ Pierre (TECHICO_COMMERCIAL) voit:            │
│   [📄 Imprimer] ❌ (PAS dans allowedRoles)    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Demande #2: Audit - Société BATI             │
│ Type: Audit technique                        │
│                                              │
│ Ahmed (AGENT) voit:                          │
│   [📄 Imprimer] ❌ (PAS dans allowedRoles)    │
│                                              │
│ Fatima (CHEF_CENTRE) voit:                   │
│   [📄 Imprimer] ❌ (PAS dans allowedRoles)    │
│                                              │
│ Pierre (TECHICO_COMMERCIAL) voit:            │
│   [📄 Imprimer] ✅                            │
└──────────────────────────────────────────────┘
```

---

## 🔍 Logique Technique

### **Fonction de Vérification**

```typescript
const isAllowedForWorkType = (
  serviceType: string,
  userRole: UserRole,
  workTypes: WorkType[]
): boolean => {
  // 1. Trouver le type de travail correspondant
  const workType = workTypes.find(wt => 
    wt.label.toLowerCase() === serviceType.toLowerCase()
  );
  
  // 2. Vérifier s'il a des rôles autorisés définis
  if (!workType?.allowedRoles || workType.allowedRoles.length === 0) {
    return false; // Aucun rôle défini = personne ne peut imprimer
  }
  
  // 3. Vérifier si le rôle de l'utilisateur est dans la liste
  return workType.allowedRoles.includes(userRole);
};
```

### **Structure de Données**

```json
{
  "id": "WT-001",
  "label": "Branchement eau potable",
  "allowedRoles": [
    "AGENT",
    "CHEF_AGENCE"
  ]
}
```

---

## 💡 Avantages de Cette Approche

| Aspect | Ancien Système | Nouveau Système |
|--------|----------------|-----------------|
| **Flexibilité** | ❌ Rôles en dur | ✅ Configurable par type |
| **Précision** | ❌ Tous ou rien | ✅ Au cas par cas |
| **Administration** | ❌ Code à modifier | ✅ Formulaire UI |
| **Évolutivité** | ❌ Complexe | ✅ Simple et rapide |
| **Sécurité** | ❌ Générale | ✅ Spécifique par métier |

---

## 🛠️ Comment Configurer

### **Pour un Administrateur :**

1. **Se connecter** en tant qu'ADMIN
2. **Accéder à** : Menu → Paramètres → Types de travaux
3. **Sélectionner** un type de travail existant ou en créer un nouveau
4. **Cocher** les rôles autorisés pour ce type :
   - ☑ AGENT
   - ☑ CHEF_AGENCE
   - ☐ CHEF_CENTRE
   - ☐ TECHICO_COMMERCIAL
   - ☐ JURISTE
   - ☐ ADMIN
5. **Sauvegarder**
6. **Tester** : Se connecter avec différents rôles et vérifier le bouton d'impression

---

## 📝 Cas Particuliers

### **Cas 1 : Type sans rôles autorisés**
```typescript
workType.allowedRoles = []
// Résultat : Personne ne voit le bouton d'impression
```

### **Cas 2 : Type non trouvé**
```typescript
workType = undefined
// Résultat : Personne ne voit le bouton d'impression
```

### **Cas 3 : Tous rôles autorisés**
```typescript
workType.allowedRoles = Object.values(UserRole)
// Résultat : Tout le monde voit le bouton d'impression
```

---

## 🎯 Impact sur les Utilisateurs

### **Pour les Utilisateurs :**
- ✅ **Personnalisation** : Chaque métier voit ses propres documents
- ✅ **Clarté** : Pas de confusion sur qui fait quoi
- ✅ **Responsabilité** : Chacun gère son domaine

### **Pour les Administrateurs :**
- ✅ **Contrôle** : Gestion fine des permissions
- ✅ **Flexibilité** : Modification sans code
- ✅ **Traçabilité** : Configuration visible dans l'UI

---

## 🔄 Cohérence avec le Système

Cette restriction s'aligne avec :
- ✅ **Workflow de validation** : Rôles définis par type
- ✅ **Création de devis** : Permissions cohérentes
- ✅ **Gestion des accès** : Basée sur les métiers
- ✅ **Sécurité** : Principe du moindre privilège

---

## 📊 Résumé des Fichiers Modifiés

| Fichier | Modifications | Lignes |
|---------|---------------|--------|
| `WorkRequestList.tsx` | + Import WorkType<br>+ Prop workTypes<br>+ Logique dynamique | ~8, 13, 26, 758-780 |
| `App.tsx` | + Prop workTypes passé au composant | ~645 |

---

**Dernière mise à jour :** 31 Mars 2026  
**Version :** 2.0.0 - Avec gestion dynamique par type de travaux  
**Fichiers modifiés :** `components/WorkRequestList.tsx`, `App.tsx`
