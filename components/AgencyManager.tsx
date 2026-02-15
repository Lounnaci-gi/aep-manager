
import React, { useState } from 'react';
import { Centre, CommercialAgency } from '../types';
import Swal from 'sweetalert2';

interface AgencyManagerProps {
  agencies: CommercialAgency[];
  centres: Centre[];
  onSaveAgency: (agency: CommercialAgency) => void;
  onDeleteAgency: (id: string) => void;
}

export const AgencyManager: React.FC<AgencyManagerProps> = ({
  agencies,
  centres,
  onSaveAgency,
  onDeleteAgency
}) => {
  const [isAgencyFormOpen, setIsAgencyFormOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<CommercialAgency | null>(null);
  const [selectedCentreId, setSelectedCentreId] = useState<string>('');

  const [agencyFormData, setAgencyFormData] = useState<Omit<CommercialAgency, 'id' | 'centreId'>>({
    name: '', address: '', phone: '', secondaryPhone: '', fax: '', email: ''
  });

  const handleOpenAgencyForm = (centreId?: string, agency?: CommercialAgency) => {
    if (agency) {
      setEditingAgency(agency);
      setSelectedCentreId(agency.centreId);
      setAgencyFormData({ name: agency.name, address: agency.address, phone: agency.phone, secondaryPhone: agency.secondaryPhone || '', fax: agency.fax || '', email: agency.email });
    } else {
      setEditingAgency(null);
      setSelectedCentreId(centreId || (centres.length > 0 ? centres[0].id : ''));
      setAgencyFormData({ name: '', address: '', phone: '', secondaryPhone: '', fax: '', email: '' });
    }
    setIsAgencyFormOpen(true);
  };

  const handleSaveAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentreId) return;
    const isEdit = !!editingAgency;
    const result = await Swal.fire({
      title: isEdit ? 'Modifier l\'Agence' : 'Ajouter une Agence',
      text: isEdit ? 'Voulez-vous enregistrer les modifications?' : 'Voulez-vous ajouter cette nouvelle agence?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: isEdit ? 'Enregistrer' : 'Ajouter',
      cancelButtonText: 'Annuler'
    });
    if (result.isConfirmed) {
      onSaveAgency({ id: editingAgency?.id || `AGC-${Date.now().toString().slice(-4)}`, centreId: selectedCentreId, ...agencyFormData });
      setIsAgencyFormOpen(false);
      Swal.fire({
        title: 'Succès !',
        text: isEdit ? 'Agence modifiée avec succès' : 'Agence ajoutée avec succès',
        icon: 'success',
        confirmButtonColor: '#059669'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-12">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Agences Commerciales</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Gestion des Centres Techniques et Agences ADE.</p>
        </div>
        <button 
          onClick={() => handleOpenAgencyForm()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
        >
          + Nouvelle Agence
        </button>
      </div>

      {/* Tableau des Agences Commerciales */}
      {agencies.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
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
                    <tr key={agency.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{agency.name}</td>
                      <td className="p-4 font-black text-blue-600 uppercase">{centre?.name || '-'}</td>
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
                                confirmButtonColor: '#059669'
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

      {agencies.length === 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 font-black uppercase tracking-widest">Aucune agence commerciale trouvée</p>
          <p className="text-[10px] text-gray-400 mt-2">Cliquez sur "+ Nouvelle Agence" pour commencer</p>
        </div>
      )}

      {/* Form Modal */}
      {isAgencyFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-2xl p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{editingAgency ? 'Modifier l\'Agence' : 'Nouvelle Agence Commerciale'}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Remplissez les informations de l'agence</p>
              </div>
              <form onSubmit={handleSaveAgencySubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Centre *</label>
                  <select 
                    required
                    className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50"
                    value={selectedCentreId}
                    onChange={e => setSelectedCentreId(e.target.value)}
                  >
                    <option value="">Sélectionner un centre</option>
                    {centres.map(centre => (
                      <option key={centre.id} value={centre.id}>{centre.name} - {centre.prefix}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Nom de l'agence *</label>
                    <input required placeholder="Ex: Agence Alger Centre" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.name} onChange={e => setAgencyFormData({...agencyFormData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Téléphone *</label>
                    <input required placeholder="Ex: 021 XX XX XX XX" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.phone} onChange={e => setAgencyFormData({...agencyFormData, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Adresse *</label>
                  <input required placeholder="Adresse complète" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.address} onChange={e => setAgencyFormData({...agencyFormData, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Téléphone secondaire</label>
                    <input placeholder="Autre téléphone" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.secondaryPhone} onChange={e => setAgencyFormData({...agencyFormData, secondaryPhone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Fax</label>
                    <input placeholder="Fax" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.fax} onChange={e => setAgencyFormData({...agencyFormData, fax: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Email</label>
                  <input type="email" placeholder="agence@gestioneau.dz" className="w-full p-3.5 border border-gray-100 rounded-2xl font-bold text-xs bg-gray-50/50" value={agencyFormData.email} onChange={e => setAgencyFormData({...agencyFormData, email: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsAgencyFormOpen(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">Annuler</button>
                  <button type="submit" className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-all">{editingAgency ? 'Enregistrer' : 'Ajouter'}</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
