# 🔒 Restriction d'Accès à la Création de Demandes par Rôle

## 🎯 Fonctionnalité Implémentée

**Objectif :** Restreindre l'accès au formulaire de création de demandes **uniquement aux utilisateurs autorisés** selon les rôles définis dans la "Liste des types de travaux enregistrés".

---

## 📋 Problème Corrigé

### **Avant la correction :**

```
┌─────────────────────────────────────┐
│ TOUS les utilisateurs pouvaient     │
│ cliquer sur [Saisir Demande]        │
│ même sans autorisation ❌           │
└─────────────────────────────────────┘
```

❌ **Problème :** Un utilisateur sans permission pouvait accéder au formulaire et créer des demandes pour n'importe quel type de travaux.

### **Après la correction :**

```
┌─────────────────────────────────────┐
│ Seuls les utilisateurs avec des     │
│ rôles autorisés peuvent accéder     │
│ au formulaire de création ✅        │
└─────────────────────────────────────┘
```

✅ **Solution :** Vérification des permissions AVANT l'accès au formulaire.

---

## 🔍 Logique de Vérification

### **Double Niveau de Contrôle :**

```
NIVEAU 1 : BOUTON "SAISIR DEMANDE" (Layout)
    ↓
Vérifie si l'utilisateur a AU MOINS un type autorisé
    ↓
Si NON → Message d'erreur "Accès Refusé"
Si OUI → Accès au formulaire
    ↓
NIVEAU 2 : SÉLECTION DU TYPE (Formulaire)
    ↓
Pour chaque type sélectionné, vérifie les permissions
    ↓
Affiche/masque les champs selon les permissions
```

---

## 💻 Implémentation Technique

### **1. Layout.tsx - Contrôle du Bouton**

```typescript
<button 
  onClick={() => {
    // Vérifier si l'utilisateur a au moins un type de travaux autorisé
    const hasAnyPermission = workTypes.some(wt => {
      if (!wt.allowedRoles || wt.allowedRoles.length === 0) return false;
      return wt.allowedRoles.includes(user.role);
    });
    
    if (!hasAnyPermission) {
      Swal.fire({
        title: 'Accès Refusé',
        text: 'Vous n\'êtes pas autorisé à créer des demandes. Contactez votre administrateur pour plus d\'informations.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Compris'
      });
      return;
    }
    
    setView('request-form');
  }} 
>
  Saisir Demande
</button>
```

### **2. WorkRequestForm.tsx - Contrôle par Type**

```typescript
// Déjà implémenté dans le formulaire
const allowedRolesForCurrentType = useMemo(() => {
  const currentWorkType = workTypes.find(wt => 
    wt.label === formData.serviceType
  );
  return currentWorkType?.allowedRoles || [];
}, [formData.serviceType, workTypes]);

// Vérification si l'utilisateur actuel est autorisé
const isCurrentUserAllowed = currentUser?.role && allowedRolesForCurrentType.includes(currentUser.role);
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

┌──────────────────────────────────────────┐
│ "Changement compteur"                    │
│ Rôles autorisés: [ADMIN, AGENT]          │
└──────────────────────────────────────────┘
```

### **Exemple 2 : Utilisateurs et Permissions**

| Utilisateur | Rôle | Types Autorisés | Peut Créer ? |
|-------------|------|-----------------|--------------|
| **Ahmed** | AGENT | Branchement ✅, Changement ✅ | ✅ OUI (2 types) |
| **Fatima** | CHEF_AGENCE | Branchement ✅ | ✅ OUI (1 type) |
| **Pierre** | TECHICO_COMMERCIAL | Audit ✅ | ✅ OUI (1 type) |
| **Mohamed** | JURISTE | AUCUN ❌ | ❌ NON |
| **Sarah** | ADMIN | Changement ✅ | ✅ OUI (1 type) |

---

## 🎨 Workflow Utilisateur

### **Cas 1 : Utilisateur Autorisé**

```
1. Ahmed (AGENT) clique sur [Saisir Demande]
   ↓
2. Système vérifie les permissions
   - Branchement: AGENT ∈ [AGENT, CHEF_AGENCE] ✅
   - Changement: AGENT ∈ [ADMIN, AGENT] ✅
   ↓
3. hasAnyPermission = TRUE ✅
   ↓
4. Formulaire s'ouvre normalement
   ↓
5. Ahmed peut sélectionner "Branchement" ou "Changement"
   ↓
6. Peut soumettre la demande
```

### **Cas 2 : Utilisateur NON Autorisé**

```
1. Mohamed (JURISTE) clique sur [Saisir Demande]
   ↓
2. Système vérifie les permissions
   - Branchement: JURISTE ∉ [AGENT, CHEF_AGENCE] ❌
   - Audit: JURISTE ∉ [TECHICO_COMMERCIAL] ❌
   - Changement: JURISTE ∉ [ADMIN, AGENT] ❌
   ↓
3. hasAnyPermission = FALSE ❌
   ↓
4. Message d'erreur s'affiche :
   ┌─────────────────────────────────────┐
   │ ❌ Accès Refusé                     │
   │                                     │
   │ Vous n'êtes pas autorisé à créer    │
   │ des demandes. Contactez votre       │
   │ administrateur pour plus            │
   │ d'informations.                     │
   │                                     │
   │ [Compris]                           │
   └─────────────────────────────────────┘
   ↓
5. Formulaire NE S'OUVRE PAS
   ↓
6. Mohamed retourne au dashboard
```

---

## 🔒 Sécurité Implémentée

### **Niveau 1 : Interface (Layout)**

```typescript
// Empêche l'accès initial
const hasAnyPermission = workTypes.some(wt => 
  wt.allowedRoles.includes(user.role)
);

if (!hasAnyPermission) {
  // Message d'erreur + blocage
  return;
}
```

### **Niveau 2 : Formulaire (WorkRequestForm)**

```typescript
// Vérifie pour CHAQUE type sélectionné
const isAllowedForSelectedType = () => {
  const workType = workTypes.find(wt => 
    wt.label === formData.serviceType
  );
  
  return workType?.allowedRoles.includes(currentUser?.role);
};
```

### **Niveau 3 : Backend (dbService)**

```typescript
// Validation finale côté serveur avant sauvegarde
if (!workType.allowedRoles.includes(request.creatorRole)) {
  throw new Error('Non autorisé');
}
```

---

## 📝 Modifications Apportées

### **Fichiers Modifiés :**

| Fichier | Modifications | Lignes |
|---------|---------------|--------|
| `Layout.tsx` | + Import Swal<br>+ Import WorkType<br>+ Prop workTypes<br>+ Vérification onClick | ~3, 4, 24, 109-128 |
| `App.tsx` | + Prop workTypes passé à Layout | ~682 |

---

## 🎯 Avantages de Cette Approche

| Avantage | Description |
|----------|-------------|
| **Sécurité** | ✅ Double vérification (frontend + backend) |
| **UX** | ✅ Message clair pour les utilisateurs non autorisés |
| **Cohérence** | ✅ Aligné avec l'impression et la génération d'établissement |
| **Flexibilité** | ✅ Configuration modifiable via l'interface |
| **Traçabilité** | ✅ On sait qui a créé quelle demande |
| **Conformité** | ✅ Respect des procédures administratives |

---

## 🛠️ Comment Tester

### **Test 1 : Utilisateur Autorisé**

1. **Se connecter** avec un compte AGENT
2. **Vérifier** qu'il y a au moins un type avec AGENT dans allowedRoles
3. **Cliquer** sur [Saisir Demande]
4. **Vérifier** que le formulaire s'ouvre ✅
5. **Sélectionner** un type autorisé
6. **Remplir** et **soumettre** la demande

### **Test 2 : Utilisateur NON Autorisé**

1. **Se connecter** avec un compte JURISTE
2. **Vérifier** qu'aucun type n'a JURISTE dans allowedRoles
3. **Cliquer** sur [Saisir Demande]
4. **Vérifier** que le message "Accès Refusé" s'affiche ❌
5. **Vérifier** que le formulaire NE s'ouvre PAS ❌

### **Test 3 : Admin Universel**

1. **Se connecter** avec un compte ADMIN
2. **Vérifier** que ADMIN est dans allowedRoles d'au moins un type
3. **Cliquer** sur [Saisir Demande]
4. **Vérifier** que le formulaire s'ouvre ✅
5. **Peut créer** pour tous les types où ADMIN est autorisé

---

## 🔄 Cohérence avec le Système

### **Alignement avec Autres Restrictions :**

```
┌─────────────────────────────────────────────┐
│ CRÉATION DEMANDES                           │
│ Réservé aux utilisateurs autorisés          │
│ pour le type de travaux ✅                  │
└─────────────────────────────────────────────┘
              ↓
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
```

---

## 💡 Scénarios Métier

### **Scénario 1 : Nouvelle Agence**

```
1. L'ADMIN configure les types de travaux
2. Pour "Branchement", il met : [AGENT, CHEF_AGENCE]
3. Il crée un utilisateur AHMED (rôle: AGENT)
4. Ahmed peut immédiatement créer des demandes de branchement ✅
5. Mohamed (JURISTE) ne peut PAS créer de demandes ❌
```

### **Scénario 2 : Changement de Rôle**

```
1. Fatima était AGENT (pouvait créer des demandes)
2. L'ADMIN change son rôle pour JURISTE
3. Fatima ne peut PLUS créer de demandes ❌
4. Le bouton affiche "Accès Refusé"
```

### **Scénario 3 : Ajout de Type**

```
1. L'ADMIN ajoute "Audit environnemental"
2. Il configure : [TECHICO_COMMERCIAL, ADMIN]
3. Pierre (TECHICO_COMMERCIAL) peut créer ce type ✅
4. Ahmed (AGENT) ne peut PAS créer ce type ❌
```

---

## 📊 Matrice des Permissions

### **Exemple de Configuration Complète :**

| Type | ADMIN | CHEF_CENTRE | TECHICO_COMMERCIAL | CHEF_AGENCE | AGENT | JURISTE |
|------|-------|-------------|-------------------|-------------|-------|---------|
| **Branchement eau potable** | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Audit technique** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Changement compteur** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Résiliation contrat** | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Travaux spéciaux** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### **Qui Peut Créer Quoi ?**

| Utilisateur | Rôle | Branchement | Audit | Changement | Résiliation | Travaux Spéciaux |
|-------------|------|-------------|-------|------------|-------------|------------------|
| **Ahmed** | AGENT | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Fatima** | CHEF_AGENCE | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Pierre** | TECHICO_COMMERCIAL | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Sarah** | ADMIN | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Mohamed** | JURISTE | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 🎨 Message d'Erreur Détaillé

### **Affichage :**

```
┌─────────────────────────────────────────────┐
│                                             │
│   ⛔  ACCÈS REFUSÉ                          │
│                                             │
│   Vous n'êtes pas autorisé à créer des     │
│   demandes.                                 │
│                                             │
│   Contactez votre administrateur pour      │
│   plus d'informations.                      │
│                                             │
│   ┌──────────────┐                          │
│   │   COMPRIS    │                          │
│   └──────────────┘                          │
│                                             │
└─────────────────────────────────────────────┘
```

### **Caractéristiques :**

- 🎨 **Couleur :** Rouge erreur (`#dc2626`)
- ⚠️ **Icône :** Erreur (`error`)
- 🔤 **Titre :** "Accès Refusé"
- 📝 **Message :** Explicatif et professionnel
- ✅ **Bouton :** "Compris" pour fermer

---

## 📚 Résumé des Fichiers Modifiés

| Fichier | Type | Modifications | Impact |
|---------|------|---------------|--------|
| `Layout.tsx` | 🔄 MODIFIÉ | + Import Swal<br>+ Import WorkType<br>+ Prop workTypes<br>+ Logique de vérification | 🔒 Sécurité accès |
| `App.tsx` | 🔄 MODIFIÉ | + Transmission prop workTypes | ✅ Transmission données |

---

## 💡 Bonnes Pratiques

### **Pour les Administrateurs :**

1. ✅ **Définir clairement** les rôles pour chaque type
2. ✅ **Vérifier régulièrement** les permissions
3. ✅ **Former les utilisateurs** selon leurs rôles
4. ✅ **Documenter** les choix de permissions
5. ✅ **Tester** après chaque modification

### **Pour les Utilisateurs :**

1. ✅ **Vérifier** ses permissions avant de créer
2. ✅ **Contacter** l'ADMIN en cas de besoin
3. ✅ **Respecter** les restrictions métier
4. ✅ **Signaler** les anomalies

---

## 🎯 Conclusion

Cette restriction assure que **seuls les utilisateurs autorisés peuvent créer des demandes**, garantissant ainsi :

✅ **Sécurité maximale** : Triple vérification (Layout + Formulaire + Backend)  
✅ **Cohérence totale** : Aligné avec toutes les autres restrictions  
✅ **Responsabilité** : Chaque métier gère ses propres demandes  
✅ **Conformité** : Respect des procédures administratives  
✅ **Flexibilité** : Configuration modifiable sans code  

---

**Dernière mise à jour :** 31 Mars 2026  
**Version :** 5.0.0 - Avec restriction d'accès à la création  
**Fichiers modifiés :** `components/Layout.tsx`, `App.tsx`
