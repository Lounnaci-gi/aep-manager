import { WorkTypeWorkflow, WorkflowStepType, UserRole, ValidationType, WorkType, WorkflowStepConfig } from '../types';

// ============================================================================
// Configuration des Workflows par Type de Travaux (Dynamique)
// ============================================================================

export const WORKFLOW_REGISTRY: Record<string, WorkTypeWorkflow> = {};

/**
 * Met à jour le registre des workflows en se basant sur les WorkTypes depuis la BD
 */
export function updateWorkflowRegistryFromWorkTypes(workTypes: WorkType[]) {
  // Vider le registre actuel
  for (const key in WORKFLOW_REGISTRY) {
    delete WORKFLOW_REGISTRY[key];
  }
  
  // Re-peupler dynamiquement
  for (const wt of workTypes) {
    if (wt.label) {
      WORKFLOW_REGISTRY[wt.label] = buildWorkflowFromWorkType(wt);
    }
  }
}

/**
 * Génère dynamiquement la configuration complète du workflow à partir d'un type de travaux configuré
 */
export function buildWorkflowFromWorkType(workType: WorkType): WorkTypeWorkflow {
  const steps: WorkflowStepConfig[] = [];
  
  // 1. Validation Chef Agence (seulement si des rôles sont définis)
  if (workType.agencyValidationRoles && workType.agencyValidationRoles.length > 0) {
    steps.push({
      step: WorkflowStepType.VALIDATION,
      label: 'Validation Agence',
      requiredRoles: workType.agencyValidationRoles,
      validationType: ValidationType.AGENCY,
      nextStep: WorkflowStepType.VALIDATION
    });
  }

  // 2. Validation Relation Clientèle (seulement si des rôles sont définis)
  if (workType.customerServiceValidationRoles && workType.customerServiceValidationRoles.length > 0) {
    steps.push({
      step: WorkflowStepType.VALIDATION,
      label: 'Validation Relation Clientèle',
      requiredRoles: workType.customerServiceValidationRoles,
      validationType: ValidationType.CUSTOMER_SERVICE,
      nextStep: WorkflowStepType.VALIDATION
    });
  }

  // 3. Validation Juriste (seulement si des rôles sont définis)
  if (workType.lawyerValidationRoles && workType.lawyerValidationRoles.length > 0) {
    steps.push({
      step: WorkflowStepType.VALIDATION,
      label: 'Validation Juriste',
      requiredRoles: workType.lawyerValidationRoles,
      validationType: ValidationType.LAWYER,
      nextStep: WorkflowStepType.VALIDATION
    });
  }

  // Rôles autorisés pour le devis
  const quoteRoles = workType.quoteAllowedRoles && workType.quoteAllowedRoles.length > 0
    ? workType.quoteAllowedRoles
    : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.TECHICO_COMMERCIAL];

  const requiresQuotation = quoteRoles.length > 0;
  
  // 4. Établir Devis
  if (requiresQuotation) {
    // Si on a des étapes de validation, la dernière doit pointer vers QUOTATION
    if (steps.length > 0) {
      steps[steps.length - 1].nextStep = WorkflowStepType.QUOTATION;
    }

    steps.push({
      step: WorkflowStepType.QUOTATION,
      label: 'Établir Devis',
      requiredRoles: quoteRoles,
      nextStep: WorkflowStepType.PRINTING
    });
    
    // 5. Impression
    steps.push({
      step: WorkflowStepType.PRINTING,
      label: 'Impression Devis',
      requiredRoles: Array.from(new Set([...quoteRoles, ...(workType.quoteValidationRoles || [])])),
      nextStep: WorkflowStepType.COMPLETION
    });
  } else if (steps.length > 0) {
    // Si pas de devis mais des validations, la dernière pointe vers la fin
    steps[steps.length - 1].nextStep = WorkflowStepType.COMPLETION;
  }

  // 6. Demande Complétée
  steps.push({
    step: WorkflowStepType.COMPLETION,
    label: 'Demande Complétée',
    requiredRoles: [],
    nextStep: undefined
  });
  
  return {
    workTypeId: workType.id,
    workTypeName: workType.label || workType.name || '',
    steps,
    requiresQuotation
  };
}

/**
 * Récupère la configuration du workflow pour un type de travaux donné
 */
export function getWorkflowByType(serviceType: string): WorkTypeWorkflow | null {
  return WORKFLOW_REGISTRY[serviceType] || null;
}

