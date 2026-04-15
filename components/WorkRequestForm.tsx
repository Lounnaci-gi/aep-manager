import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { WorkRequest, RequestStatus, WorkType, Client, CommercialAgency, Centre, ClientCategory, UserRole, WORK_TYPE_PERMISSIONS, BranchementType, ValidationType } from '../types';
import { WorkflowEngine } from '../services/workflowEngine';

interface WorkRequestFormProps {
  onSave: (request: WorkRequest) => void;
  onCancel: () => void;
  clients: Client[];
  workTypes: WorkType[];
  agencies: CommercialAgency[];
  centres: Centre[];
  initialData?: WorkRequest;
  currentUserAgencyId?: string;
  currentUser?: { role: UserRole; agencyId?: string };
  requests: WorkRequest[];
}

export const WorkRequestForm: React.FC<WorkRequestFormProps> = ({ 
  onSave, 
  onCancel, 
  clients, 
  workTypes, 
  agencies,
  centres,
  initialData,
  currentUserAgencyId,
  currentUser,
  requests
}) => {
  // Obtenir le centreId depuis l'agence
  const getCentreIdFromAgency = (agencyId: string): string => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency?.centreId || '';
  };
  
  // Filtrer les types de travaux selon les permissions de l'utilisateur
  const getFilteredWorkTypes = (): WorkType[] => {
    if (!currentUser) return workTypes;
    
    return workTypes.filter(workType => {
      const allowedRoles = (workType.allowedRoles && workType.allowedRoles.length > 0) ? workType.allowedRoles : (WORK_TYPE_PERMISSIONS[workType.label || ''] || Object.values(UserRole));
      return allowedRoles.includes(currentUser.role);
    });
  };

  const filteredWorkTypes = getFilteredWorkTypes();

  const [formData, setFormData] = useState({
    category: initialData?.category || ClientCategory.PHYSICAL,
    civility: initialData?.civility || 'M.',
    businessName: initialData?.businessName || '',
    clientName: initialData?.clientName || '',
    idDocumentType: initialData?.idDocumentType || 'CNI',
    idDocumentNumber: initialData?.idDocumentNumber || '',
    idDocumentIssueDate: initialData?.idDocumentIssueDate || '',
    idDocumentIssuer: initialData?.idDocumentIssuer || '',
    clientEmail: initialData?.clientEmail || '',
    clientPhone: initialData?.clientPhone || '',
    address: initialData?.address || '',
    commune: initialData?.commune || '',
    installationAddress: initialData?.installationAddress || '',
    installationCommune: initialData?.installationCommune || '',
    serviceType: initialData?.serviceType || (filteredWorkTypes.length > 0 ? filteredWorkTypes[0].label : ''),
    description: initialData?.description || '',
    type: initialData?.type || 'Propriétaire',
    agencyId: initialData?.agencyId || currentUserAgencyId || (agencies.length > 0 ? agencies[0].id : ''),
    branchementType: initialData?.branchementType || '',
    branchementDetails: initialData?.branchementDetails || '',
    diameter: initialData?.diameter || '',
    flowRate: initialData?.flowRate || '',
    correspondencePhone: initialData?.correspondencePhone || initialData?.correspondencePhone || '',
    correspondenceEmail: initialData?.correspondenceEmail || initialData?.correspondenceEmail || '',
    installationPhone: initialData?.installationPhone || '',
    installationEmail: initialData?.installationEmail || '',
  });

  const isLegal = formData.category === ClientCategory.LEGAL;
  const isBranchementEau = formData.serviceType === "Branchement d'eau Potable";
  const isServiceTypeSelected = formData.serviceType && formData.serviceType.trim() !== "";

  const [matchingRequests, setMatchingRequests] = useState<WorkRequest[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Diamètre dropdown state
  const DIAMETER_OPTIONS = ['15','20','25','32','40','50','63','75','90','110','125','140','160','180','200','225','250','280','315','355','400'];
  const [diameterDropdownOpen, setDiameterDropdownOpen] = useState(false);
  const [diameterSearch, setDiameterSearch] = useState(formData.diameter || '');
  const diameterRef = useRef<HTMLDivElement>(null);
  const filteredDiameters = DIAMETER_OPTIONS.filter(d => d.includes(diameterSearch));

  // Débit dropdown state
  const FLOW_RATE_OPTIONS = ['1,0 m³/h','1,6 m³/h','2,6 m³/h','4,0 m³/h','6,4 m³/h','10,2 m³/h','14,5 m³/h','21,0 m³/h','31,5 m³/h'];
  const [flowRateDropdownOpen, setFlowRateDropdownOpen] = useState(false);
  const [flowRateSearch, setFlowRateSearch] = useState(formData.flowRate || '');
  const flowRateRef = useRef<HTMLDivElement>(null);
  const filteredFlowRates = FLOW_RATE_OPTIONS.filter(f => f.toLowerCase().includes(flowRateSearch.toLowerCase()));

  // Calcul des limites de date pour la pièce d'identité (max 10 ans)
  const todayStr = new Date().toISOString().split('T')[0];
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  const minDateStr = tenYearsAgo.toISOString().split('T')[0];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (diameterRef.current && !diameterRef.current.contains(e.target as Node)) {
        setDiameterDropdownOpen(false);
      }
      if (flowRateRef.current && !flowRateRef.current.contains(e.target as Node)) {
        setFlowRateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Détection de doublons (demandes non validées pour le même nom)
  useEffect(() => {
    const searchName = isLegal ? formData.businessName : formData.clientName;
    
    if (searchName.trim().length >= 3) {
      const matches = requests.filter(req => {
        // Ignorer la demande actuelle si on est en mode édition
        if (initialData && req.id === initialData.id) return false;
        
        // Uniquement les demandes non validées/facturées
        const isNotValidated = req.status !== RequestStatus.VALIDATED && req.status !== RequestStatus.QUOTED;
        if (!isNotValidated) return false;

        const targetName = (isLegal ? req.businessName : req.clientName) || '';
        return targetName.toLowerCase().includes(searchName.toLowerCase());
      });
      setMatchingRequests(matches);
    } else {
      setMatchingRequests([]);
    }
  }, [formData.clientName, formData.businessName, requests, isLegal, initialData]);



  const handleSelectClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setFormData({
        ...formData,
        category: selected.category,
        civility: selected.civility || 'M.',
        businessName: selected.businessName || '',
        clientName: selected.name,
        idDocumentType: selected.idDocumentType || 'CNI',
        idDocumentNumber: selected.idDocumentNumber || '',
        idDocumentIssueDate: selected.idDocumentIssueDate || '',
        idDocumentIssuer: selected.idDocumentIssuer || '',
        clientEmail: selected.email,
        clientPhone: selected.phone,
        address: selected.address,
        commune: selected.commune,
        installationAddress: selected.installationAddress || selected.address,
        installationCommune: selected.installationCommune || selected.commune,
        type: selected.type || 'Propriétaire',
      });
    }
  };

  // Fonction pour générer un ID temporaire au format spécial pour indiquer au backend de générer un vrai ID
  // NOTE: Pour une implémentation complète, cette fonction devrait être appelée via le backend
  // avec un système d'incrément basé sur la base de données
  const generateTempRequestId = () => {
    const currentYear = new Date().getFullYear();
    
    // Utiliser le préfixe du centre de l'utilisateur connecté
    let prefix = 'CB'; // Préfixe par défaut
    let centreId = ''; // Centre ID
    if (currentUser && centres.length > 0) {
      const userCentre = centres.find(centre => centre.id === (currentUser as any).centreId);
      if (userCentre && userCentre.prefix) {
        prefix = userCentre.prefix;
        centreId = userCentre.id;
      }
    }
    
    // ID spécial pour indiquer au backend de générer le vrai numéro incrémental
    return `TEMP-${Date.now()}-${prefix}-${currentYear}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation de la date de la pièce d'identité (max 10 ans)
    if (!isLegal && formData.idDocumentIssueDate) {
      const issueDate = new Date(formData.idDocumentIssueDate);
      const minAllowedDate = new Date();
      minAllowedDate.setFullYear(minAllowedDate.getFullYear() - 10);
      minAllowedDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (issueDate < minAllowedDate) {
        Swal.fire({
          title: 'Pièce d\'identité périmée',
          text: 'La date de délivrance ne peut pas dépasser 10 ans. La pièce n\'est plus valide.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
        return;
      }

      if (issueDate > today) {
        Swal.fire({
          title: 'Date invalide',
          text: 'La date de délivrance ne peut pas être dans le futur.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
        return;
      }
    }
    
    // NOUVEAU: Utiliser le moteur de workflow pour déterminer les validations
    const tempRequest: WorkRequest = {
      id: 'temp',
      clientId: '',
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      centreId: '',
      installationAddress: formData.installationAddress,
      installationCommune: formData.installationCommune,
      serviceType: formData.serviceType,
      description: formData.description,
      type: formData.type as any,
      status: RequestStatus.RECEIVED,
      agencyId: formData.agencyId,
      createdAt: new Date().toISOString()
    };

    // Construire les validations basées sur le workflow
    const validations = WorkflowEngine.buildInitialValidations(tempRequest);
    const assignedValidations = validations.map(v => v.type);
    
    // Déterminer le statut initial (toujours Reçu à la création selon la demande utilisateur)
    const initialStatus = RequestStatus.RECEIVED;
    
    // Capitaliser la 1ère lettre de chaque mot
    const capitalizeWords = (str: string | undefined | null) => {
      if (typeof str !== 'string' || !str) return str;
      return str.replace(/(?:^|\s|-|')\S/g, match => match.toUpperCase());
    };

    const formattedData = { ...formData };
    const fieldsToCapitalize = [
      'businessName', 'clientName', 'idDocumentIssuer', 
      'address', 'commune', 'installationAddress', 'installationCommune',
      'branchementDetails', 'description'
    ] as const;

    fieldsToCapitalize.forEach(field => {
      if (typeof formattedData[field] === 'string' && formattedData[field]) {
        (formattedData as any)[field] = capitalizeWords(formattedData[field] as string);
      }
    });

    // Nettoyer les champs spécifiques au branchement si ce n'est pas un branchement d'eau potable
    if (!isBranchementEau) {
      formattedData.branchementType = '' as any;
      formattedData.branchementDetails = '';
      formattedData.diameter = '';
      formattedData.flowRate = '';
    }
    
    const request: WorkRequest = {
      id: initialData?.id || generateTempRequestId(),
      ...formattedData,
      clientId: initialData?.clientId || '',
      centreId: initialData?.centreId || getCentreIdFromAgency(formData.agencyId),
      type: formData.type as 'Proprietaire' | 'Locataire' | 'Mandataire',
      branchementType: formData.branchementType as any,
      status: initialData?.status || initialStatus,
      assignedValidations,
      validations,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };
    setIsSaving(true);
    try {
      onSave(request);
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };


  


  return (
    <div className="max-w-full mx-auto space-y-6 pb-12 w-full">
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in slide-in-from-bottom duration-300">
      <div className="mb-10 border-b border-gray-100 pb-8">
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
          {initialData ? 'Modification de Demande' : 'Saisie Demande de Travaux'}
        </h2>
        <p className="text-base text-gray-500 font-medium mt-1.5">Capture des informations administratives, juridiques et techniques.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-4">Client & Qualité</h3>
          
          {!isServiceTypeSelected && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-xs font-black text-amber-700 uppercase tracking-widest">
                ⚠️ Veuillez d'abord sélectionner un type de travaux
              </p>
            </div>
          )}
          


          <div className={`bg-blue-50/30 p-4 rounded-2xl border border-blue-100 space-y-4 ${!isServiceTypeSelected ? 'opacity-50' : ''}`}>
            <div className="grid grid-cols-2 gap-3">
               <button 
                 type="button" 
                 onClick={() => isServiceTypeSelected && setFormData({...formData, category: ClientCategory.PHYSICAL})} 
                 className={`flex-1 py-2 rounded-lg text-xs font-black uppercase border transition-all ${!isLegal ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400'} ${!isServiceTypeSelected ? 'cursor-not-allowed' : ''}`}
                 disabled={!isServiceTypeSelected}
               >
                 Physique
               </button>
               <button 
                 type="button" 
                 onClick={() => isServiceTypeSelected && setFormData({...formData, category: ClientCategory.LEGAL})} 
                 className={`flex-1 py-2 rounded-lg text-xs font-black uppercase border transition-all ${isLegal ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400'} ${!isServiceTypeSelected ? 'cursor-not-allowed' : ''}`}
                 disabled={!isServiceTypeSelected}
               >
                 Morale
               </button>
            </div>

            {isLegal ? (
              <input 
                required 
                type="text" 
                placeholder="Raison Sociale" 
                className={`w-full rounded-xl border-gray-200 p-3.5 text-base font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.businessName} 
                onChange={e => isServiceTypeSelected && setFormData({ ...formData, businessName: e.target.value })}
                disabled={!isServiceTypeSelected}
              />
            ) : null}

            <div className="grid grid-cols-4 gap-2">
              {!isLegal && (
                <select 
                  className={`col-span-1 rounded-xl border-gray-200 p-3 text-sm font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={formData.civility} 
                  onChange={e => isServiceTypeSelected && setFormData({ ...formData, civility: e.target.value })}
                  disabled={!isServiceTypeSelected}
                >
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                </select>
              )}
              <input 
                required 
                type="text" 
                placeholder={isLegal ? "Responsable" : "Nom & Prénom"} 
                className={`${isLegal ? 'col-span-4' : 'col-span-3'} rounded-xl border-gray-200 p-3 text-base font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.clientName} 
                onChange={e => isServiceTypeSelected && setFormData({ ...formData, clientName: e.target.value })}
                disabled={!isServiceTypeSelected}
              />
            </div>

            {!isLegal && (
              <div className="pt-3 border-t border-blue-100 space-y-3">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Pièce d'identité</p>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    className={`col-span-1 rounded-lg border-blue-100 p-2.5 text-[11px] font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.idDocumentType}
                    onChange={e => isServiceTypeSelected && setFormData({ ...formData, idDocumentType: e.target.value })}
                    disabled={!isServiceTypeSelected}
                  >
                    <option value="CNI">Carte nationale</option>
                    <option value="PERMIS">Permis de conduire</option>
                  </select>
                  <input 
                    required 
                    type="text" 
                    placeholder="N° Pièce" 
                    maxLength={18}
                    className={`rounded-lg border-blue-100 p-2.5 text-[11px] font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.idDocumentNumber} 
                    onChange={e => isServiceTypeSelected && setFormData({ ...formData, idDocumentNumber: e.target.value })}
                    disabled={!isServiceTypeSelected}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    required 
                    type="date" 
                    min={minDateStr}
                    max={todayStr}
                    className={`rounded-lg border-blue-100 p-2.5 text-[11px] font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.idDocumentIssueDate} 
                    onChange={e => isServiceTypeSelected && setFormData({ ...formData, idDocumentIssueDate: e.target.value })}
                    disabled={!isServiceTypeSelected}
                  />
                  <input 
                    required 
                    type="text" 
                    placeholder="Délivré par" 
                    className={`rounded-lg border-blue-100 p-2.5 text-[11px] font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.idDocumentIssuer} 
                    onChange={e => isServiceTypeSelected && setFormData({ ...formData, idDocumentIssuer: e.target.value })}
                    disabled={!isServiceTypeSelected}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-emerald-600 uppercase mb-1.5 ml-1">Qualité de l'abonné</label>
              <select 
                className={`w-full rounded-xl border-emerald-200 p-3 text-sm font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.type} 
                onChange={e => isServiceTypeSelected && setFormData({ ...formData, type: e.target.value as any })}
                disabled={!isServiceTypeSelected}
              >
                <option value="Propriétaire">Propriétaire</option>
                <option value="Locataire">Locataire</option>
                <option value="Mandataire">Mandataire</option>
              </select>
            </div>
          </div>

          {/* Adresse de correspondance - always shown for any request */}
          <div className="space-y-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="border-b border-gray-200 pb-4">
              <h5 className="text-[11px] font-black text-gray-600 uppercase tracking-widest mb-3">Adresse de correspondance</h5>
              <input required type="text" placeholder="Rue" maxLength={120} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-bold border mb-3" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              <input required type="text" placeholder="Commune" maxLength={40} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-bold border mb-3" value={formData.commune} onChange={e => setFormData({ ...formData, commune: e.target.value })} />
              <input type="text" placeholder="Téléphone (facultatif)" maxLength={10} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-bold border mb-3" value={formData.correspondencePhone} onChange={e => setFormData({ ...formData, correspondencePhone: e.target.value })} />
              <input type="email" placeholder="Email (facultatif)" maxLength={50} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-bold border" value={formData.correspondenceEmail} onChange={e => setFormData({ ...formData, correspondenceEmail: e.target.value })} />
            </div>
          </div>

          {isBranchementEau && (
            <div className="space-y-3 p-4 bg-blue-50/20 border border-blue-100 rounded-2xl">
              {/* Adresse de branchement & Specs */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h5 className="text-[11px] font-black text-gray-600 uppercase tracking-widest mb-3">Adresse de branchement</h5>
                <input required type="text" placeholder="Rue" maxLength={120} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-bold border mb-3" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
                <input required type="text" placeholder="Commune" maxLength={40} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-bold border mb-3" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
              </div>
              
              {/* Diamètre et Débit */}
              <div>
                <h5 className="text-[11px] font-black text-gray-600 uppercase tracking-widest mb-3">Caractéristiques du branchement</h5>
                <div ref={diameterRef} className="relative mb-3">
                  {/* Hidden input enforces required validation on the selected value */}
                  <input type="hidden" required value={formData.diameter || ''} />
                  <input
                    type="text"
                    required
                    placeholder="Diamètre du branchement"
                    className={`w-full rounded-xl p-3.5 text-base font-bold border pr-10 ${
                      diameterSearch && !DIAMETER_OPTIONS.includes(diameterSearch)
                        ? 'border-red-400 bg-red-50/30 focus:ring-red-300'
                        : 'border-gray-200'
                    }`}
                    value={diameterSearch}
                    onChange={e => {
                      setDiameterSearch(e.target.value);
                      setDiameterDropdownOpen(true);
                      // Only set diameter if exact match from list
                      if (DIAMETER_OPTIONS.includes(e.target.value)) {
                        setFormData({ ...formData, diameter: e.target.value });
                      } else {
                        setFormData({ ...formData, diameter: '' });
                      }
                    }}
                    onFocus={() => setDiameterDropdownOpen(true)}
                    autoComplete="off"
                  />
                  {diameterSearch && !DIAMETER_OPTIONS.includes(diameterSearch) && !diameterDropdownOpen && (
                    <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">⚠ Veuillez sélectionner un diamètre de la liste</p>
                  )}
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setDiameterDropdownOpen(!diameterDropdownOpen)}
                    tabIndex={-1}
                  >
                    <svg className={`w-4 h-4 transition-transform ${diameterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {diameterDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredDiameters.length > 0 ? filteredDiameters.map(d => (
                        <button
                          key={d}
                          type="button"
                          className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                            formData.diameter === d ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setFormData({ ...formData, diameter: d });
                            setDiameterSearch(d);
                            setDiameterDropdownOpen(false);
                          }}
                        >
                          {d} mm
                        </button>
                      )) : (
                        <div className="px-4 py-3 text-xs text-gray-400 font-bold text-center">Aucun diamètre trouvé</div>
                      )}
                    </div>
                  )}
                </div>
                <div ref={flowRateRef} className="relative">
                  {/* Hidden input enforces required validation on the selected value */}
                  <input type="hidden" required value={formData.flowRate || ''} />
                  <input
                    type="text"
                    required
                    placeholder="Débit moyen horaire"
                    className={`w-full rounded-xl p-3.5 text-base font-bold border pr-10 ${
                      flowRateSearch && !FLOW_RATE_OPTIONS.includes(flowRateSearch)
                        ? 'border-red-400 bg-red-50/30 focus:ring-red-300'
                        : 'border-gray-200'
                    }`}
                    value={flowRateSearch}
                    onChange={e => {
                      setFlowRateSearch(e.target.value);
                      setFlowRateDropdownOpen(true);
                      if (FLOW_RATE_OPTIONS.includes(e.target.value)) {
                        setFormData({ ...formData, flowRate: e.target.value });
                      } else {
                        setFormData({ ...formData, flowRate: '' });
                      }
                    }}
                    onFocus={() => setFlowRateDropdownOpen(true)}
                    autoComplete="off"
                  />
                  {flowRateSearch && !FLOW_RATE_OPTIONS.includes(flowRateSearch) && !flowRateDropdownOpen && (
                    <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">⚠ Veuillez sélectionner un débit de la liste</p>
                  )}
                  <button
                    type="button"
                    className="absolute right-3 top-[18px] -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setFlowRateDropdownOpen(!flowRateDropdownOpen)}
                    tabIndex={-1}
                  >
                    <svg className={`w-4 h-4 transition-transform ${flowRateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {flowRateDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredFlowRates.length > 0 ? filteredFlowRates.map(f => (
                        <button
                          key={f}
                          type="button"
                          className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                            formData.flowRate === f ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setFormData({ ...formData, flowRate: f });
                            setFlowRateSearch(f);
                            setFlowRateDropdownOpen(false);
                          }}
                        >
                          {f}
                        </button>
                      )) : (
                        <div className="px-4 py-3 text-xs text-gray-400 font-bold text-center">Aucun débit trouvé</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest border-l-4 border-amber-600 pl-4">Lieu des Travaux</h3>
          
          <select className="w-full rounded-xl border-gray-200 p-3.5 text-base font-black border bg-amber-50/20" value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })}>
            {filteredWorkTypes.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>

          {isBranchementEau && (
            <div className="space-y-4 p-5 bg-blue-50/30 border border-blue-100 rounded-2xl">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Type de Branchement</h4>
              <select 
                className="w-full rounded-xl border-blue-200 p-3.5 text-base font-black border bg-white" 
                value={formData.branchementType} 
                onChange={e => setFormData({ ...formData, branchementType: e.target.value as BranchementType })}
              >
                <option value="" disabled>--- Sélectionner le type ---</option>
                <option value={BranchementType.DOMESTIQUE}>{BranchementType.DOMESTIQUE}</option>
                <option value={BranchementType.IMMEUBLE}>{BranchementType.IMMEUBLE}</option>
                <option value={BranchementType.COMMERCIAL}>{BranchementType.COMMERCIAL}</option>
                <option value={BranchementType.INDUSTRIEL}>{BranchementType.INDUSTRIEL}</option>
                <option value={BranchementType.CHANTIER}>{BranchementType.CHANTIER}</option>
                <option value={BranchementType.INCENDIE}>{BranchementType.INCENDIE}</option>
                <option value={BranchementType.AUTRE}>{BranchementType.AUTRE}</option>
              </select>
              
              {formData.branchementType === BranchementType.AUTRE && (
                <input 
                  type="text" 
                  placeholder="Précisez le type de branchement" 
                  className="w-full rounded-xl border-blue-200 p-3.5 text-base font-medium border bg-white mt-3" 
                  value={formData.branchementDetails} 
                  onChange={e => setFormData({ ...formData, branchementDetails: e.target.value })}
                />
              )}
            </div>
          )}

          <div className="space-y-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            {isBranchementEau ? (
              <>
                <input required type="text" placeholder="Adresse précise du site" maxLength={120} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-bold border" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
                <input required type="text" placeholder="Commune du site" maxLength={40} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-black border" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
              </>
            ) : (
              <>
                <input required type="text" placeholder="Adresse précise du site" maxLength={120} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-bold border" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
                <input required type="text" placeholder="Commune du site" maxLength={40} className="w-full rounded-xl border-gray-200 p-3.5 text-base font-black border" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
              </>
            )}
          </div>

          <textarea rows={4} className="w-full rounded-xl border-gray-200 p-4 text-base font-medium border" placeholder="Détails techniques du projet (facultatif)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />



        </div>
      </div>

      <div className="mt-12 flex justify-end gap-4 pt-8 border-t border-gray-50">
        <button type="button" onClick={onCancel} className="px-8 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Annuler</button>
        <button 
          type="submit" 
          disabled={isSaving}
          className={`px-16 py-5 text-xs font-black text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all uppercase tracking-widest ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Enregistrement...
            </div>
          ) : 'Valider la Demande'}
        </button>
      </div>
      </form>

      {/* Liste des demandes existantes (Doublons potentiels) - Affichée en dehors du formulaire sous forme de tableau */}
      {matchingRequests.length > 0 && (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-amber-100 animate-in slide-in-from-top duration-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <svg className="w-16 h-16 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-xl">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Liste des Doublons Potentiels</h3>
              <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">{matchingRequests.length} demande(s) en cours trouvée(s)</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-amber-50/50">
                <tr>
                  <th className="px-4 py-2 text-left text-[9px] font-black text-amber-700 uppercase tracking-widest">N° Demande</th>
                  <th className="px-4 py-2 text-left text-[9px] font-black text-amber-700 uppercase tracking-widest">Client</th>
                  <th className="px-4 py-2 text-left text-[9px] font-black text-amber-700 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-2 text-left text-[9px] font-black text-amber-700 uppercase tracking-widest">Prestation</th>
                  <th className="px-4 py-2 text-left text-[9px] font-black text-amber-700 uppercase tracking-widest">Commune</th>
                  <th className="px-4 py-2 text-right text-[9px] font-black text-amber-700 uppercase tracking-widest">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {matchingRequests.map(req => (
                  <tr key={req.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap text-[10px] font-black text-gray-900">
                      #{req.id.replace('TEMP-', 'T-')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-[10px] font-black text-gray-900">{req.businessName || req.clientName}</div>
                      {req.businessName && <div className="text-[7px] text-gray-400 font-bold uppercase tracking-widest">Moral</div>}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-[9px] text-gray-500 font-bold uppercase">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-[9px] font-black text-blue-600 uppercase tracking-tighter">
                      {req.serviceType}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-[9px] text-gray-400 font-bold uppercase">
                      {req.commune || req.installationCommune}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <span className="px-2 py-0.5 text-[8px] font-black rounded-full border bg-amber-50 text-amber-700 border-amber-100 uppercase">
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-2 p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/50">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
            <p className="text-[8px] text-amber-700 font-bold italic leading-relaxed">
              Merci de vérifier s'il s'agit d'un doublon avant de valider ce formulaire.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
