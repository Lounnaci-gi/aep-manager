# Gestion des Rôles pour les Devis par Type de Travaux

## 📋 Vue d'Ensemble

Cette fonctionnalité permet de configurer **séparément** les rôles autorisés pour :
1. **Créer** un type de travaux (demande)
2. **Créer** des devis pour ce type de travaux
3. **Valider** les devis pour ce type de travaux

## 🎯 Problème Résolu

**Avant :**
- Un seul champ `allowedRoles` gérait toutes les permissions
- Impossible de différencier les rôles de création de demande et de création de devis
- Tous les utilisateurs pouvant créer une demande pouvaient implicitement gérer les devis

**Maintenant :**
- 3 champs distincts pour un contrôle granulaire
- Flexibilité totale dans la gestion des permissions
- Séparation claire des responsabilités

## 🔧 Modification des Types

### Interface WorkType Mise à Jour

```typescript
export interface WorkType {
  id: string;
  name?: string;
  description?: string;
  label?: string;
  allowedRoles?: UserRole[]; // Rôles autorisés à créer ce type de travail
  quoteAllowedRoles?: UserRole[]; // Rôles autorisés à créer des devis pour ce type
  quoteValidationRoles?: UserRole[]; // Rôles autorisés à valider les devis pour ce type
}
```

### Champs Ajoutés

1. **`quoteAllowedRoles`** : Rôles pouvant **créer** des devis
   - Exemple : `Technico-Commerciale`, `Chef-Centre`

2. **`quoteValidationRoles`** : Rôles pouvant **valider** des devis
   - Exemple : `Chef-Centre`, `Administrateur`

## 💻 Interface Utilisateur

### Formulaire d'Ajout/Modification

Trois sections distinctes avec code couleur :

1. **📝 Rôles - Création Demande** (Bleu)
   - Qui peut créer ce type de demande de travaux

2. **💰 Rôles - Création Devis** (Vert)
   - Qui peut établir un devis pour ce type

3. **✓ Rôles - Validation Devis** (Violet)
   - Qui peut valider/approuver un devis

### Affichage dans la Liste

Les badges colorés montrent clairement les rôles :

```
Branchement d'eau Potable
📝 Agent  📝 Chef-Agence  💰 Technico-Commerciale  ✓ Chef-Centre
```

## 📝 Exemple de Configuration

### Branchement d'Eau Potable

```typescript
{
  id: "WT-001",
  label: "Branchement d'eau Potable",
  allowedRoles: [UserRole.AGENT, UserRole.CHEF_AGENCE],
  quoteAllowedRoles: [UserRole.TECHICO_COMMERCIAL, UserRole.CHEF_CENTRE],
  quoteValidationRoles: [UserRole.CHEF_CENTRE, UserRole.ADMIN]
}
```

**Signification :**
- 📝 **Agent** et **Chef-Agence** peuvent créer des demandes
- 💰 **Technico-Commerciale** et **Chef-Centre** peuvent créer des devis
- ✓ **Chef-Centre** et **Admin** peuvent valider les devis

### Réparation Fuite (Simple)

```typescript
{
  id: "WT-002",
  label: "Réparation fuite",
  allowedRoles: [UserRole.AGENT, UserRole.CHEF_AGENCE],
  quoteAllowedRoles: [], // Pas de devis requis
  quoteValidationRoles: []
}
```

## 🚀 Utilisation dans le Code

### Vérifier si un utilisateur peut créer un devis

```typescript
import { WorkType, UserRole } from '../types';

function canCreateQuote(workType: WorkType, userRole: UserRole): boolean {
  // Si aucun rôle spécifique n'est défini, utiliser les rôles de création
  const allowedRoles = workType.quoteAllowedRoles?.length > 0 
    ? workType.quoteAllowedRoles 
    : workType.allowedRoles || [];
  
  return allowedRoles.includes(userRole);
}

// Exemple
const workType = workTypes.find(wt => wt.label === "Branchement d'eau Potable");
if (canCreateQuote(workType, currentUser.role)) {
  // Afficher le bouton "Créer Devis"
}
```

### Vérifier si un utilisateur peut valider un devis

```typescript
function canValidateQuote(workType: WorkType, userRole: UserRole): boolean {
  const validationRoles = workType.quoteValidationRoles || [];
  return validationRoles.includes(userRole);
}
```

## 🔄 Migration des Données Existantes

Pour les types de travaux existants qui n'ont pas les nouveaux champs :

```typescript
// Migration automatique
workTypes.forEach(workType => {
  if (!workType.quoteAllowedRoles) {
    // Par défaut : mêmes rôles que la création de demande
    workType.quoteAllowedRoles = workType.allowedRoles || [];
  }
  if (!workType.quoteValidationRoles) {
    // Par défaut : Admin et Chef-Centre
    workType.quoteValidationRoles = [UserRole.ADMIN, UserRole.CHEF_CENTRE];
  }
});
```

## 🎓 Bonnes Pratiques

### 1. Séparation des Responsabilités

```
✅ RECOMMANDÉ :
- Demande : Agent, Chef-Agence (terrain)
- Devis : Technico-Commerciale (bureau d'études)
- Validation : Chef-Centre (direction)

❌ À ÉVITER :
- Donner tous les rôles à tous les utilisateurs
```

### 2. Workflows Sans Devis

Pour les travaux urgents ne nécessitant pas de devis :

```typescript
{
  label: "Réparation urgente",
  allowedRoles: [UserRole.AGENT],
  quoteAllowedRoles: [], // Tableau vide = pas de devis
  quoteValidationRoles: []
}
```

### 3. Rôles par Défaut

Si `quoteAllowedRoles` n'est pas défini :
- Le système utilise `allowedRoles` comme fallback
- Cela assure la compatibilité avec l'ancien système

## 🔍 Intégration avec le Workflow Engine

Le moteur de workflow utilise automatiquement ces rôles :

```typescript
import { WorkflowEngine } from '../services/workflowEngine';

// Le workflow vérifie automatiquement les rôles de devis
const canCreateQuote = WorkflowEngine.canPerformAction(
  request,
  currentUser.role,
  WorkflowStepType.QUOTATION
);

if (canCreateQuote.allowed) {
  // L'utilisateur peut créer un devis selon quoteAllowedRoles
}
```

## 📊 Scénarios d'Utilisation

### Scénario 1 : Entreprise avec Séparation Stricte

```
Agent Terrain → Crée la demande
     ↓
Technico-Commercial → Étudie et crée le devis
     ↓
Chef Centre → Valide le devis
     ↓
Agent → Transmet au client
```

### Scénario 2 : Petite Équipe (Rôles Combinés)

```
Chef Agence → Crée la demande ET le devis
     ↓
Chef Centre → Valide le devis
```

### Scénario 3 : Travaux Urgents (Sans Devis)

```
Agent → Crée la demande
     ↓
Chef Agence → Valide et exécute immédiatement
(Pas d'étape devis)
```

## ⚠️ Points d'Attention

1. **Compatibilité Ascendante**
   - Les anciens types de travaux fonctionnent toujours
   - Migration progressive possible

2. **Validation des Rôles**
   - Au moins un rôle doit être défini pour `allowedRoles`
   - `quoteAllowedRoles` et `quoteValidationRoles` sont optionnels

3. **Interface Utilisateur**
   - Les dropdowns peuvent être fermés en cliquant ailleurs
   - Les badges montrent clairement les rôles sélectionnés

## 🎨 Code Couleur

| Type | Couleur | Icône | Usage |
|------|---------|-------|-------|
| Création Demande | 🔵 Bleu | 📝 | Qui peut créer la demande |
| Création Devis | 🟢 Vert | 💰 | Qui peut établir le devis |
| Validation Devis | 🟣 Violet | ✓ | Qui peut valider le devis |

## 📚 Fichiers Modifiés

- `types.ts` - Interface WorkType mise à jour
- `components/WorkTypeManager.tsx` - Interface de gestion des rôles

## 🚀 Prochaines Étapes

1. Intégrer ces rôles dans `QuoteForm.tsx`
2. Mettre à jour les permissions dans `App.tsx`
3. Ajouter des vérifications dans `WorkRequestList.tsx`
4. Documenter les workflows dans la documentation principale

---

**Version** : 1.0  
**Date** : Avril 2026  
**Compatibilité** : AEP Manager v2.0+
