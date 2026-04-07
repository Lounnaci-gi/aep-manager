import { WorkTypeWorkflow, WorkflowStepType, UserRole, ValidationType } from '../types';

// ============================================================================
// Configuration des Workflows par Type de Travaux
// ============================================================================
// Ce fichier centralise la configuration de tous les circuits de validation.
// Pour ajouter un nouveau workflow, créez une nouvelle configuration et ajoutez-la
// au WORKFLOW_REGISTRY ci-dessous.
// ============================================================================

// Workflow pour Branchement d'eau potable (avec validations complètes et devis)
export const BRANCHEMENT_EAU_WORKFLOW: WorkTypeWorkflow = {
  workTypeId: 'branchement-eau',
  workTypeName: "Branchement d'eau Potable",
  requiresQuotation: true,
  steps: [
    {
      step: WorkflowStepType.VALIDATION,
      label: 'Validation Agence',
      requiredRoles: [UserRole.CHEF_AGENCE],
      validationType: ValidationType.AGENCY,
      nextStep: WorkflowStepType.VALIDATION
    },
    {
      step: WorkflowStepType.VALIDATION,
      label: 'Validation Relation Clientèle',
      requiredRoles: [UserRole.AGENT],
      validationType: ValidationType.CUSTOMER_SERVICE,
      nextStep: WorkflowStepType.VALIDATION
    },
    {
      step: WorkflowStepType.VALIDATION,
      label: 'Validation Juriste',
      requiredRoles: [UserRole.JURISTE],
      validationType: ValidationType.LAWYER,
      nextStep: WorkflowStepType.QUOTATION
    },
    {
      step: WorkflowStepType.QUOTATION,
      label: 'Établir Devis',
      requiredRoles: [UserRole.TECHICO_COMMERCIAL, UserRole.CHEF_CENTRE],
      nextStep: WorkflowStepType.PRINTING
    },
    {
      step: WorkflowStepType.PRINTING,
      label: 'Impression Devis',
      requiredRoles: [UserRole.TECHICO_COMMERCIAL, UserRole.CHEF_CENTRE, UserRole.AGENT, UserRole.CHEF_AGENCE],
      nextStep: WorkflowStepType.COMPLETION
    },
    {
      step: WorkflowStepType.COMPLETION,
      label: 'Demande Complétée',
      requiredRoles: [],
      nextStep: undefined
    }
  ]
};

// Workflow pour Réparation (urgence, sans devis)
export const REPARATION_WORKFLOW: WorkTypeWorkflow = {
  workTypeId: 'reparation',
  workTypeName: 'Réparation fuite',
  requiresQuotation: false,
  steps: [
    {
      step: WorkflowStepType.VALIDATION,
      label: 'Validation Agence',
      requiredRoles: [UserRole.CHEF_AGENCE],
      validationType: ValidationType.AGENCY,
      nextStep: WorkflowStepType.COMPLETION
    },
    {
      step: WorkflowStepType.COMPLETION,
      label: 'Demande Complétée',
      requiredRoles: [],
      nextStep: undefined
    }
  ]
};

// Workflow pour Changement de compteur (simple, sans devis)
export const CHANGEMENT_COMPTEUR_WORKFLOW: WorkTypeWorkflow = {
  workTypeId: 'changement-compteur',
  workTypeName: 'Changement compteur',
  requiresQuotation: false,
  steps: [
    {
      step: WorkflowStepType.VALIDATION,
      label: 'Validation Agence',
      requiredRoles: [UserRole.CHEF_AGENCE],
      validationType: ValidationType.AGENCY,
      nextStep: WorkflowStepType.COMPLETION
    },
    {
      step: WorkflowStepType.COMPLETION,
      label: 'Demande Complétée',
      requiredRoles: [],
      nextStep: undefined
    }
  ]
};

// ============================================================================
// Registre de tous les workflows
// ============================================================================
// La clé doit correspondre EXACTEMENT au label du type de travaux (WorkType.label)
// ============================================================================

export const WORKFLOW_REGISTRY: Record<string, WorkTypeWorkflow> = {
  "Branchement d'eau Potable": BRANCHEMENT_EAU_WORKFLOW,
  'Réparation fuite': REPARATION_WORKFLOW,
  'Changement compteur': CHANGEMENT_COMPTEUR_WORKFLOW,
  // Ajoutez d'autres workflows ici selon vos besoins
  // Exemple:
  // 'Extension réseau': EXTENSION_RESEAU_WORKFLOW,
  // 'Déménagement branchement': DEMENAGEMENT_WORKFLOW,
};

// ============================================================================
// Fonctions utilitaires pour accéder aux configurations
// ============================================================================

/**
 * Récupère la configuration du workflow pour un type de travaux donné
 */
export function getWorkflowByType(serviceType: string): WorkTypeWorkflow | null {
  return WORKFLOW_REGISTRY[serviceType] || null;
}

/**
 * Vérifie si un type de travaux a un workflow configuré
 */
export function hasWorkflow(serviceType: string): boolean {
  return serviceType in WORKFLOW_REGISTRY;
}

/**
 * Retourne tous les types de travaux ayant un workflow configuré
 */
export function getWorkflowTypes(): string[] {
  return Object.keys(WORKFLOW_REGISTRY);
}
