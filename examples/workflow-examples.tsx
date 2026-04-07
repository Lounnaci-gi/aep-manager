/**
 * Exemple d'utilisation du moteur de workflow dynamique
 * 
 * Ce fichier montre comment utiliser les différentes composantes
 * du système de workflow dans votre application.
 */

import { WorkRequest, RequestStatus, UserRole, ValidationType } from '../types';
import { WorkflowEngine } from '../services/workflowEngine';
import { useWorkflowPermissions } from '../hooks/useWorkflowPermissions';
import { WorkflowTracker } from '../components/WorkflowTracker';

// ============================================================================
// EXEMPLE 1 : Utilisation du moteur de workflow directement
// ============================================================================

function exempleWorkflowEngine() {
  // Créer une demande exemple
  const request: WorkRequest = {
    id: 'TEST-001',
    clientId: 'CLIENT-001',
    clientName: 'Jean Dupont',
    clientPhone: '0555 12 34 56',
    centreId: 'CTR-001',
    installationAddress: '123 Rue Example',
    installationCommune: 'Alger',
    serviceType: "Branchement d'eau Potable",
    description: 'Branchement standard',
    type: 'Proprietaire',
    status: RequestStatus.AWAITING_AGENCY_VALIDATION,
    agencyId: 'AGC-001',
    createdAt: new Date().toISOString(),
    assignedValidations: [ValidationType.AGENCY, ValidationType.CUSTOMER_SERVICE, ValidationType.LAWYER],
    validations: [
      {
        type: ValidationType.AGENCY,
        userId: '',
        userName: '',
        validatedAt: '',
        status: 'pending'
      }
    ]
  };

  // 1. Récupérer le workflow configuré
  const workflow = WorkflowEngine.getWorkflow(request);
  console.log('Workflow:', workflow?.workTypeName);

  // 2. Vérifier l'étape actuelle
  const currentStep = WorkflowEngine.getCurrentStep(request);
  console.log('Étape actuelle:', currentStep);

  // 3. Vérifier si un utilisateur peut valider
  const canValidate = WorkflowEngine.canPerformAction(
    request,
    UserRole.CHEF_AGENCE,
    'validation' as any
  );
  console.log('Peut valider:', canValidate);

  // 4. Construire les validations initiales
  const validations = WorkflowEngine.buildInitialValidations(request);
  console.log('Validations à créer:', validations.length);

  // 5. Vérifier si toutes les validations sont complètes
  const allComplete = WorkflowEngine.allValidationsComplete(request);
  console.log('Toutes validations complètes:', allComplete);

  // 6. Calculer le nouveau statut après une action
  const newStatus = WorkflowEngine.calculateNewStatus(request);
  console.log('Nouveau statut:', newStatus);
}

// ============================================================================
// EXEMPLE 2 : Utilisation du hook dans un composant React
// ============================================================================

function ExempleComposantAvecHook({ 
  request, 
  currentUser 
}: { 
  request: WorkRequest; 
  currentUser: { role: UserRole } 
}) {
  // Utiliser le hook pour obtenir les permissions
  const permissions = useWorkflowPermissions(request, currentUser);

  return (
    <div className="p-4 space-y-4">
      <h2>Permissions Actuelles</h2>
      
      <div>
        <p>Workflow: {permissions.workflow?.workTypeName || 'Aucun'}</p>
        <p>Étape actuelle: {permissions.currentStep}</p>
        <p>Progression: {permissions.progress.current}/{permissions.progress.total}</p>
        <p>Terminé: {permissions.isComplete ? 'Oui' : 'Non'}</p>
      </div>

      <div className="space-x-2">
        {permissions.canValidate.allowed && (
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            ✓ Valider ({permissions.canValidate.reason || 'Autorisé'})
          </button>
        )}

        {permissions.canCreateQuote.allowed && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            📄 Créer Devis
          </button>
        )}

        {permissions.canPrint.allowed && (
          <button className="bg-purple-600 text-white px-4 py-2 rounded">
            🖨️ Imprimer
          </button>
        )}

        {!permissions.canValidate.allowed && 
         !permissions.canCreateQuote.allowed && 
         !permissions.canPrint.allowed && 
         !permissions.isComplete && (
          <p className="text-gray-500 italic">
            En attente des validations précédentes...
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLE 3 : Utilisation du composant WorkflowTracker
// ============================================================================

function ExempleWorkflowTracker({
  request,
  currentUser
}: {
  request: WorkRequest;
  currentUser: { role: UserRole };
}) {
  const handleValidation = (validationType: string) => {
    console.log('Validation effectuée:', validationType);
    // Logique de validation ici
  };

  const handleCreateQuote = () => {
    console.log('Création du devis...');
    // Logique de création de devis ici
  };

  const handlePrint = () => {
    console.log('Impression...');
    // Logique d'impression ici
  };

  return (
    <WorkflowTracker
      request={request}
      currentUser={{ role: currentUser.role }}
      onValidate={handleValidation}
      onCreateQuote={handleCreateQuote}
      onPrint={handlePrint}
    />
  );
}

// ============================================================================
// EXEMPLE 4 : Vérification des permissions avant une action
// ============================================================================

function exempleVerificationPermission(
  request: WorkRequest,
  userRole: UserRole
) {
  // Vérifier si l'utilisateur peut créer ce type de demande
  const canCreate = WorkflowEngine.canCreateRequest(
    request.serviceType,
    userRole
  );

  if (!canCreate) {
    console.log('❌ Cet utilisateur ne peut pas créer ce type de demande');
    return false;
  }

  // Vérifier si l'utilisateur peut valider
  const validationCheck = WorkflowEngine.canPerformAction(
    request,
    userRole,
    'validation' as any
  );

  if (validationCheck.allowed) {
    console.log('✅ Validation autorisée');
    return true;
  } else {
    console.log('❌ Validation refusée:', validationCheck.reason);
    return false;
  }
}

// ============================================================================
// EXEMPLE 5 : Intégration dans App.tsx ou un composant parent
// ============================================================================

function exempleIntegrationAppTsX() {
  /*
  // Dans votre App.tsx ou composant parent :
  
  import { WorkflowTracker } from './components/WorkflowTracker';
  
  function ListeDesDemandes({ requests, currentUser }) {
    const [selectedRequest, setSelectedRequest] = useState(null);
  
    return (
      <div>
        {/* Afficher le workflow tracker si une demande est sélectionnée *\/}
        {selectedRequest && (
          <WorkflowTracker
            request={selectedRequest}
            currentUser={{ role: currentUser.role }}
            onValidate={(type) => handleValidation(selectedRequest, type)}
            onCreateQuote={() => handleCreateQuote(selectedRequest)}
            onPrint={() => handlePrint(selectedRequest)}
          />
        )}
  
        {/* Liste des demandes *\/}
        {requests.map(req => (
          <div key={req.id}>
            <h3>{req.clientName}</h3>
            <button onClick={() => setSelectedRequest(req)}>
              Voir Workflow
            </button>
          </div>
        ))}
      </div>
    );
  }
  */
}

// ============================================================================
// Export pour utilisation
// ============================================================================

export {
  exempleWorkflowEngine,
  ExempleComposantAvecHook,
  ExempleWorkflowTracker,
  exempleVerificationPermission,
  exempleIntegrationAppTsX
};
