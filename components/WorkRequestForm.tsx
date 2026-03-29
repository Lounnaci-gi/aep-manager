
import React, { useState, useEffect } from 'react';
import { WorkRequest, RequestStatus, WorkType, Client, CommercialAgency, Centre, ClientCategory, UserRole, WORK_TYPE_PERMISSIONS, BranchementType, ValidationType } from '../types';

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
    serviceType: initialData?.serviceType || (workTypes.length > 0 ? workTypes[0].label : ''),
    description: initialData?.description || '',
    type: initialData?.type || 'Propriétaire',
    agencyId: initialData?.agencyId || currentUserAgencyId || (agencies.length > 0 ? agencies[0].id : ''),
    branchementType: initialData?.branchementType || BranchementType.DOMESTIQUE,
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

  // Filtrer les types de travaux selon les permissions de l'utilisateur
  const getFilteredWorkTypes = (): WorkType[] => {
    if (!currentUser) return workTypes;
    
    return workTypes.filter(workType => {
      const allowedRoles = (workType.allowedRoles && workType.allowedRoles.length > 0) ? workType.allowedRoles : (WORK_TYPE_PERMISSIONS[workType.label || ''] || Object.values(UserRole));
      return allowedRoles.includes(currentUser.role);
    });
  };

  const filteredWorkTypes = getFilteredWorkTypes();

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
    if (currentUser && centres.length > 0) {
      const userCentre = centres.find(centre => centre.id === currentUser.centreId);
      if (userCentre && userCentre.prefix) {
        prefix = userCentre.prefix;
      }
    }
    
    // ID spécial pour indiquer au backend de générer le vrai numéro incrémental
    return `TEMP-${Date.now()}-${prefix}-${currentYear}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Déterminer les validations à assigner selon le type de service
    const assignedValidations: ValidationType[] = [];
    if (isBranchementEau) {
      assignedValidations.push(ValidationType.AGENCY, ValidationType.CUSTOMER_SERVICE, ValidationType.LAWYER);
    }
    
    const request: WorkRequest = {
      id: initialData?.id || generateTempRequestId(),
      ...formData,
      status: initialData?.status || (isBranchementEau ? RequestStatus.AWAITING_AGENCY_VALIDATION : RequestStatus.RECEIVED),
      assignedValidations,
      validations: assignedValidations.map(type => ({
        type,
        userId: '',
        userName: '',
        validatedAt: '',
        status: 'pending'
      })),
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };
    onSave(request);
  };


  


  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in slide-in-from-bottom duration-300">
      <div className="mb-10 border-b border-gray-100 pb-8">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
          {initialData ? 'Modification de Demande' : 'Saisie Demande de Travaux'}
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-1">Capture des informations administratives, juridiques et techniques.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Client & Qualité</h3>
          
          {!isServiceTypeSelected && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                ⚠️ Veuillez d'abord sélectionner un type de travaux
              </p>
            </div>
          )}
          


          <div className={`bg-blue-50/30 p-4 rounded-2xl border border-blue-100 space-y-4 ${!isServiceTypeSelected ? 'opacity-50' : ''}`}>
            <div className="grid grid-cols-2 gap-2">
               <button 
                 type="button" 
                 onClick={() => isServiceTypeSelected && setFormData({...formData, category: ClientCategory.PHYSICAL})} 
                 className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${!isLegal ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'} ${!isServiceTypeSelected ? 'cursor-not-allowed' : ''}`}
                 disabled={!isServiceTypeSelected}
               >
                 Physique
               </button>
               <button 
                 type="button" 
                 onClick={() => isServiceTypeSelected && setFormData({...formData, category: ClientCategory.LEGAL})} 
                 className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${isLegal ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400'} ${!isServiceTypeSelected ? 'cursor-not-allowed' : ''}`}
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
                className={`w-full rounded-xl border-gray-200 p-3 text-sm font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.businessName} 
                onChange={e => isServiceTypeSelected && setFormData({ ...formData, businessName: e.target.value })}
                disabled={!isServiceTypeSelected}
              />
            ) : null}

            <div className="grid grid-cols-4 gap-2">
              {!isLegal && (
                <select 
                  className={`col-span-1 rounded-xl border-gray-200 p-2.5 text-xs font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                className={`${isLegal ? 'col-span-4' : 'col-span-3'} rounded-xl border-gray-200 p-2.5 text-sm font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.clientName} 
                onChange={e => isServiceTypeSelected && setFormData({ ...formData, clientName: e.target.value })}
                disabled={!isServiceTypeSelected}
              />
            </div>

            {!isLegal && (
              <div className="pt-2 border-t border-blue-100 space-y-2">
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">Pièce d'identité</p>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    className={`col-span-1 rounded-lg border-blue-100 p-2 text-[10px] font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    className={`rounded-lg border-blue-100 p-2 text-[10px] font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.idDocumentNumber} 
                    onChange={e => isServiceTypeSelected && setFormData({ ...formData, idDocumentNumber: e.target.value })}
                    disabled={!isServiceTypeSelected}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    required 
                    type="date" 
                    className={`rounded-lg border-blue-100 p-2 text-[10px] font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.idDocumentIssueDate} 
                    onChange={e => isServiceTypeSelected && setFormData({ ...formData, idDocumentIssueDate: e.target.value })}
                    disabled={!isServiceTypeSelected}
                  />
                  <input 
                    required 
                    type="text" 
                    placeholder="Délivré par" 
                    className={`rounded-lg border-blue-100 p-2 text-[10px] font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={formData.idDocumentIssuer} 
                    onChange={e => isServiceTypeSelected && setFormData({ ...formData, idDocumentIssuer: e.target.value })}
                    disabled={!isServiceTypeSelected}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[9px] font-black text-emerald-600 uppercase mb-1 ml-1">Qualité de l'abonné</label>
              <select 
                className={`w-full rounded-xl border-emerald-200 p-2.5 text-xs font-black border bg-white ${!isServiceTypeSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          {isBranchementEau && (
            <div className="space-y-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              {/* Adresse de correspondance */}
              <div className="border-b border-gray-200 pb-3 mb-3">
                <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Adresse de correspondance</h5>
                <input required type="text" placeholder="Rue" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border mb-2" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                <input required type="text" placeholder="Commune" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border mb-2" value={formData.commune} onChange={e => setFormData({ ...formData, commune: e.target.value })} />
                <input type="text" placeholder="Téléphone (facultatif)" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border mb-2" value={formData.correspondencePhone} onChange={e => setFormData({ ...formData, correspondencePhone: e.target.value })} />
                <input type="email" placeholder="Email (facultatif)" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border" value={formData.correspondenceEmail} onChange={e => setFormData({ ...formData, correspondenceEmail: e.target.value })} />
              </div>
              
              {/* Adresse de branchement */}
              <div className="border-b border-gray-200 pb-3 mb-3">
                <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Adresse de branchement</h5>
                <input required type="text" placeholder="Rue" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border mb-2" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
                <input required type="text" placeholder="Commune" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border mb-2" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
              </div>
              
              {/* Diamètre et Débit */}
              <div>
                <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Caractéristiques du branchement</h5>
                <input required type="text" placeholder="Diamètre du branchement" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border mb-2" value={formData.diameter || ''} onChange={e => setFormData({ ...formData, diameter: e.target.value })} />
                <input required type="text" placeholder="Débit moyen horaire" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border" value={formData.flowRate || ''} onChange={e => setFormData({ ...formData, flowRate: e.target.value })} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-widest border-l-4 border-amber-600 pl-3">Lieu des Travaux</h3>
          
          <select className="w-full rounded-xl border-gray-200 p-3 text-sm font-black border bg-amber-50/20" value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })}>
            {filteredWorkTypes.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>

          {isBranchementEau && (
            <div className="space-y-3 p-4 bg-blue-50/30 border border-blue-100 rounded-2xl">
              <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Type de Branchement</h4>
              <select 
                className="w-full rounded-xl border-blue-200 p-3 text-sm font-black border bg-white" 
                value={formData.branchementType} 
                onChange={e => setFormData({ ...formData, branchementType: e.target.value as BranchementType })}
              >
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
                  className="w-full rounded-xl border-blue-200 p-3 text-sm font-medium border bg-white mt-2" 
                  value={formData.branchementDetails} 
                  onChange={e => setFormData({ ...formData, branchementDetails: e.target.value })}
                />
              )}
            </div>
          )}

          <div className="space-y-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            {isBranchementEau ? (
              <>
                <input required type="text" placeholder="Adresse précise du site" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
                <input required type="text" placeholder="Commune du site" className="w-full rounded-xl border-gray-200 p-3 text-sm font-black border" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
              </>
            ) : (
              <>
                <input required type="text" placeholder="Adresse précise du site" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
                <input required type="text" placeholder="Commune du site" className="w-full rounded-xl border-gray-200 p-3 text-sm font-black border" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
              </>
            )}
          </div>

          <textarea rows={3} className="w-full rounded-xl border-gray-200 p-3 text-sm font-medium border" placeholder="Détails techniques du projet (facultatif)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />



        </div>
      </div>

      <div className="mt-12 flex justify-end gap-4 pt-8 border-t border-gray-50">
        <button type="button" onClick={onCancel} className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Annuler</button>
        <button type="submit" className="px-12 py-4 text-[10px] font-black text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all uppercase tracking-widest">Valider la Demande</button>
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
