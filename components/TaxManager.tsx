import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { TaxRate, TaxType, UserRole } from '../types';
import { DbService } from '../services/dbService';

interface TaxManagerProps {
  onBack: () => void;
  currentUserRole: UserRole;
}

export const TaxManager: React.FC<TaxManagerProps> = ({ onBack, currentUserRole }) => {
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | undefined>(undefined);
  
  const [formData, setFormData] = useState({
    type: TaxType.PRESTATION,
    rate: 19,
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const isAdmin = currentUserRole === UserRole.ADMIN;

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setLoading(true);
    try {
      const data = await DbService.getTaxRates();
      setRates(data);
    } catch (error) {
      console.error('Erreur chargement taxes:', error);
      Swal.fire('Erreur', 'Impossible de charger les taux de TVA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const taxRate: TaxRate = {
        id: editingRate?.id || `TAX-${Date.now()}`,
        ...formData,
        createdAt: editingRate?.createdAt || new Date().toISOString()
      };

      await DbService.saveTaxRate(taxRate);
      await loadRates();
      
      Swal.fire({
        title: editingRate ? 'Taux mis à jour' : 'Taux ajouté',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Swal.fire('Erreur', 'Impossible de sauvegarder le taux de TVA', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    const result = await Swal.fire({
      title: 'Supprimer ce taux ?',
      text: 'Cette action peut affecter les futurs calculs.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await DbService.deleteTaxRate(id);
        await loadRates();
        Swal.fire('Supprimé !', 'Le taux a été supprimé', 'success');
      } catch (error) {
        console.error('Erreur suppression:', error);
        Swal.fire('Erreur', 'Impossible de supprimer le taux', 'error');
      }
    }
  };

  const resetForm = () => {
    setEditingRate(undefined);
    setFormData({
      type: TaxType.PRESTATION,
      rate: 19,
      effectiveDate: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5C2.3 17.333 3.262 19 4.803 19z" />
          </svg>
        </div>
        <h2 className="text-lg font-black text-gray-700 uppercase tracking-widest">Accès Réservé à l'Administrateur</h2>
        <button onClick={onBack} className="mt-2 px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Gestion de la Fiscalité
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            Configuration des taux de TVA et historique
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            Nouveau Taux
          </button>
          <button
            onClick={onBack}
            className="bg-white text-slate-500 border border-slate-200 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
          >
            Retour
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-8 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              {editingRate ? '✎' : '+'}
            </span>
            {editingRate ? 'Modifier le taux' : 'Ajouter un nouveau taux'}
          </h2>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Type de TVA</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as TaxType})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value={TaxType.PRESTATION}>TVA Prestation</option>
                <option value={TaxType.EAU}>TVA Eau</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value)})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Ex: 19"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'effet</label>
              <input
                type="date"
                required
                value={formData.effectiveDate}
                onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            
            <div className="md:col-span-3 flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
              >
                {editingRate ? 'Mettre à jour' : 'Enregistrer le taux'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tables grouped by type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[TaxType.PRESTATION, TaxType.EAU].map(type => {
          const typeRates = rates
            .filter(r => r.type === type)
            .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
          
          return (
            <div key={type} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${type === TaxType.EAU ? 'bg-cyan-500' : 'bg-indigo-500'}`}></span>
                  {type === TaxType.PRESTATION ? 'TVA Prestations' : 'TVA Eau'}
                </h3>
                <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                  {typeRates.length} ENREGISTREMENT(S)
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-50">
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Taux</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Depuis le</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {typeRates.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-xs font-bold text-slate-300 uppercase tracking-widest italic">
                          Aucun historique configuré
                        </td>
                      </tr>
                    ) : (
                      typeRates.map((rate, index) => (
                        <tr key={rate.id} className={`group hover:bg-slate-50 transition-colors ${index === 0 ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-black ${index === 0 ? 'text-blue-600' : 'text-slate-600'}`}>
                              {rate.rate}%
                              {index === 0 && <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-md">ACTUEL</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">
                            {new Date(rate.effectiveDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingRate(rate);
                                  setFormData({
                                    type: rate.type,
                                    rate: rate.rate,
                                    effectiveDate: rate.effectiveDate
                                  });
                                  setShowForm(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(rate.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
