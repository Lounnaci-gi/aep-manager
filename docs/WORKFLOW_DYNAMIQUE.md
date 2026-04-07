# Moteur de Workflow Dynamique - Guide d'Utilisation

## 📋 Vue d'Ensemble

Le moteur de workflow dynamique permet de gérer des circuits de validation personnalisés pour chaque type de travaux dans l'application AEP Manager.

## 🏗️ Architecture

### Fichiers Créés

1. **`types.ts`** - Nouvelles interfaces TypeScript
   - `WorkflowStepType` - Énumération des étapes possibles
   - `WorkflowStepConfig` - Configuration d'une étape
   - `WorkTypeWorkflow` - Configuration complète d'un workflow
   - `WorkflowState` - État actuel dans le workflow
   - `PermissionResult` - Résultat de vérification de permission

2. **`services/workflowConfig.ts`** - Configuration des workflows
   - `BRANCHEMENT_EAU_WORKFLOW` - Workflow pour les branchements
   - `REPARATION_WORKFLOW` - Workflow pour les réparations (sans devis)
   - `CHANGEMENT_COMPTEUR_WORKFLOW` - Workflow simple
   - `WORKFLOW_REGISTRY` - Registre central de tous les workflows

3. **`services/workflowEngine.ts`** - Moteur de logique métier
   - `WorkflowEngine.getWorkflow()` - Récupère la configuration
   - `WorkflowEngine.getCurrentStep()` - Détermine l'étape actuelle
   - `WorkflowEngine.canPerformAction()` - Vérifie les permissions
   - `WorkflowEngine.buildInitialValidations()` - Crée les validations initiales
   - `WorkflowEngine.calculateNewStatus()` - Calcule le nouveau statut

4. **`hooks/useWorkflowPermissions.ts`** - Hook React
   - Fournit une interface simple pour vérifier les permissions
   - Retourne l'état actuel, la progression, les actions autorisées

5. **`components/WorkflowTracker.tsx`** - Composant visuel
   - Affiche la progression du workflow
   - Montre les boutons d'action autorisés selon le rôle

## 🚀 Comment Utiliser

### 1. Ajouter un Nouveau Type de Workflow

Dans `services/workflowConfig.ts` :

```typescript
// Créer la configuration
export const MON_WORKFLOW: WorkTypeWorkflow = {
  workTypeId: 'mon-type',
  workTypeName: 'Mon Type de Travaux',
  requiresQuotation: true, // ou false si pas de devis
  steps: [
    {
      step: WorkflowStepType.VALIDATION,
      label: 'Validation Agence',
      requiredRoles: [UserRole.CHEF_AGENCE],
      validationType: ValidationType.AGENCY,
      nextStep: WorkflowStepType.QUOTATION
    },
    {
      step: WorkflowStepType.QUOTATION,
      label: 'Établir Devis',
      requiredRoles: [UserRole.TECHICO_COMMERCIAL],
      nextStep: WorkflowStepType.COMPLETION
    },
    {
      step: WorkflowStepType.COMPLETION,
      label: 'Terminé',
      requiredRoles: [],
      nextStep: undefined
    }
  ]
};

// Ajouter au registre
export const WORKFLOW_REGISTRY: Record<string, WorkTypeWorkflow> = {
  "Branchement d'eau Potable": BRANCHEMENT_EAU_WORKFLOW,
  'Mon Type de Travaux': MON_WORKFLOW, // <-- Ajouter ici
};
```

### 2. Utiliser le Hook dans un Composant

```typescript
import { useWorkflowPermissions } from '../hooks/useWorkflowPermissions';

function MonComposant({ request, currentUser }) {
  const {
    workflow,
    currentStep,
    canValidate,
    canCreateQuote,
    canPrint,
    isComplete,
    progress
  } = useWorkflowPermissions(request, currentUser);

  return (
    <div>
      {canValidate.allowed && (
        <button>Valider</button>
      )}
      {canCreateQuote.allowed && (
        <button>Créer Devis</button>
      )}
    </div>
  );
}
```

### 3. Utiliser le Composant WorkflowTracker

```typescript
import { WorkflowTracker } from './WorkflowTracker';

<WorkflowTracker
  request={maDemande}
  currentUser={{ role: currentUser.role }}
  onValidate={(validationType) => handleValidation(validationType)}
  onCreateQuote={() => handleCreateQuote()}
  onPrint={() => handlePrint()}
/>
```

### 4. Utiliser le Moteur Directement

```typescript
import { WorkflowEngine } from '../services/workflowEngine';

// Vérifier si un utilisateur peut effectuer une action
const result = WorkflowEngine.canPerformAction(
  request,
  UserRole.CHEF_AGENCE,
  WorkflowStepType.VALIDATION
);

if (result.allowed) {
  // Action autorisée
}

// Construire les validations initiales
const validations = WorkflowEngine.buildInitialValidations(request);

// Calculer le nouveau statut après une validation
const newStatus = WorkflowEngine.calculateNewStatus(updatedRequest);
```

## 🎯 Avantages

✅ **Centralisation** : Toute la logique est dans un seul endroit  
✅ **Extensibilité** : Ajouter un workflow = ajouter une config JSON  
✅ **Typage strict** : TypeScript garantit la cohérence  
✅ **Réutilisable** : Hook et moteur utilisables partout  
✅ **Compatible** : Migration progressive sans casser l'existant  
✅ **Maintenable** : Facile à tester et modifier  

## 📊 Workflows Configurés

### 1. Branchement d'Eau Potable
- Validation Agence (Chef d'Agence)
- Validation Relation Clientèle (Agent)
- Validation Juriste (Juriste)
- Établir Devis (Technico-Commercial / Chef de Centre)
- Impression (Plusieurs rôles)
- Complété

### 2. Réparation Fuite
- Validation Agence (Chef d'Agence)
- Complété (pas de devis)

### 3. Changement Compteur
- Validation Agence (Chef d'Agence)
- Complété (pas de devis)

## 🔧 Personnalisation

### Ajouter une Condition de Saut d'Étape

```typescript
{
  step: WorkflowStepType.QUOTATION,
  label: 'Établir Devis',
  requiredRoles: [UserRole.TECHICO_COMMERCIAL],
  skipCondition: (request) => request.amount < 1000, // Ignorer si montant < 1000
  nextStep: WorkflowStepType.COMPLETION
}
```

### Workflow sans Validation

Pour un type de travaux sans validation :

```typescript
{
  workTypeId: 'simple',
  workTypeName: 'Travaux Simple',
  requiresQuotation: false,
  steps: [
    {
      step: WorkflowStepType.COMPLETION,
      label: 'Terminé',
      requiredRoles: [],
      nextStep: undefined
    }
  ]
}
```

## 🐛 Dépannage

### Le workflow ne s'affiche pas
- Vérifier que `request.serviceType` correspond EXACTEMENT à une clé du `WORKFLOW_REGISTRY`
- Vérifier les imports

### Les boutons n'apparaissent pas
- Vérifier que l'utilisateur a le rôle requis dans `requiredRoles`
- Vérifier que c'est l'étape actuelle du workflow

### Erreur de typage TypeScript
- S'assurer que tous les champs requis sont présents dans la configuration
- Vérifier les imports des types

## 📝 Notes Importantes

1. **Correspondance des Labels** : La clé dans `WORKFLOW_REGISTRY` doit correspondre EXACTEMENT au `label` du `WorkType`
2. **Ordre des Étapes** : L'ordre dans le tableau `steps` détermine la progression
3. **Rôles Multiples** : Une étape peut avoir plusieurs rôles autorisés
4. **Validation Type** : Utiliser `validationType` uniquement pour les étapes de validation

## 🎓 Exemples Avancés

### Workflow avec Branchement Conditionnel

```typescript
{
  step: WorkflowStepType.VALIDATION,
  label: 'Validation Directeur',
  requiredRoles: [UserRole.ADMIN],
  validationType: ValidationType.AGENCY,
  skipCondition: (request) => {
    // Ignorer si le montant est faible
    return request.estimatedCost < 5000;
  },
  nextStep: WorkflowStepType.COMPLETION
}
```

### Utiliser avec Context API

```typescript
// Créer un context pour le workflow
export const WorkflowContext = React.createContext(null);

function WorkflowProvider({ children, request, user }) {
  const permissions = useWorkflowPermissions(request, user);
  
  return (
    <WorkflowContext.Provider value={permissions}>
      {children}
    </WorkflowContext.Provider>
  );
}
```

---

**Version** : 1.0  
**Dernière Mise à Jour** : Avril 2026  
**Auteur** : Système AEP Manager
