
import React, { useState, useEffect } from 'react';
import { WorkRequest, RequestStatus, WorkType, Client, CommercialAgency, Centre, ClientCategory } from '../types';

interface WorkRequestFormProps {
  onSave: (request: WorkRequest) => void;
  onCancel: () => void;
  clients: Client[];
  workTypes: WorkType[];
  agencies: CommercialAgency[];
  centres: Centre[];
  initialData?: WorkRequest;
  currentUserAgencyId?: string;
}

export const WorkRequestForm: React.FC<WorkRequestFormProps> = ({ 
  onSave, 
  onCancel, 
  clients, 
  workTypes, 
  agencies,
  centres,
  initialData,
  currentUserAgencyId 
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
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request: WorkRequest = {
      id: initialData?.id || `DEM-${Date.now().toString().slice(-6)}`,
      ...formData,
      status: initialData?.status || RequestStatus.RECEIVED,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };
    onSave(request);
  };

  const isLegal = formData.category === ClientCategory.LEGAL;
  const isBranchement = formData.serviceType === "Branchement d'eau potable";

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-4xl mx-auto animate-in slide-in-from-bottom duration-300">
      <div className="mb-10 border-b border-gray-100 pb-8">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
          {initialData ? 'Modification de Demande' : 'Saisie Demande de Travaux'}
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-1">Capture des informations administratives, juridiques et techniques.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Client & Qualité</h3>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Importer un client</label>
            <select className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-3 text-sm font-bold border" onChange={handleSelectClient}>
              <option value="">-- Saisie Directe --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.category === ClientCategory.LEGAL ? `[E] ${c.businessName}` : `[I] ${c.name}`}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100 space-y-4">
            <div className="grid grid-cols-2 gap-2">
               <button type="button" onClick={() => setFormData({...formData, category: ClientCategory.PHYSICAL})} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${!isLegal ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}>Physique</button>
               <button type="button" onClick={() => setFormData({...formData, category: ClientCategory.LEGAL})} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${isLegal ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400'}`}>Morale</button>
            </div>

            {isLegal ? (
              <input required type="text" placeholder="Raison Sociale" className="w-full rounded-xl border-gray-200 p-3 text-sm font-black border bg-white" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
            ) : null}

            <div className="grid grid-cols-4 gap-2">
              {!isLegal && (
                <select className="col-span-1 rounded-xl border-gray-200 p-2.5 text-xs font-black border bg-white" value={formData.civility} onChange={e => setFormData({ ...formData, civility: e.target.value })}>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                </select>
              )}
              <input required type="text" placeholder={isLegal ? "Responsable" : "Nom & Prénom"} className={`${isLegal ? 'col-span-4' : 'col-span-3'} rounded-xl border-gray-200 p-2.5 text-sm font-black border bg-white`} value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} />
            </div>

            {!isLegal && (
              <div className="pt-2 border-t border-blue-100 space-y-2">
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">Pièce d'identité</p>
                <div className="grid grid-cols-2 gap-2">
                  <input required type="text" placeholder="N° Pièce" className="rounded-lg border-blue-100 p-2 text-[10px] font-black border bg-white" value={formData.idDocumentNumber} onChange={e => setFormData({ ...formData, idDocumentNumber: e.target.value })} />
                  <input required type="date" className="rounded-lg border-blue-100 p-2 text-[10px] font-black border bg-white" value={formData.idDocumentIssueDate} onChange={e => setFormData({ ...formData, idDocumentIssueDate: e.target.value })} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[9px] font-black text-emerald-600 uppercase mb-1 ml-1">Qualité de l'abonné</label>
              <select className="w-full rounded-xl border-emerald-200 p-2.5 text-xs font-black border bg-white" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                <option value="Propriétaire">Propriétaire</option>
                <option value="Locataire">Locataire</option>
                <option value="Mandataire">Mandataire</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-widest border-l-4 border-amber-600 pl-3">Lieu des Travaux</h3>
          
          <select className="w-full rounded-xl border-gray-200 p-3 text-sm font-black border bg-amber-50/20" value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })}>
            {workTypes.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>

          <div className="space-y-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            <input required type="text" placeholder="Adresse précise du site" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
            <input required type="text" placeholder="Commune du site" className="w-full rounded-xl border-gray-200 p-3 text-sm font-black border" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
          </div>

          <textarea required rows={3} className="w-full rounded-xl border-gray-200 p-3 text-sm font-medium border" placeholder="Détails techniques du projet..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </div>
      </div>

      <div className="mt-12 flex justify-end gap-4 pt-8 border-t border-gray-50">
        <button type="button" onClick={onCancel} className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Annuler</button>
        <button type="submit" className="px-12 py-4 text-[10px] font-black text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all uppercase tracking-widest">Valider la Demande</button>
      </div>
    </form>
  );
};
