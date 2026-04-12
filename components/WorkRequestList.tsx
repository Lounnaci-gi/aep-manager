
import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { WorkRequest, RequestStatus, CommercialAgency, Centre, BranchementType, UserRole, User, ValidationType, ValidationRecord, WorkType, Quote, Unit, WorkflowStepType } from '../types';
import { WorkRequestPrint } from './WorkRequestPrint';
import { QuoteEstablishmentRequestPrint } from './QuoteEstablishmentRequestPrint';
import { WorkflowTracker } from './WorkflowTracker';
import { WorkflowEngine } from '../services/workflowEngine';


interface WorkRequestListProps {
  requests: WorkRequest[];
  agencies: CommercialAgency[];
  centres: Centre[];
  users: User[];
  workTypes: WorkType[];
  onDelete: (id: string) => void;
  onEdit: (request: WorkRequest) => void;
  onCreateQuote: (request: WorkRequest) => void;
  onUpdateStatus: (id: string, status: RequestStatus) => void;
  onUpdateRequestWithValidations?: (request: WorkRequest) => void;
  currentUser?: User;
  quotes: Quote[];
  units: Unit[];
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc';

export const WorkRequestList: React.FC<WorkRequestListProps> = ({
  requests,
  agencies,
  centres,
  users,
  workTypes,
  onDelete,
  onEdit,
  onCreateQuote,
  onUpdateStatus,
  onUpdateRequestWithValidations,
  currentUser,
  quotes,
  units
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [activePrintRequest, setActivePrintRequest] = useState<WorkRequest | null>(null);
  const [printMode, setPrintMode] = useState<'standard' | 'quote-request'>('standard');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [validationFilter, setValidationFilter] = useState<'all' | 'pending' | 'validated'>('all');
  const [printingRequest, setPrintingRequest] = useState<WorkRequest | null>(null);
  const [selectedRequestForWorkflow, setSelectedRequestForWorkflow] = useState<WorkRequest | null>(null);


  const normalizedRequests = useMemo(() => {
    return requests.map(req => ({
      ...req,
      assignedValidations: req.assignedValidations && req.assignedValidations.length > 0
        ? req.assignedValidations
        : [ValidationType.AGENCY, ValidationType.CUSTOMER_SERVICE, ValidationType.LAWYER]
    }));
  }, [requests]);

  // Compter les demandes en attente de validation pour chaque rôle
  const pendingAgencyValidation = normalizedRequests.filter(req =>
    req.assignedValidations?.includes(ValidationType.AGENCY) &&
    !req.validations?.find(v => v.type === ValidationType.AGENCY && v.status === 'validated') &&
    currentUser?.role === UserRole.CHEF_AGENCE
  ).length;

  const pendingCustomerServiceValidation = normalizedRequests.filter(req =>
    req.assignedValidations?.includes(ValidationType.CUSTOMER_SERVICE) &&
    !req.validations?.find(v => v.type === ValidationType.CUSTOMER_SERVICE && v.status === 'validated') &&
    currentUser?.role === UserRole.AGENT
  ).length;

  const pendingLawyerValidation = normalizedRequests.filter(req =>
    req.assignedValidations?.includes(ValidationType.LAWYER) &&
    !req.validations?.find(v => v.type === ValidationType.LAWYER && v.status === 'validated') &&
    currentUser?.role === UserRole.JURISTE
  ).length;

  // Filtrer les demandes selon le filtre de validation
  const getFilteredRequests = () => {
    if (validationFilter === 'pending') {
      return normalizedRequests.filter(req =>
        req.assignedValidations &&
        req.assignedValidations.length > 0 &&
        !req.validations?.every(v => v.status === 'validated')
      );
    }
    if (validationFilter === 'validated') {
      return normalizedRequests.filter(req =>
        req.status === RequestStatus.VALIDATED || req.status === RequestStatus.QUOTED
      );
    }
    return normalizedRequests;
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.RECEIVED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case RequestStatus.UNDER_STUDY: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case RequestStatus.VALIDATED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case RequestStatus.QUOTED: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case RequestStatus.REJECTED: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAgencyTag = (agencyId: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    const centre = agency ? centres.find(c => c.id === agency.centreId) : null;
    return (
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded-sm uppercase tracking-widest">
          {centre?.name || '---'}
        </span>
        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-sm uppercase tracking-widest">
          {agency?.name || 'Agence inconnue'}
        </span>
      </div>
    );
  };

  const filteredAndSortedRequests = useMemo(() => {
    let result = getFilteredRequests().filter(req => {
      const matchesSearch =
        req.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === '' || req.status === statusFilter;

      const reqDate = new Date(req.createdAt).getTime();
      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (reqDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (reqDate > end) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'name-asc') {
        return a.clientName.localeCompare(b.clientName);
      }
      return 0;
    });

    return result;
  }, [requests, searchTerm, statusFilter, startDate, endDate, sortBy, validationFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setSortBy('date-desc');
  };

  const handleValidation = async (req: WorkRequest, validationType: ValidationType, status: 'validated' | 'rejected') => {
    let reason = '';
    if (status === 'rejected') {
      const { value: text } = await Swal.fire({
        title: 'Motif du rejet',
        input: 'textarea',
        inputLabel: 'Veuillez justifier le rejet de cette demande',
        inputPlaceholder: 'Saisissez ici le motif...',
        showCancelButton: true,
        confirmButtonText: 'Rejeter',
        cancelButtonText: 'Annuler',
        inputValidator: (value) => {
          if (!value) {
            return 'Le motif est obligatoire pour un rejet !'
          }
        }
      });

      if (!text) return;
      reason = text;
    }

    const newValidation: ValidationRecord = {
      type: validationType,
      status: status,
      userId: currentUser?.id || '',
      userName: currentUser?.fullName || 'Utilisateur inconnu',
      validatedAt: new Date().toISOString(),
      date: new Date().toISOString(),
      user: currentUser?.fullName || 'Utilisateur inconnu',
      reason: reason
    };

    const updatedValidations = req.validations ? [...req.validations] : [];
    const filteredValidations = updatedValidations.filter(v => v.type !== validationType);
    filteredValidations.push(newValidation);

    // NOUVEAU: Utiliser le moteur de workflow pour calculer le statut
    const updatedRequest = {
      ...req,
      validations: filteredValidations
    };

    const newStatus = WorkflowEngine.calculateNewStatus(updatedRequest);
    const finalRequest = {
      ...updatedRequest,
      status: newStatus,
      rejectionReason: newStatus === RequestStatus.REJECTED ? reason : (newStatus === RequestStatus.VALIDATED ? '' : req.rejectionReason)
    };

    if (onUpdateRequestWithValidations) {
      onUpdateRequestWithValidations(finalRequest);
    } else {
      onUpdateStatus(req.id, newStatus);
    }
  };

  const handleCancelValidation = async (req: WorkRequest, validationType: ValidationType) => {
    // Si un devis a déjà été créé, on ne peut pas annuler la validation sans supprimer le devis d'abord
    const hasQuote = quotes.some(q => q.requestId === req.id);
    if (req.status === RequestStatus.QUOTED || hasQuote) {
      Swal.fire({
        title: 'Action Impossible',
        text: 'Un devis a déjà été établi pour cette demande. Veuillez d\'abord supprimer le devis pour pouvoir annuler la validation de la demande.',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Compris'
      });
      return;
    }

    const { value: cancellationReason } = await Swal.fire({
      title: 'Motif d\'annulation',
      input: 'textarea',
      inputLabel: 'Pourquoi annulez-vous la validation de cette demande ?',
      inputPlaceholder: 'Saisissez ici le motif d\'annulation (obligatoire)...',
      inputAttributes: {
        'aria-label': 'Motif d\'annulation'
      },
      showCancelButton: true,
      confirmButtonText: 'Annuler la validation',
      cancelButtonText: 'Ignorer',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Le motif est obligatoire pour annuler une validation !'
        }
        return null;
      }
    });

    if (!cancellationReason || cancellationReason.trim() === '') return;

    // Créer un enregistrement de validation pour tracer l'annulation
    const cancellationRecord: ValidationRecord = {
      type: validationType,
      status: 'pending', // Statut intermédiaire pour montrer l'annulation
      userId: currentUser?.id || '',
      userName: currentUser?.fullName || 'Utilisateur inconnu',
      validatedAt: new Date().toISOString(),
      date: new Date().toISOString(),
      user: currentUser?.fullName || 'Utilisateur inconnu',
      reason: `❌ ANNULATION - ${cancellationReason.trim()}`
    };

    const updatedValidations = req.validations ? [...req.validations] : [];
    // Supprimer l'ancienne validation et ajouter l'enregistrement d'annulation
    const filteredValidations = updatedValidations.filter(v => v.type !== validationType);
    filteredValidations.push(cancellationRecord);

    // Retour au statut initial
    const newStatus = RequestStatus.RECEIVED;

    const updatedRequest = {
      ...req,
      validations: filteredValidations,
      status: newStatus,
      rejectionReason: `⚠️ Validation annulée par ${currentUser?.fullName || 'Utilisateur'} : ${cancellationReason.trim()}`
    };

    if (onUpdateRequestWithValidations) {
      onUpdateRequestWithValidations(updatedRequest);
    } else {
      onUpdateStatus(req.id, newStatus);
    }

    Swal.fire({
      title: 'Validation Annulée',
      html: `La validation a été annulée avec succès.<br/><strong>Motif:</strong> ${cancellationReason.trim()}`,
      icon: 'info',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    });
  };

  const handleDeleteClick = async (req: WorkRequest) => {
    if (req.status === RequestStatus.QUOTED) {
      Swal.fire({
        title: 'Action Impossible',
        text: 'Un devis a déjà été établi pour cette demande. Veuillez d\'abord supprimer le devis pour pouvoir supprimer la demande.',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Compris'
      });
      return;
    }

    // Vérifier les permissions de suppression selon le type de travail
    const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
    const canDelete = !workType?.deleteAllowedRoles ||
      workType.deleteAllowedRoles.length === 0 ||
      workType.deleteAllowedRoles.includes(currentUser?.role);

    if (!canDelete) {
      Swal.fire({
        title: 'Accès Refusé',
        text: 'Vous n\'avez pas l\'autorisation de supprimer ce type de demande.',
        icon: 'error',
        confirmButtonColor: '#2563eb',
        timer: 3000,
        showConfirmButton: true
      });
      return;
    }

    onDelete(req.id);
  };

  const handleShowReason = (req: WorkRequest) => {
    let reasonContent = '';

    // Tous les motifs des validations avec raison
    if (req.validations && req.validations.length > 0) {
      const validationsWithReason = req.validations.filter(v => v.reason && v.reason.trim() !== '');

      if (validationsWithReason.length > 0) {
        reasonContent += `
          <div class="space-y-4">
        `;

        validationsWithReason.forEach((validation, index) => {
          // Récupérer l'utilisateur et son rôle depuis la collection Utilisateurs
          const validator = users.find(u => u.id === validation.userId);
          const roleUtilisateur = validator?.role || 'Non spécifié';

          // Formatage de la date et heure
          const dateTime = new Date(validation.validatedAt || validation.date);
          const dateStr = dateTime.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
          const timeStr = dateTime.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          reasonContent += `
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <!-- En-tête avec statut et type -->
              <div class="flex items-center justify-between mb-3">
                  <!-- Statut et type retirés car non nécessaires -->
                <div class="text-[12px] text-gray-500 font-bold">${dateStr} à ${timeStr} </div>
              </div>
              
              <!-- Informations utilisateur -->
              <div class="flex items-center gap-4 mb-3 flex-wrap">
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                  <span class="text-sm font-bold text-gray-700">${validation.user || 'Inconnu'}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.95 22.95 0 0110 13a22.95 22.95 0 01-10-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                  </svg>
                  <span class="text-xs font-black text-blue-600 uppercase tracking-wider">${roleUtilisateur}</span>
                </div>
              </div>
              
              <!-- Motif -->
              <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p class="text-sm text-gray-700 italic leading-relaxed">"${validation.reason}"</p>
              </div>
            </div>
          `;
        });

        reasonContent += `
          </div>
        `;
      } else {
        reasonContent += `
          <div class="text-center py-8 text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm font-black uppercase tracking-widest">Aucun motif enregistré</p>
          </div>
        `;
      }
    }

    Swal.fire({
      title: 'Historique des Motifs',
      html: `
        <div class="text-left max-h-[70vh] overflow-y-auto pr-2 -mr-2">
          <div class="mb-4 pb-3 border-b-2 border-gray-200">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div class="text-sm text-gray-500 mb-0.5">Référence</div>
                <div class="text-xl font-black text-gray-900 tracking-tight">${req.id}</div>
              </div>
            </div>
          </div>
          ${reasonContent}
        </div>
      `,
      confirmButtonText: 'Fermer',
      confirmButtonColor: '#3B82F6',
      width: '550px',
      customClass: {
        popup: 'rounded-2xl shadow-2xl'
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* NOUVEAU: Affichage du workflow tracker si une demande est sélectionnée */}
      {selectedRequestForWorkflow && (
        <WorkflowTracker
          request={selectedRequestForWorkflow}
          currentUser={currentUser ? { role: currentUser.role } : null}
          onValidate={(validationType) => {
            handleValidation(selectedRequestForWorkflow, validationType as ValidationType, 'validated');
            setSelectedRequestForWorkflow(null);
          }}
          onCreateQuote={() => {
            onCreateQuote(selectedRequestForWorkflow);
            setSelectedRequestForWorkflow(null);
          }}
          onPrint={() => {
            setPrintMode('standard');
            setActivePrintRequest(selectedRequestForWorkflow);
          }}
        />
      )}

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 mx-2 sm:mx-0">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Registre des Demandes</h3>
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">Centralisation des dossiers d'agences</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-black px-4 py-1.5 bg-blue-600 text-white rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">
                {filteredAndSortedRequests.length} Dossiers
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setValidationFilter('all')}
                  className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-widest transition-all ${validationFilter === 'all'
                    ? 'bg-gray-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setValidationFilter('pending')}
                  className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-widest transition-all ${validationFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-lg'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                >
                  En attente
                </button>
                <button
                  onClick={() => setValidationFilter('validated')}
                  className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-widest transition-all ${validationFilter === 'validated'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                  Validés
                </button>
              </div>
              {(searchTerm || statusFilter || startDate || endDate) && (
                <button
                  onClick={clearFilters}
                  className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  Effacer filtres
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <div className="md:col-span-1 lg:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Recherche Rapide</label>
              <input
                type="text"
                placeholder="Nom ou Réf..."
                className="w-full rounded-lg border-gray-200 bg-white p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">État du dossier</label>
              <select
                className="w-full rounded-lg border-gray-200 bg-white p-2.5 text-xs font-black uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RequestStatus | '')}
              >
                <option value="">Tous les statuts</option>
                {Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ordre d'affichage</label>
              <select
                className="w-full rounded-lg border-gray-200 bg-white p-2.5 text-xs font-black uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="date-desc">Plus récents</option>
                <option value="date-asc">Plus anciens</option>
                <option value="name-asc">Nom (A-Z)</option>
              </select>
            </div>

            <div className="sm:col-span-2 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Du</label>
                <input
                  type="date"
                  className="w-full rounded-lg border-gray-200 bg-white p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Au</label>
                <input
                  type="date"
                  className="w-full rounded-lg border-gray-200 bg-white p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/30">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Réf / Agence</th>
                <th className="px-5 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Abonné</th>
                <th className="px-5 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Prestation</th>
                <th className="px-5 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="px-5 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredAndSortedRequests.map(req => (
                <tr key={req.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-black text-gray-900 tracking-tight">{req.id}</div>
                    {getAgencyTag(req.agencyId)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-black text-gray-900">{req.clientName}</div>
                    <div className="text-[11px] text-gray-500 font-medium italic truncate max-w-[220px]">{req.address}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-[11px] font-black text-blue-600 uppercase tracking-tighter">{req.serviceType}</div>
                    {req.serviceType === "Branchement d'eau potable" && req.branchementType && (
                      <div className="text-[10px] text-emerald-600 font-bold mt-1">
                        {req.branchementType === BranchementType.AUTRE && req.branchementDetails
                          ? `${req.branchementType}: ${req.branchementDetails}`
                          : req.branchementType}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-1.5">{new Date(req.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase border ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>

                    {/* Indicateur visuel pour les demandes avec motif */}
                    {(req.rejectionReason || (req.validations && req.validations.some(v => v.reason))) && (
                      <button
                        onClick={() => handleShowReason(req)}
                        className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
                        title="Voir le motif"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Voir motif
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center gap-2">
                      {req.assignedValidations && req.assignedValidations.length > 0 && (
                        <>
                          {req.assignedValidations.includes(ValidationType.AGENCY) &&
                            (() => {
                              const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
                              // ATTENTION: Uniquement agencyValidationRoles (PAS de fallback vers l'ancien champ)
                              const validationRoles = workType?.agencyValidationRoles && workType.agencyValidationRoles.length > 0
                                ? workType.agencyValidationRoles
                                : [UserRole.CHEF_AGENCE]; // Fallback par défaut STRICT
                              const canValidate = validationRoles.includes(currentUser?.role);
                              const isAlreadyValidated = req.validations?.find(v => v.type === ValidationType.AGENCY && v.status === 'validated');
                              const hasQuote = quotes.some(q => q.requestId === req.id);

                              return canValidate ? (
                                <div className="flex gap-2">
                                  {!isAlreadyValidated ? (
                                    <>
                                      <button
                                        onClick={() => handleValidation(req, ValidationType.AGENCY, 'validated')}
                                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100/50"
                                      >
                                        Valider Chef Agence
                                      </button>
                                      <button
                                        onClick={() => handleValidation(req, ValidationType.AGENCY, 'rejected')}
                                        className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100/50"
                                      >
                                        Rejeter
                                      </button>
                                    </>
                                  ) : !hasQuote && (
                                    <button
                                      onClick={() => handleCancelValidation(req, ValidationType.AGENCY)}
                                      className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100/50 flex items-center gap-1.5"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                      Annuler validation
                                    </button>
                                  )}
                                </div>
                              ) : null;
                            })()}

                          {req.assignedValidations.includes(ValidationType.CUSTOMER_SERVICE) &&
                            (() => {
                              const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
                              // ATTENTION: Uniquement customerServiceValidationRoles (PAS de fallback vers l'ancien champ)
                              const validationRoles = workType?.customerServiceValidationRoles && workType.customerServiceValidationRoles.length > 0
                                ? workType.customerServiceValidationRoles
                                : [UserRole.AGENT]; // Fallback par défaut STRICT
                              const canValidate = validationRoles.includes(currentUser?.role);
                              const isAlreadyValidated = req.validations?.find(v => v.type === ValidationType.CUSTOMER_SERVICE && v.status === 'validated');
                              const hasQuote = quotes.some(q => q.requestId === req.id);

                              return canValidate ? (
                                <div className="flex gap-2">
                                  {!isAlreadyValidated ? (
                                    <>
                                      <button
                                        onClick={() => handleValidation(req, ValidationType.CUSTOMER_SERVICE, 'validated')}
                                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100/50"
                                      >
                                        Valider Relation Clientèle
                                      </button>
                                      <button
                                        onClick={() => handleValidation(req, ValidationType.CUSTOMER_SERVICE, 'rejected')}
                                        className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100/50"
                                      >
                                        Rejeter
                                      </button>
                                    </>
                                  ) : !hasQuote && (
                                    <button
                                      onClick={() => handleCancelValidation(req, ValidationType.CUSTOMER_SERVICE)}
                                      className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100/50 flex items-center gap-1.5"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                      Annuler validation
                                    </button>
                                  )}
                                </div>
                              ) : null;
                            })()}

                          {req.assignedValidations.includes(ValidationType.LAWYER) &&
                            (() => {
                              const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
                              // ATTENTION: Uniquement lawyerValidationRoles (PAS de fallback vers l'ancien champ)
                              const validationRoles = workType?.lawyerValidationRoles && workType.lawyerValidationRoles.length > 0
                                ? workType.lawyerValidationRoles
                                : [UserRole.JURISTE]; // Fallback par défaut STRICT
                              const canValidate = validationRoles.includes(currentUser?.role);
                              const isAlreadyValidated = req.validations?.find(v => v.type === ValidationType.LAWYER && v.status === 'validated');
                              const hasQuote = quotes.some(q => q.requestId === req.id);

                              return canValidate ? (
                                <div className="flex gap-2">
                                  {!isAlreadyValidated ? (
                                    <>
                                      <button
                                        onClick={() => handleValidation(req, ValidationType.LAWYER, 'validated')}
                                        className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-100/50"
                                      >
                                        Valider Juriste
                                      </button>
                                      <button
                                        onClick={() => handleValidation(req, ValidationType.LAWYER, 'rejected')}
                                        className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100/50"
                                      >
                                        Rejeter
                                      </button>
                                    </>
                                  ) : !hasQuote && (
                                    <button
                                      onClick={() => handleCancelValidation(req, ValidationType.LAWYER)}
                                      className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100/50 flex items-center gap-1.5"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                      Annuler validation
                                    </button>
                                  )}
                                </div>
                              ) : null;
                            })()}
                        </>
                      )}

                      {/* Bouton Établir Devis - Apparaît quand TOUTES les validations sont terminées */}
                      {(() => {
                        if (req.status === RequestStatus.QUOTED || req.status === RequestStatus.REJECTED || quotes.some(q => q.requestId === req.id)) {
                          return false;
                        }
                        if (req.assignedValidations && req.assignedValidations.length > 0) {
                          return req.assignedValidations.every(type => req.validations?.find(v => v.type === type && v.status === 'validated'));
                        }
                        if (req.validations && req.validations.length > 0) {
                          return req.validations.every(v => v.status === 'validated');
                        }
                        return req.status === RequestStatus.VALIDATED;
                      })() && (() => {
                        // Vérifier les rôles autorisés pour créer le devis selon le type de travail
                        const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
                        const quoteRoles = workType?.quoteAllowedRoles && workType.quoteAllowedRoles.length > 0
                          ? workType.quoteAllowedRoles
                          : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.TECHICO_COMMERCIAL]; // Fallback par défaut
                        const canCreateQuote = quoteRoles.includes(currentUser?.role);

                        return canCreateQuote ? (
                          <button
                            onClick={() => onCreateQuote(req)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100/50 flex items-center gap-2"
                            title="Toutes les validations sont terminées. Créer un devis."
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Établir Devis
                          </button>
                        ) : null;
                      })()}

                      {/* Message si validations en cours */}
                      {(() => {
                        if (req.status === RequestStatus.QUOTED || req.status === RequestStatus.REJECTED || quotes.some(q => q.requestId === req.id)) {
                          return false;
                        }
                        if (req.assignedValidations && req.assignedValidations.length > 0) {
                          return !req.assignedValidations.every(type => req.validations?.find(v => v.type === type && v.status === 'validated'));
                        }
                        if (req.validations && req.validations.length > 0) {
                          return !req.validations.every(v => v.status === 'validated');
                        }
                        return req.status !== RequestStatus.VALIDATED;
                      })() && (() => {
                        // Vérifier les rôles autorisés pour créer le devis selon le type de travail
                        const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
                        const quoteRoles = workType?.quoteAllowedRoles && workType.quoteAllowedRoles.length > 0
                          ? workType.quoteAllowedRoles
                          : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.TECHICO_COMMERCIAL]; // Fallback par défaut
                        const canCreateQuote = quoteRoles.includes(currentUser?.role);

                        const missingRoles: string[] = [];
                        if (req.assignedValidations) {
                          req.assignedValidations.forEach(type => {
                            const isValidated = req.validations?.some(v => v.type === type && v.status === 'validated');
                            if (!isValidated) {
                              if (type === ValidationType.AGENCY) missingRoles.push("Chef d'Agence");
                              if (type === ValidationType.CUSTOMER_SERVICE) missingRoles.push("Relation Clientèle");
                              if (type === ValidationType.LAWYER) missingRoles.push("Juriste");
                            }
                          });
                        }
                        return canCreateQuote ? (
                          <div className="relative group flex items-center">
                            <div className="text-[9px] text-amber-600 font-black uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 cursor-help flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" clipRule="evenodd" /></svg>
                              Validation En attente
                            </div>

                            {missingRoles.length > 0 && (
                              <div className="absolute bottom-[calc(100%+5px)] right-0 w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="bg-gray-900 shadow-xl rounded-xl p-3 relative transform translate-y-1 group-hover:translate-y-0 transition-transform">
                                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 pb-2 border-b border-gray-700/50">
                                    En attente de :
                                  </div>
                                  <ul className="space-y-1.5 min-w-[130px] text-left">
                                    {missingRoles.map((role, idx) => (
                                      <li key={idx} className="flex items-center gap-2 text-white text-xs font-bold">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>
                                        {role}
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="absolute -bottom-1 right-6 w-2.5 h-2.5 bg-gray-900 transform rotate-45 rounded-sm"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}

                      {/* Bouton Modifier selon allowedRoles du type de travail */}
                      {currentUser && (() => {
                        const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
                        const canEdit = !workType?.allowedRoles ||
                          workType.allowedRoles.length === 0 ||
                          workType.allowedRoles.includes(currentUser.role);

                        return canEdit ? (
                          <button
                            onClick={() => onEdit(req)}
                            className="text-blue-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg"
                            title="Modifier la demande"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-gray-300 cursor-not-allowed p-1.5"
                            title="Vous n'avez pas l'autorisation de modifier"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </button>
                        );
                      })()}



                      {/* Suppression autorisée selon deleteAllowedRoles du type de travail */}
                      {currentUser && (() => {
                        const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
                        const canDelete = !workType?.deleteAllowedRoles ||
                          workType.deleteAllowedRoles.length === 0 ||
                          workType.deleteAllowedRoles.includes(currentUser.role);

                        return (
                          <button
                            onClick={() => canDelete && handleDeleteClick(req)}
                            className={`${canDelete
                                ? 'text-gray-200 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg'
                                : 'text-gray-300 cursor-not-allowed p-1.5'
                              }`}
                            title={canDelete ? 'Supprimer la demande' : 'Vous n\'avez pas l\'autorisation de supprimer'}
                            disabled={!canDelete}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        );
                      })()}

                      {/* Bouton Voir Workflow */}
                      <button
                        onClick={() => setSelectedRequestForWorkflow(req === selectedRequestForWorkflow ? null : req)}
                        className={`transition-colors p-1.5 rounded-lg ${req === selectedRequestForWorkflow
                          ? 'text-blue-600 bg-blue-100'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        title="Voir le workflow"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </button>

                      {/* Bouton Imprimer - Réservé aux utilisateurs autorisés à créer des demandes pour ce type de travaux */}
                      {(() => {
                        // Vérifier si l'utilisateur actuel est autorisé pour ce type de travail spécifique
                        const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
                        const isAllowedForWorkType = workType?.allowedRoles && workType.allowedRoles.length > 0
                          ? workType.allowedRoles.includes(currentUser?.role)
                          : false;

                        return isAllowedForWorkType ? (
                          <button
                            onClick={() => {
                              setPrintMode('standard');
                              setActivePrintRequest(req);
                            }}
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg"
                            title="Imprimer la demande"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2h10z" /></svg>
                          </button>
                        ) : null;
                      })()}

                      {/* Bouton Demande d'Établissement de Devis - Uniquement si toutes les validations sont complètes ET utilisateur autorisé pour ce type */}
                      {(() => {
                        // Vérifier si l'utilisateur actuel est autorisé pour ce type de travail spécifique
                        const workType = workTypes.find(wt => wt.label.toLowerCase() === req.serviceType.toLowerCase());
                        const isAllowedForWorkType = workType?.allowedRoles && workType.allowedRoles.length > 0
                          ? workType.allowedRoles.includes(currentUser?.role)
                          : false;

                        return req.status === RequestStatus.VALIDATED && isAllowedForWorkType ? (
                          <button
                            onClick={() => {
                              Swal.fire({
                                title: 'Générer la Demande d\'Établissement de Devis',
                                text: `Cette action va générer un document officiel demandant l'établissement d'un devis quantitatif et estimatif pour la demande ${req.id}.`,
                                icon: 'info',
                                showCancelButton: true,
                                confirmButtonColor: '#059669',
                                cancelButtonColor: '#6b7280',
                                confirmButtonText: '✅ Générer le document',
                                cancelButtonText: 'Annuler'
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  setPrintMode('quote-request');
                                  setActivePrintRequest(req);
                                }
                              });
                            }}
                            className="text-emerald-600 hover:text-emerald-700 transition-colors p-1.5 hover:bg-emerald-50 rounded-lg border-2 border-emerald-200 shadow-sm"
                            title="Générer la demande d'établissement de devis quantitatif et estimatif"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </button>
                        ) : null;
                      })()}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAndSortedRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002 2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-black uppercase tracking-widest italic">Aucun dossier trouvé.</p>
                        <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">Ajustez vos filtres ou vérifiez la saisie.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activePrintRequest && printMode === 'standard' && (
        <WorkRequestPrint
          request={activePrintRequest}
          agency={agencies.find(a => a.id === activePrintRequest.agencyId)}
          centre={centres.find(c => c.id === (agencies.find(a => a.id === activePrintRequest.agencyId)?.centreId || activePrintRequest.centreId))}
          unit={units.find(u => u.id === centres.find(c => c.id === (agencies.find(a => a.id === activePrintRequest.agencyId)?.centreId || activePrintRequest.centreId))?.unitId)}
          onClose={() => setActivePrintRequest(null)}
        />
      )}

      {activePrintRequest && printMode === 'quote-request' && (
        <QuoteEstablishmentRequestPrint
          request={activePrintRequest}
          agency={agencies.find(a => a.id === activePrintRequest.agencyId)}
          centre={centres.find(c => c.id === (agencies.find(a => a.id === activePrintRequest.agencyId)?.centreId || activePrintRequest.centreId))}
          unit={units.find(u => u.id === centres.find(c => c.id === (agencies.find(a => a.id === activePrintRequest.agencyId)?.centreId || activePrintRequest.centreId))?.unitId)}
          onClose={() => setActivePrintRequest(null)}
        />
      )}
    </div>
  );
};
