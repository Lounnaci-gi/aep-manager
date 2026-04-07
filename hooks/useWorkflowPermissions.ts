import { useMemo } from 'react';
import { 
  WorkRequest, 
  UserRole, 
  WorkflowStepType, 
  PermissionResult, 
  WorkTypeWorkflow,
  ValidationType 
} from '../types';
import { WorkflowEngine } from '../services/workflowEngine';
import { getWorkflowByType } from '../services/workflowConfig';

// ============================================================================
// Hook React pour la Gestion des Permissions de Workflow
// ============================================================================
// Ce hook fournit une interface simple pour vérifier les permissions
// et l'état actuel du workflow d'une demande.
// ============================================================================

interface UseWorkflowPermissionsResult {
  workflow: WorkTypeWorkflow | null;
  currentStep: WorkflowStepType;
  canPerformAction: (action: WorkflowStepType) => PermissionResult;
  canCreateRequest: boolean;
  canValidate: PermissionResult;
  canCreateQuote: PermissionResult;
  canPrint: PermissionResult;
  isComplete: boolean;
  nextValidationType: ValidationType | null;
  progress: { current: number; total: number };
}

/**
 * Hook pour gérer les permissions de workflow
 * 
 * @param request - La demande de travaux à analyser
 * @param currentUser - L'utilisateur courant (ou null si non connecté)
 * @returns Objet contenant toutes les informations de permissions
 * 
 * @example
 * const permissions = useWorkflowPermissions(request, currentUser);
 * if (permissions.canCreateQuote.allowed) {
 *   // Afficher le bouton "Créer Devis"
 * }
 */
export function useWorkflowPermissions(
  request: WorkRequest,
  currentUser: { role: UserRole } | null
): UseWorkflowPermissionsResult {
  
  // Récupérer le workflow configuré pour ce type de travaux
  const workflow = useMemo(() => {
    return getWorkflowByType(request.serviceType);
  }, [request.serviceType]);

  // Déterminer l'étape actuelle du workflow
  const currentStep = useMemo((): WorkflowStepType => {
    if (!workflow) return WorkflowStepType.COMPLETION;
    return WorkflowEngine.getCurrentStep(request);
  }, [request, workflow]);

  // Fonction pour vérifier si une action est autorisée
  const canPerformAction = useMemo(() => {
    return (action: WorkflowStepType): PermissionResult => {
      if (!currentUser) {
        return { allowed: false, reason: 'Utilisateur non connecté' };
      }
      if (!workflow) {
        return { allowed: false, reason: 'Aucun workflow configuré pour ce type de travaux' };
      }

      // Utiliser le moteur de workflow pour la vérification
      const result = WorkflowEngine.canPerformAction(request, currentUser.role, action);
      
      if (!result.allowed) {
        return { allowed: false, reason: result.reason };
      }

      // Trouver la configuration de l'étape pour obtenir la prochaine action
      const stepConfig = workflow.steps.find(s => s.step === action);
      return { 
        allowed: true, 
        nextAction: stepConfig?.nextStep 
      };
    };
  }, [request, currentUser, workflow]);

  // Vérifier si l'utilisateur peut créer une demande pour ce type
  const canCreateRequest = useMemo((): boolean => {
    if (!currentUser || !workflow) return false;
    const firstStep = workflow.steps[0];
    return firstStep.requiredRoles.includes(currentUser.role);
  }, [currentUser, workflow]);

  // Permissions pré-calculées pour les actions courantes
  const canValidate = useMemo(() => {
    return canPerformAction(WorkflowStepType.VALIDATION);
  }, [canPerformAction]);

  const canCreateQuote = useMemo(() => {
    return canPerformAction(WorkflowStepType.QUOTATION);
  }, [canPerformAction]);

  const canPrint = useMemo(() => {
    return canPerformAction(WorkflowStepType.PRINTING);
  }, [canPerformAction]);

  // Vérifier si le workflow est terminé
  const isComplete = useMemo(() => {
    return currentStep === WorkflowStepType.COMPLETION;
  }, [currentStep]);

  // Prochaine validation à effectuer
  const nextValidationType = useMemo(() => {
    return WorkflowEngine.getNextValidationType(request);
  }, [request]);

  // Progression dans le workflow
  const progress = useMemo(() => {
    if (!workflow) return { current: 0, total: 0 };
    const stepInfo = WorkflowEngine.getStepInfo(request);
    return {
      current: stepInfo?.progress || 0,
      total: stepInfo?.totalSteps || workflow.steps.length
    };
  }, [request, workflow]);

  return {
    workflow,
    currentStep,
    canPerformAction,
    canCreateRequest,
    canValidate,
    canCreateQuote,
    canPrint,
    isComplete,
    nextValidationType,
    progress
  };
}
