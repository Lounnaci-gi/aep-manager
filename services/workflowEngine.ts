import { 
  WorkRequest, 
  RequestStatus, 
  ValidationType, 
  ValidationRecord, 
  WorkTypeWorkflow, 
  WorkflowStepType,
  UserRole 
} from '../types';
import { WORKFLOW_REGISTRY } from './workflowConfig';

// ============================================================================
// Moteur de Workflow - Logique métier centrale
// ============================================================================
// Cette classe fournit toutes les fonctions nécessaires pour gérer le cycle de vie
// d'une demande selon son workflow configuré.
// ============================================================================

export class WorkflowEngine {
  
  /**
   * Récupère la configuration du workflow pour une demande
   */
  static getWorkflow(request: WorkRequest): WorkTypeWorkflow | null {
    return WORKFLOW_REGISTRY[request.serviceType] || null;
  }

  /**
   * Détermine le type de validation suivant à effectuer
   * Retourne null si toutes les validations sont complètes
   */
  static getNextValidationType(request: WorkRequest): ValidationType | null {
    const workflow = this.getWorkflow(request);
    if (!workflow) return null;

    const validations = request.validations || [];
    
    for (const step of workflow.steps) {
      if (step.validationType) {
        const validation = validations.find(v => v.type === step.validationType);
        if (!validation || validation.status === 'pending') {
          return step.validationType;
        }
      }
    }
    
    return null;
  }

  /**
   * Vérifie si toutes les validations requises sont complètes
   */
  static allValidationsComplete(request: WorkRequest): boolean {
    const validations = request.validations || [];
    
    // Si on a des validations explicitement assignées (instantané au moment de la création), 
    // on les utilise en priorité pour le calcul d'achèvement.
    if (request.assignedValidations && request.assignedValidations.length > 0) {
      return request.assignedValidations.every(type => 
        validations.find(v => v.type === type && v.status === 'validated')
      );
    }

    // Sinon, on utilise le workflow configuré actuellement
    const workflow = this.getWorkflow(request);
    if (!workflow) return false;
    
    return workflow.steps
      .filter(s => s.validationType)
      .every(step => 
        validations.find(v => v.type === step.validationType && v.status === 'validated')
      );
  }

  /**
   * Vérifie si une validation spécifique est complète
   */
  static isValidationComplete(request: WorkRequest, validationType: ValidationType): boolean {
    const validations = request.validations || [];
    const validation = validations.find(v => v.type === validationType);
    return validation?.status === 'validated';
  }

  /**
   * Détermine si le devis doit être ignoré pour cette demande
   */
  static shouldSkipQuotation(request: WorkRequest): boolean {
    const workflow = this.getWorkflow(request);
    return !workflow?.requiresQuotation;
  }

  /**
   * Construit les enregistrements de validation initiaux basés sur le workflow
   */
  static buildInitialValidations(request: WorkRequest): ValidationRecord[] {
    const workflow = this.getWorkflow(request);
    if (!workflow) return [];

    return workflow.steps
      .filter(step => step.validationType)
      .map(step => ({
        type: step.validationType!,
        userId: '',
        userName: '',
        validatedAt: '',
        status: 'pending' as const
      }));
  }

  /**
   * Calcule le nouveau statut de la demande après une action
   */
  static calculateNewStatus(request: WorkRequest): RequestStatus {
    const validations = request.validations || [];
    const hasRejection = validations.some(v => v.status === 'rejected');
    if (hasRejection) return RequestStatus.REJECTED;

    const allValidated = this.allValidationsComplete(request);
    if (allValidated) return RequestStatus.VALIDATED;

    const atLeastOneValidated = validations.some(v => v.status === 'validated');
    if (atLeastOneValidated) return RequestStatus.UNDER_STUDY;

    return RequestStatus.RECEIVED;
  }

  /**
   * Détermine l'étape actuelle du workflow pour une demande
   */
  static getCurrentStep(request: WorkRequest): WorkflowStepType {
    const workflow = this.getWorkflow(request);
    if (!workflow) return WorkflowStepType.COMPLETION;

    const validations = request.validations || [];
    const allValidated = this.allValidationsComplete(request);
    const hasQuote = request.status === RequestStatus.QUOTED;

    // Si toutes les validations sont complètes
    if (allValidated) {
      // Si le workflow nécessite un devis et qu'il n'y en a pas encore
      if (workflow.requiresQuotation && !hasQuote) {
        return WorkflowStepType.QUOTATION;
      }
      // Si un devis existe
      if (hasQuote) {
        return WorkflowStepType.PRINTING;
      }
      // Si pas de devis requis
      if (!workflow.requiresQuotation) {
        return WorkflowStepType.COMPLETION;
      }
    }

    // Trouver la prochaine validation en attente
    for (const step of workflow.steps) {
      if (step.validationType) {
        const validation = validations.find(v => v.type === step.validationType);
        if (!validation || validation.status === 'pending' || validation.status === 'rejected') {
          return WorkflowStepType.VALIDATION;
        }
      }
    }

    return WorkflowStepType.COMPLETION;
  }

  /**
   * Vérifie si un utilisateur peut effectuer une action spécifique
   */
  static canPerformAction(
    request: WorkRequest, 
    userRole: UserRole, 
    action: WorkflowStepType
  ): { allowed: boolean; reason?: string } {
    const workflow = this.getWorkflow(request);
    if (!workflow) {
      return { allowed: false, reason: 'Aucun workflow configuré pour ce type de travaux' };
    }

    // Trouver la configuration de l'étape demandée
    const stepConfig = workflow.steps.find(s => s.step === action);
    if (!stepConfig) {
      return { allowed: false, reason: 'Étape non trouvée dans le workflow' };
    }

    // Vérifier le rôle
    const hasRole = stepConfig.requiredRoles.includes(userRole);
    if (!hasRole) {
      return { 
        allowed: false, 
        reason: `Rôle non autorisé. Rôles requis: ${stepConfig.requiredRoles.join(', ')}` 
      };
    }

    // Vérifier si c'est l'étape actuelle
    const currentStep = this.getCurrentStep(request);
    if (currentStep !== action) {
      return { allowed: false, reason: 'Ce n\'est pas l\'étape actuelle du workflow' };
    }

    return { allowed: true };
  }

  /**
   * Vérifie si un utilisateur peut créer une demande pour ce type de travaux
   */
  static canCreateRequest(serviceType: string, userRole: UserRole): boolean {
    const workflow = WORKFLOW_REGISTRY[serviceType];
    if (!workflow || workflow.steps.length === 0) return false;
    
    const firstStep = workflow.steps[0];
    return firstStep.requiredRoles.includes(userRole);
  }

  /**
   * Retourne les informations de l'étape actuelle pour affichage
   */
  static getStepInfo(request: WorkRequest): { 
    currentStep: WorkflowStepType; 
    label: string; 
    progress: number; 
    totalSteps: number;
  } | null {
    const workflow = this.getWorkflow(request);
    if (!workflow) return null;

    const currentStep = this.getCurrentStep(request);
    const currentIndex = workflow.steps.findIndex(s => s.step === currentStep);
    const progress = currentIndex >= 0 ? currentIndex + 1 : 1;

    return {
      currentStep,
      label: workflow.steps[currentIndex]?.label || 'En attente',
      progress,
      totalSteps: workflow.steps.length
    };
  }

  /**
   * Vérifie si le workflow est complètement terminé
   */
  static isWorkflowComplete(request: WorkRequest): boolean {
    return this.getCurrentStep(request) === WorkflowStepType.COMPLETION;
  }
}
