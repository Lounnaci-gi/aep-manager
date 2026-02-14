
import React, { useState } from 'react';
import { Client, ClientCategory } from '../types';

interface ClientFormProps {
  onSave: (client: Client) => void;
  onCancel: () => void;
  initialData?: Client;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt'>>({
    category: initialData?.category || ClientCategory.PHYSICAL,
    civility: initialData?.civility || 'M.',
    name: initialData?.name || '',
    businessName: initialData?.businessName || '',
    idDocumentType: initialData?.idDocumentType || 'CNI',
    idDocumentNumber: initialData?.idDocumentNumber || '',
    idDocumentIssueDate: initialData?.idDocumentIssueDate || '',
    idDocumentIssuer: initialData?.idDocumentIssuer || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    commune: initialData?.commune || '',
    installationAddress: initialData?.installationAddress || '',
    installationCommune: initialData?.installationCommune || '',
    type: initialData?.type || 'Propriétaire',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      id: initialData?.id || `CLT-${Date.now().toString().slice(-6)}`,
      ...formData,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };
    onSave(client);
  };

  const isLegal = formData.category === ClientCategory.LEGAL;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-3xl mx-auto animate-in slide-in-from-bottom duration-300 mb-20">
      <div className="mb-8 border-b border-gray-50 pb-6">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
          {initialData ? 'Mise à jour Dossier Client' : 'Enregistrement Nouveau Dossier'}
        </h2>
        <p className="text-sm text-gray-500 font-medium">Base de données des abonnés AEP.</p>
      </div>

      <div className="space-y-8">
        {/* Catégorie */}
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Catégorie Juridique</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, category: ClientCategory.PHYSICAL })}
              className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${!isLegal ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300'}`}
            >
              Individu (Physique)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, category: ClientCategory.LEGAL })}
              className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${isLegal ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-300'}`}
            >
              Entreprise / Chantier
            </button>
          </div>
        </div>

        {/* Section 1: Identification */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">1</span>
            Identité & Qualité
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {!isLegal ? (
              <>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Civilité</label>
                  <select required className="w-full rounded-2xl border-gray-200 p-3.5 text-sm font-black bg-gray-50/50 border shadow-sm" value={formData.civility} onChange={e => setFormData({ ...formData, civility: e.target.value })}>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                    <option value="Mlle">Mlle</option>
                  </select>
                </div>
                <div className="md:col-span-9">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nom et Prénom</label>
                  <input required type="text" className="w-full rounded-2xl border-gray-200 p-3.5 text-sm font-black bg-gray-50/50 border shadow-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div className="md:col-span-12">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Raison Sociale</label>
                  <input required type="text" className="w-full rounded-2xl border-indigo-200 p-3.5 text-sm font-black bg-indigo-50/30 border shadow-sm" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
                </div>
                <div className="md:col-span-12">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nom du Responsable</label>
                  <input type="text" className="w-full rounded-2xl border-gray-200 p-3.5 text-sm font-black bg-gray-50/50 border shadow-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
              </>
            )}

            <div className="md:col-span-6">
              <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1">Qualité</label>
              <select className="w-full rounded-2xl border-emerald-200 p-3.5 text-sm font-black bg-emerald-50/20 border shadow-sm" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                <option value="Propriétaire">Propriétaire</option>
                <option value="Locataire">Locataire</option>
                <option value="Mandataire">Mandataire</option>
              </select>
            </div>
            <div className="md:col-span-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Téléphone</label>
              <input required type="tel" className="w-full rounded-2xl border-gray-200 p-3.5 text-sm font-black bg-gray-50/50 border shadow-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Section 2: Pièce d'Identité (Uniquement pour PHYSIQUE) */}
        {!isLegal && (
          <div className="space-y-4 bg-slate-900 p-6 rounded-3xl shadow-xl">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0a2 2 0 012 2v1m-4 0a2 2 0 012 2v1" /></svg>
              Pièce d'Identité Officielle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Type de document</label>
                <select required className="w-full rounded-xl border-white/10 p-3 text-sm font-black bg-white/10 text-white border" value={formData.idDocumentType} onChange={e => setFormData({ ...formData, idDocumentType: e.target.value })}>
                  <option className="text-gray-900" value="CNI">Carte d'Identité Nationale (CNI)</option>
                  <option className="text-gray-900" value="Permis de conduire">Permis de conduire</option>
                  <option className="text-gray-900" value="Passeport">Passeport</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Numéro de la pièce</label>
                <input required type="text" className="w-full rounded-xl border-white/10 p-3 text-sm font-black bg-white/10 text-white border" value={formData.idDocumentNumber} onChange={e => setFormData({ ...formData, idDocumentNumber: e.target.value })} placeholder="Ex: 00123456..." />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Date de délivrance</label>
                <input required type="date" className="w-full rounded-xl border-white/10 p-3 text-sm font-black bg-white/10 text-white border" value={formData.idDocumentIssueDate} onChange={e => setFormData({ ...formData, idDocumentIssueDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Organisme de délivrance</label>
                <input required type="text" className="w-full rounded-xl border-white/10 p-3 text-sm font-black bg-white/10 text-white border" value={formData.idDocumentIssuer} onChange={e => setFormData({ ...formData, idDocumentIssuer: e.target.value })} placeholder="Wilaya / Daïra..." />
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Adresses */}
        <div className="space-y-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-inner">
          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center border border-gray-100">2</span>
            Coordonnées & Branchement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Adresse de Correspondance</label>
              <input required type="text" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold bg-white border" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Commune</label>
              <input required type="text" className="w-full rounded-xl border-gray-200 p-3 text-sm font-black bg-white border" value={formData.commune} onChange={e => setFormData({ ...formData, commune: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1.5 ml-1">Site du futur Branchement</label>
              <input required type="text" className="w-full rounded-xl border-blue-100 p-3 text-sm font-black bg-white border" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1.5 ml-1">Commune Site</label>
              <input required type="text" className="w-full rounded-xl border-blue-100 p-3 text-sm font-black bg-white border" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Adresse Email</label>
              <input required type="email" className="w-full rounded-xl border-gray-200 p-3 text-sm font-medium bg-gray-50/50 border" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contact@email.com" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-end gap-4 pt-6 border-t border-gray-50">
        <button type="button" onClick={onCancel} className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
          Annuler
        </button>
        <button type="submit" className="px-10 py-4 text-[10px] font-black text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest active:scale-95">
          {initialData ? 'Mettre à jour' : 'Enregistrer le dossier'}
        </button>
      </div>
    </form>
  );
};
