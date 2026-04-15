
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { Quote, QuoteStatus, Centre, CommercialAgency, WorkType, User, UserRole, WorkRequest } from '../types';
import { PermissionService } from '../services/permissionService';

interface QuoteListProps {
  quotes: Quote[];
  centres: Centre[];
  agencies: CommercialAgency[];
  workTypes: WorkType[];
  requests?: WorkRequest[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
  onCancelValidation?: (id: string, reason: string) => void;
  onEdit: (quote: Quote) => void;
  onView: (quote: Quote) => void; // Ouvre directement l'aperçu (mode lecture)
  currentUser?: User;
  users?: User[];
}

type SortDirection = 'asc' | 'desc' | 'none';

// --- PORTAL TOOLTIP COMPONENT ---
interface PortalTooltipProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const PortalTooltip: React.FC<PortalTooltipProps> = ({ trigger, children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX
      });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  return (
    <div 
      ref={triggerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      className={`relative inline-block ${className}`}
    >
      {trigger}
      {isVisible && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in duration-200"
          style={{ 
            top: coords.top - 12 + 'px', 
            left: coords.left + 'px',
            transform: 'translate(-50%, -100%)'
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
};

export const QuoteList: React.FC<QuoteListProps> = ({ quotes, centres, agencies, workTypes, requests, onDelete, onUpdateStatus, onCancelValidation, onEdit, onView, currentUser, users = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [statusSortOrder, setStatusSortOrder] = useState<SortDirection>('none');

  const getStatusColor = (status: QuoteStatus, isExpired: boolean) => {
    if (status === QuoteStatus.PENDING && isExpired) {
      return 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm shadow-rose-100';
    }
    switch (status) {
      case QuoteStatus.PENDING: return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case QuoteStatus.APPROVED: return 'bg-green-50 text-green-800 border-green-200';
      case QuoteStatus.REJECTED: return 'bg-red-50 text-red-800 border-red-200';
      case QuoteStatus.PAID: return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const checkIsExpired = (createdAt: string, status: QuoteStatus) => {
    if (status !== QuoteStatus.PENDING) return false;
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 });
  };

  const filteredAgencies = useMemo(() => {
    if (!selectedCentreId) return agencies;
    return agencies.filter(a => a.centreId === selectedCentreId);
  }, [agencies, selectedCentreId]);

  const filteredAndSortedQuotes = useMemo(() => {
    let result = quotes.filter(q => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        q.clientName.toLowerCase().includes(term) || 
        q.id.toLowerCase().includes(term);

      const quoteDate = new Date(q.createdAt).setHours(0, 0, 0, 0);
      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (quoteDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (quoteDate > end) matchesDate = false;
      }

      let matchesStructure = true;
      if (selectedAgencyId) {
        if (q.agencyId !== selectedAgencyId) matchesStructure = false;
      } else if (selectedCentreId) {
        const quoteAgency = agencies.find(a => a.id === q.agencyId);
        if (!quoteAgency || quoteAgency.centreId !== selectedCentreId) matchesStructure = false;
      }

      let matchesWorkType = true;
      if (selectedWorkType && q.serviceType !== selectedWorkType) {
        matchesWorkType = false;
      }

      return matchesSearch && matchesDate && matchesStructure && matchesWorkType;
    });

    if (statusSortOrder !== 'none') {
      result.sort((a, b) => {
        const statusA = a.status.toString();
        const statusB = b.status.toString();
        return statusSortOrder === 'asc' ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
      });
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [quotes, searchTerm, startDate, endDate, selectedCentreId, selectedAgencyId, selectedWorkType, agencies, statusSortOrder]);

  return (
    <div className="bg-white shadow-xl rounded-2xl md:rounded-[2rem] overflow-hidden border border-gray-100 mx-2 sm:mx-0">
      <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Gestion des Dossiers Travaux</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Surveillance des délais d'attente (30 jours max)</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            className="rounded-xl border-gray-200 p-2.5 text-[10px] font-black uppercase tracking-widest bg-white border"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="rounded-xl border-gray-200 p-2.5 text-[10px] font-black uppercase bg-white border"
            value={selectedCentreId}
            onChange={(e) => { setSelectedCentreId(e.target.value); setSelectedAgencyId(''); }}
          >
            <option value="">Tous les centres</option>
            {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className="rounded-xl border-gray-200 p-2.5 text-[10px] font-black uppercase bg-white border disabled:opacity-50"
            value={selectedAgencyId}
            onChange={(e) => setSelectedAgencyId(e.target.value)}
            disabled={!selectedCentreId}
          >
            <option value="">Toutes les agences</option>
            {filteredAgencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCentreId(''); setSelectedAgencyId(''); }}
            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-500"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/30">
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Réf / Date</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client / Prestation</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant TTC</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filteredAndSortedQuotes.map((quote) => {
              const expired = checkIsExpired(quote.createdAt, quote.status);
              
              const matchedWorkType = workTypes.find(wt => wt.label === quote.serviceType);

              // --- NOUVELLE LOGIQUE DE PERMISSIONS CENTRALISÉE ---
              const canPrint = PermissionService.canPrintQuote(currentUser, matchedWorkType);
              const canEdit = PermissionService.canManageQuote(currentUser, matchedWorkType, quote, users);
              const canDelete = PermissionService.canDeleteQuote(currentUser, matchedWorkType);
              const isFullyApproved = PermissionService.isQuoteFullyValidated(quote, matchedWorkType, users);
              
              // Données pour le tooltip de validation
              const quoteValidationRoles = (matchedWorkType?.quoteValidationRoles && matchedWorkType.quoteValidationRoles.length > 0)
                ? matchedWorkType.quoteValidationRoles
                : [UserRole.ADMIN, UserRole.CHEF_CENTRE];
              
              const requiredUsers = users.filter(u => quoteValidationRoles.includes(u.role));
              const currentValidations = quote.validations || [];
              const validatedUserIds = currentValidations.filter(v => v.status === 'validated').map(v => v.userId);
              const allUsersValidated = requiredUsers.every(u => validatedUserIds.includes(u.id));
              const hasUserValidated = currentUser ? validatedUserIds.includes(currentUser.id) : false;
              const missingUsers = requiredUsers.filter(u => !validatedUserIds.includes(u.id));
              
              const canValidateQuote = currentUser?.role ? quoteValidationRoles.includes(currentUser.role) : false;

              return (
                <tr key={quote.id} className={`hover:bg-blue-50/30 transition-colors group ${expired ? 'bg-rose-50/10' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-black text-blue-600 tracking-tight">{quote.id}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-black text-gray-900 leading-none">{quote.clientName}</div>
                    <div className="text-[10px] text-blue-400 uppercase font-black tracking-tighter mt-1">{quote.serviceType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-black">
                    {formatCurrency(quote.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 inline-flex text-[10px] font-black rounded-full uppercase tracking-tighter border-2 ${getStatusColor(quote.status, expired)}`}>
                        {quote.status}
                      </span>
                      {expired && (
                        <PortalTooltip
                          trigger={
                            <div className="flex items-center gap-1 cursor-help">
                              <div className="w-5 h-5 text-rose-600 animate-pulse bg-rose-100 rounded-full flex items-center justify-center p-1 border border-rose-200 shadow-sm shadow-rose-200">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                            </div>
                          }
                        >
                          <div className="bg-rose-600 text-white text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest whitespace-nowrap shadow-xl">
                            Relance requise (+30j)
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-rose-600"></div>
                          </div>
                        </PortalTooltip>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center gap-3">
                      {/* Bouton Visualiser/Imprimer → accessible si canPrint est vrai */}
                      {currentUser?.role !== UserRole.JURISTE && canPrint && (
                        <button 
                          onClick={() => { onView(quote); }} 
                          className={`p-2 rounded-xl transition-all ${
                            isFullyApproved
                              ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                              : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                          title={isFullyApproved ? 'Aperçu et impression du devis' : 
                                 !allUsersValidated ? `Aperçu (En attente de ${requiredUsers.length - validatedUserIds.length} validation(s))` :
                                 'Aperçu du devis'}
                        >
                          {isFullyApproved ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          ) : (
                            <div className="relative">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {!isFullyApproved && requiredUsers.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] font-black px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-white">
                                  {validatedUserIds.length}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      )}
                      
                      {/* Bouton Modifier - utilise PermissionService */}
                      {canEdit ? (
                        <button onClick={() => onEdit(quote)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-xl transition-all" title="Modifier le devis">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      ) : (
                        <button disabled className="text-gray-300 cursor-not-allowed p-2" title={isFullyApproved ? "Ce devis est validé et ne peut plus être modifié par votre rôle" : "Vous n'avez pas l'autorisation de modifier"}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}

                      {/* Boutons Valider/Rejeter + Sélecteur statut - basés sur quoteValidationRoles du type de travaux */}
                      {canValidateQuote && (
                        <>
                          {quote.status === QuoteStatus.PENDING && (
                            <>
                              {!hasUserValidated ? (
                                <>
                                  <button 
                                    onClick={() => onUpdateStatus(quote.id, QuoteStatus.APPROVED)} 
                                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100/50 flex items-center gap-1" 
                                    title={`Valider le devis (autorisé : ${quoteValidationRoles.join(', ')})`}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Valider
                                  </button>
                                  <button 
                                    onClick={() => onUpdateStatus(quote.id, QuoteStatus.REJECTED)} 
                                    className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100/50 flex items-center gap-1" 
                                    title="Rejeter le devis"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    Rejeter
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={async () => {
                                      const { value: reason } = await Swal.fire({
                                        title: 'Annuler la validation',
                                        input: 'textarea',
                                        inputLabel: 'Motif de l\'annulation',
                                        inputPlaceholder: 'Saisissez la raison pour laquelle vous annulez votre validation...',
                                        inputAttributes: { 'aria-label': 'Saisissez la raison' },
                                        showCancelButton: true,
                                        confirmButtonText: 'Confirmer l\'annulation',
                                        cancelButtonText: 'Ignorer',
                                        confirmButtonColor: '#e11d48', // rose-600
                                        inputValidator: (value) => {
                                          if (!value) return 'Vous devez fournir un motif pour annuler !';
                                        }
                                      });
                                      if (reason && onCancelValidation) {
                                        onCancelValidation(quote.id, reason);
                                      }
                                    }} 
                                    className="bg-gray-100 text-gray-500 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1" 
                                    title="Annuler ma validation"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Annuler
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          <PortalTooltip
                            trigger={
                              <div className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border flex items-center justify-center min-w-[120px] ${
                                quote.status === QuoteStatus.APPROVED 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-50' 
                                  : quote.status === QuoteStatus.PENDING
                                  ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm shadow-amber-50 cursor-help'
                                  : 'bg-gray-50 text-gray-500 border-gray-200 shadow-sm'
                              }`}>
                                {quote.status === QuoteStatus.APPROVED ? 'Validé' : 
                                 quote.status === QuoteStatus.PENDING ? 'Validation en attente' : 
                                 quote.status}
                              </div>
                            }
                          >
                            {/* Bulle des valideurs manquants - Version Dark refined */}
                            {quote.status === QuoteStatus.PENDING && missingUsers.length > 0 && (
                                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-2xl min-w-[240px]">
                                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                                    <div className="bg-amber-500/20 p-1.5 rounded-lg">
                                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Validations Requises</div>
                                  </div>

                                  <ul className="space-y-3">
                                    {missingUsers.map(u => (
                                      <li key={u.id} className="flex items-center gap-3">
                                        <div className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-white text-xs font-bold tracking-wide leading-tight">{u.fullName}</span>
                                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{u.role}</span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                                </div>
                            )}
                          </PortalTooltip>
                        </>
                      )}

                      {/* Bouton Supprimer - utilise PermissionService */}
                      {canDelete ? (
                        <button onClick={() => onDelete(quote.id)} className="text-gray-200 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all" title="Supprimer le devis">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      ) : (
                        <button disabled className="text-gray-300 cursor-not-allowed p-2" title="Vous n'avez pas l'autorisation de supprimer">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAndSortedQuotes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <p className="text-sm text-gray-300 font-black uppercase tracking-widest italic">Aucun dossier trouvé dans cette sélection.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
