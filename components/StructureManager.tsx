
import React, { useState } from 'react';
import { Centre, CommercialAgency } from '../types';
import Swal from 'sweetalert2';

interface StructureManagerProps {
  centres: Centre[];
  agencies: CommercialAgency[];
  onSaveCentre: (centre: Centre) => void;
  onDeleteCentre: (id: string) => void;
  onSaveAgency: (agency: CommercialAgency) => void;
  onDeleteAgency: (id: string) => void;
}

export const StructureManager: React.FC<StructureManagerProps> = ({
  centres,
  agencies,
  onSaveCentre,
  onDeleteCentre,
  onSaveAgency,
  onDeleteAgency
}) => {
  const [isCentreFormOpen, setIsCentreFormOpen] = useState(false);
  const [isAgencyFormOpen, setIsAgencyFormOpen] = useState(false);
  const [editingCentre, setEditingCentre] = useState<Centre | null>(null);
  const [editingAgency, setEditingAgency] = useState<CommercialAgency | null>(null);
  const [activeCentreIdForNewAgency, setActiveCentreIdForNewAgency] = useState<string | null>(null);

  const [centreFormData, setCentreFormData] = useState<Omit<Centre, 'id'>>({
    name: '', prefix: '', address: '', commune: '', postalCode: '', phone: '', secondaryPhone: '', fax: '', email: '', bankName: '', bankAccount: '', comptePostale: '',
    createdAt: new Date().toISOString().split('T')[0]
  });

  const [agencyFormData, setAgencyFormData] = useState<Omit<CommercialAgency, 'id' | 'centreId'>>({
    name: '', address: '', phone: '', secondaryPhone: '', fax: '', email: ''
  });

  const handleOpenCentreForm = (centre?: Centre) => {
    if (centre) {
      setEditingCentre(centre);
      setCentreFormData({ ...centre, createdAt: centre.createdAt.includes('T') ? centre.createdAt.split('T')[0] : centre.createdAt });
    } else {
      setEditingCentre(null);
      setCentreFormData({ name: '', prefix: '', address: '', commune: '', postalCode: '', phone: '', secondaryPhone: '', fax: '', email: '', bankName: '', bankAccount: '', comptePostale: '', createdAt: new Date().toISOString().split('T')[0] });
    }
    setIsCentreFormOpen(true);
  };

  const handleOpenAgencyForm = (centreId?: string, agency?: CommercialAgency) => {
    if (centreId) {
      setActiveCentreIdForNewAgency(centreId);
    } else if (centres.length > 0) {
      setActiveCentreIdForNewAgency(centres[0].id);
    }
    if (agency) {
      setEditingAgency(agency);
      setAgencyFormData({ name: agency.name, address: agency.address, phone: agency.phone, secondaryPhone: agency.secondaryPhone || '', fax: agency.fax || '', email: agency.email });
    } else {
      setEditingAgency(null);
      setAgencyFormData({ name: '', address: '', phone: '', secondaryPhone: '', fax: '', email: '' });
    }
    setIsAgencyFormOpen(true);
  };

  const handleSaveCentreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingCentre;
    const result = await Swal.fire({
      title: isEdit ? 'Modifier le Centre' : 'Ajouter un Centre',
      text: isEdit ? 'Voulez-vous enregistrer les modifications?' : 'Voulez-vous ajouter ce nouveau centre?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: isEdit ? 'Enregistrer' : 'Ajouter',
      cancelButtonText: 'Annuler'
    });
    if (result.isConfirmed) {
      onSaveCentre({ id: editingCentre?.id || `CTR-${Date.now().toString().slice(-4)}`, ...centreFormData });
      setIsCentreFormOpen(false);
      Swal.fire({
        title: 'Succès !',
        text: isEdit ? 'Centre modifié avec succès' : 'Centre ajouté avec succès',
        icon: 'success',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  const handleSaveAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCentreIdForNewAgency) return;
    const isEdit = !!editingAgency;
    const result = await Swal.fire({
      title: isEdit ? 'Modifier l\'Agence' : 'Ajouter une Agence',
      text: isEdit ? 'Voulez-vous enregistrer les modifications?' : 'Voulez-vous ajouter cette nouvelle agence?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: isEdit ? 'Enregistrer' : 'Ajouter',
      cancelButtonText: 'Annuler'
    });
    if (result.isConfirmed) {
      onSaveAgency({ id: editingAgency?.id || `AGC-${Date.now().toString().slice(-4)}`, centreId: activeCentreIdForNewAgency, ...agencyFormData });
      setIsAgencyFormOpen(false);
      Swal.fire({
        title: 'Succès !',
        text: isEdit ? 'Agence modifiée avec succès' : 'Agence ajoutée avec succès',
        icon: 'success',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-12">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Structure Territoriale</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Gestion des Centres Techniques et Agences ADE.</p>
        </div>
        <button 
          onClick={() => handleOpenCentreForm()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
        >
          + Nouveau Centre
        </button>
      </div>

      {/* Tableau des Centres */}
      {centres.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Liste des Centres ({centres.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Centre</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Préfixe</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Commune</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Téléphone</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Email</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Banque</th>
                  <th className="text-center p-4 font-black text-gray-500 uppercase tracking-widest">Agences</th>
                  <th className="text-center p-4 font-black text-gray-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {centres.map((centre) => (
                  <tr key={centre.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{centre.name}</td>
                    <td className="p-4 font-black text-blue-600 uppercase">{centre.prefix}</td>
                    <td className="p-4 font-bold text-gray-600">{centre.commune}</td>
                    <td className="p-4 font-mono text-gray-600">{centre.phone}</td>
                    <td className="p-4 font-bold text-gray-600">{centre.email}</td>
                    <td className="p-4 font-bold text-gray-600">{centre.bankName}</td>
                    <td className="p-4 text-center">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-black text-[10px]">
                        {agencies.filter(a => a.centreId === centre.id).length}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenCentreForm(centre)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={async () => {
                                                  const result = await Swal.fire({
                                                    title: 'Supprimer le Centre',
                                                    text: 'Êtes-vous sûr de vouloir supprimer ce centre? Cette action est irréversible.',
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#dc2626',
                                                    cancelButtonColor: '#64748b',
                                                    confirmButtonText: 'Supprimer',
                                                    cancelButtonText: 'Annuler'
                                                  });
                                                  if (result.isConfirmed) {
                                                    onDeleteCentre(centre.id);
                                                    Swal.fire({
                                                      title: 'Supprimé !',
                                                      text: 'Le centre a été supprimé avec succès',
                                                      icon: 'success',
                                                      confirmButtonColor: '#2563eb'
                                                    });
                                                  }
                                                }} className="p-2 text-gray-300 hover:text-rose-600 rounded-lg transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau des Agences Commerciales */}
      {agencies.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-emerald-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Liste des Agences Commerciales ({agencies.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Agence</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Centre</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Adresse</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Téléphone</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Email</th>
                  <th className="text-center p-4 font-black text-gray-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agencies.map((agency) => {
                  const centre = centres.find(c => c.id === agency.centreId);
                  return (
                    <tr key={agency.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{agency.name}</td>
                      <td className="p-4 font-black text-emerald-600 uppercase">{centre?.name || '-'}</td>
                      <td className="p-4 font-bold text-gray-600">{agency.address}</td>
                      <td className="p-4 font-mono text-gray-600">{agency.phone}</td>
                      <td className="p-4 font-bold text-gray-600">{agency.email}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenAgencyForm(agency.centreId, agency)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Supprimer l\'Agence',
                              text: 'Êtes-vous sûr de vouloir supprimer cette agence?',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#dc2626',
                              cancelButtonColor: '#64748b',
                              confirmButtonText: 'Supprimer',
                              cancelButtonText: 'Annuler'
                            });
                            if (result.isConfirmed) {
                              onDeleteAgency(agency.id);
                              Swal.fire({
                                title: 'Supprimé !',
                                text: 'L\'agence a été supprimée avec succès',
                                icon: 'success',
                                confirmButtonColor: '#2563eb'
                              });
                            }
                          }} className="p-2 text-gray-300 hover:text-rose-600 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forms Modals */}
      {isCentreFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-2xl p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Configuration Centre ADE</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Remplissez les informations du centre</p>
              </div>
              <form onSubmit={handleSaveCentreSubmit} className="space-y-4">
                {/* Nom et Préfixe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Nom du centre *</label>
                    <input required placeholder="Ex: Centre de Alger" className="w-full p-3.5 border border-gray-100 rounded-2xl font-black text-xs bg-gray-50/50" value={centreFormData.name} onChange={e => setCentreFormData({...centreFormData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Préfixe *</label>
                    <input required placeholder="Ex: ALG" maxLength={3} className="w-full p-3.5 border border-gray-100 rounded-2xl font-black uppercase text-xs bg-gray-50/50" value={centreFormData.prefix} onChange={e => setCentreFormData({...centreFormData, prefix: e.target.value.toUpperCase()})} />
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Adresse *</label>
                  <input required placeholder="Adresse complète" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={centreFormData.address} onChange={e => setCentreFormData({...centreFormData, address: e.target.value})} />
                </div>

                {/* Commune et Code Postal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Commune *</label>
                    <input required placeholder="Ex: Alger Centre" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={centreFormData.commune} onChange={e => setCentreFormData({...centreFormData, commune: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Code Postal</label>
                    <input placeholder="Ex: 16000" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={centreFormData.postalCode} onChange={e => setCentreFormData({...centreFormData, postalCode: e.target.value})} />
                  </div>
                </div>

                {/* Téléphone et Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Téléphone *</label>
                    <input required placeholder="Ex: 021 XX XX XX XX" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={centreFormData.phone} onChange={e => setCentreFormData({...centreFormData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Email</label>
                    <input type="email" placeholder="centre@gestioneau.dz" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={centreFormData.email} onChange={e => setCentreFormData({...centreFormData, email: e.target.value})} />
                  </div>
                </div>

                {/* Téléphone Secondaire et Fax */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Téléphone Secondaire</label>
                    <input placeholder="Second téléphone" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={centreFormData.secondaryPhone} onChange={e => setCentreFormData({...centreFormData, secondaryPhone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Fax</label>
                    <input placeholder="Ex: 021 XX XX XX XX" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={centreFormData.fax} onChange={e => setCentreFormData({...centreFormData, fax: e.target.value})} />
                  </div>
                </div>

                {/* Informations Bancaires */}
                <div className="bg-blue-50 p-4 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Informations Bancaires</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Banque *</label>
                      <input required placeholder="Ex: BNA, CPA, Société Générale" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-white" value={centreFormData.bankName} onChange={e => setCentreFormData({...centreFormData, bankName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Compte Bancaire *</label>
                      <input required placeholder="Numéro de compte" className="w-full p-3.5 border border-gray-100 rounded-2xl font-mono text-xs bg-white" value={centreFormData.bankAccount} onChange={e => setCentreFormData({...centreFormData, bankAccount: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Compte Postale</label>
                    <input placeholder="Numéro de compte postale (CCP)" className="w-full p-3.5 border border-gray-100 rounded-2xl font-mono text-xs bg-white" value={centreFormData.comptePostale} onChange={e => setCentreFormData({...centreFormData, comptePostale: e.target.value})} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setIsCentreFormOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600">Annuler</button>
                  <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Enregistrer</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Formulaire Agence Commerciale */}
      {isAgencyFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-xl p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300">
              <div className="mb-6">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Agence Commerciale</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Remplissez les informations de l'agence</p>
              </div>
              <form onSubmit={handleSaveAgencySubmit} className="space-y-4">
                {/* Nom */}
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Nom de l'agence *</label>
                  <input required placeholder="Ex: Agence Bab El Oued" className="w-full p-3.5 border border-gray-100 rounded-2xl font-black text-xs bg-gray-50/50" value={agencyFormData.name} onChange={e => setAgencyFormData({...agencyFormData, name: e.target.value})} />
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Adresse *</label>
                  <input required placeholder="Adresse complète" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.address} onChange={e => setAgencyFormData({...agencyFormData, address: e.target.value})} />
                </div>

                {/* Téléphone et Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Téléphone *</label>
                    <input required placeholder="Ex: 021 XX XX XX XX" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.phone} onChange={e => setAgencyFormData({...agencyFormData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Email</label>
                    <input required type="email" placeholder="agence@gestioneau.dz" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.email} onChange={e => setAgencyFormData({...agencyFormData, email: e.target.value})} />
                  </div>
                </div>

                {/* Téléphone Secondaire et Fax */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Téléphone Secondaire</label>
                    <input placeholder="Second téléphone" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.secondaryPhone} onChange={e => setAgencyFormData({...agencyFormData, secondaryPhone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Fax</label>
                    <input placeholder="Ex: 021 XX XX XX XX" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.fax} onChange={e => setAgencyFormData({...agencyFormData, fax: e.target.value})} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setIsAgencyFormOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600">Annuler</button>
                  <button type="submit" className="px-10 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700 transition-all shadow-lg shadow-green-100">Enregistrer</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
