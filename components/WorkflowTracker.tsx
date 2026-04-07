import React from 'react';
import { WorkRequest, UserRole, WorkflowStepType } from '../types';
import { useWorkflowPermissions } from '../hooks/useWorkflowPermissions';

// ============================================================================
// Composant de Suivi de Workflow
// ============================================================================
// Affiche visuellement la progression d'une demande dans son circuit de validation
// et les boutons d'action autorisés selon le rôle de l'utilisateur.
// ============================================================================

interface WorkflowTrackerProps {
  request: WorkRequest;
  currentUser: { role: UserRole } | null;
  onValidate?: (validationType: string) => void;
  onCreateQuote?: () => void;
  onPrint?: () => void;
  className?: string;
}

export const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({
  request,
  currentUser,
  onValidate,
  onCreateQuote,
  onPrint,
  className = ''
}) => {
  const { 
    workflow, 
    currentStep, 
    canValidate, 
    canCreateQuote, 
    canPrint, 
    isComplete,
    nextValidationType,
    progress
  } = useWorkflowPermissions(request, currentUser);

  // Si aucun workflow configuré
  if (!workflow) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs font-black text-amber-700 uppercase">
            Aucun workflow configuré pour "{request.serviceType}"
          </p>
        </div>
      </div>
    );
  }

  // Déterminer le statut d'une étape
  const getStepStatus = (step: WorkflowStepType): 'completed' | 'current' | 'pending' => {
    if (isComplete) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  // Icône pour chaque statut
  const getStepIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'current':
        return (
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
        );
      default:
        return (
          <div className="w-3 h-3 bg-gray-300 rounded-full" />
        );
    }
  };

  // Couleur pour chaque statut
  const getStepColors = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 text-white border-emerald-500';
      case 'current':
        return 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200';
      default:
        return 'bg-gray-100 text-gray-400 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              Suivi du Workflow
            </h3>
            <p className="text-[10px] text-blue-600 font-bold mt-1">
              {workflow.workTypeName}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-blue-600">
              {progress.current}/{progress.total}
            </div>
            <div className="text-[9px] text-gray-500 font-black uppercase">
              Étapes
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="px-6 py-6">
        <div className="flex items-stretch justify-between relative">
          {/* Ligne de connexion */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0" />
          
          {workflow.steps.map((step, index) => {
            const status = getStepStatus(step.step);
            const isLast = index === workflow.steps.length - 1;
            
            return (
              <div 
                key={index} 
                className="flex-1 flex flex-col items-center relative z-10"
              >
                {/* Cercle d'étape */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-3 transition-all duration-300
                  ${getStepColors(status)}
                `}>
                  {getStepIcon(status)}
                </div>
                
                {/* Label */}
                <p className={`
                  text-[9px] font-black uppercase mt-2 text-center leading-tight px-1
                  ${status === 'completed' ? 'text-emerald-600' : 
                    status === 'current' ? 'text-blue-600' : 
                    'text-gray-400'}
                `}>
                  {step.label}
                </p>

                {/* Indicateur de rôle pour l'étape courante */}
                {status === 'current' && step.requiredRoles.length > 0 && (
                  <div className="mt-1 px-2 py-0.5 bg-blue-100 rounded-full">
                    <p className="text-[7px] font-black text-blue-700 uppercase">
                      {step.requiredRoles[0]}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap gap-3">
          {/* Bouton Valider */}
          {canValidate.allowed && onValidate && nextValidationType && (
            <button
              onClick={() => onValidate(nextValidationType)}
              className="flex-1 min-w-[140px] bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Valider
            </button>
          )}
          
          {/* Bouton Créer Devis */}
          {canCreateQuote.allowed && onCreateQuote && (
            <button
              onClick={onCreateQuote}
              className="flex-1 min-w-[140px] bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Établir Devis
            </button>
          )}
          
          {/* Bouton Imprimer */}
          {canPrint.allowed && onPrint && (
            <button
              onClick={onPrint}
              className="flex-1 min-w-[140px] bg-purple-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2h10z" />
              </svg>
              Imprimer
            </button>
          )}

          {/* Message d'attente */}
          {!canValidate.allowed && !canCreateQuote.allowed && !canPrint.allowed && !isComplete && (
            <div className="flex-1 flex items-center justify-center gap-2 text-xs text-gray-500 font-bold italic py-3">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              En attente des validations précédentes...
            </div>
          )}

          {/* Workflow terminé */}
          {isComplete && (
            <div className="flex-1 bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-black text-emerald-700 uppercase">
                Demande complétée
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
