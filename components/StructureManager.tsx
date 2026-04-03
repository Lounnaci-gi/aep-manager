
import React, { useState } from 'react';
import { Centre, CommercialAgency, Unit } from '../types';
import Swal from 'sweetalert2';

interface StructureManagerProps {
  units: Unit[];
  centres: Centre[];
  agencies: CommercialAgency[];
  onSaveUnit: (unit: Unit) => void;
  onDeleteUnit: (id: string) => void;
  onSaveCentre: (centre: Centre) => void;
  onDeleteCentre: (id: string) => void;
  onSaveAgency: (agency: CommercialAgency) => void;
  onDeleteAgency: (id: string) => void;
}

export const StructureManager: React.FC<StructureManagerProps> = ({
  units,
  centres,
  agencies,
  onSaveUnit,
  onDeleteUnit,
  onSaveCentre,
  onDeleteCentre,
  onSaveAgency,
  onDeleteAgency
}) => {
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [isCentreFormOpen, setIsCentreFormOpen] = useState(false);
  const [isAgencyFormOpen, setIsAgencyFormOpen] = useState(false);
  
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingCentre, setEditingCentre] = useState<Centre | null>(null);
  const [editingAgency, setEditingAgency] = useState<CommercialAgency | null>(null);
  
  const [activeCentreIdForNewAgency, setActiveCentreIdForNewAgency] = useState<string | null>(null);

  const [unitFormData, setUnitFormData] = useState<Omit<Unit, 'id'>>({
    name: '',
    address: '',
    commune: '',
    phone: '',
    secondaryPhone: '',
    fax: '',
    email: '',
    nif: '',
    nis: '',
    rc: '',
    ai: '',
    bankName: '',
    bankAccount: '',
    comptePostale: '',
    createdAt: new Date().toISOString().split('T')[0]
  });

  const [centreFormData, setCentreFormData] = useState<Omit<Centre, 'id'>>({
    unitId: '', 
    name: '', prefix: '', address: '', commune: '', postalCode: '', phone: '', secondaryPhone: '', fax: '', email: '', bankName: '', bankAccount: '', comptePostale: '',
    createdAt: new Date().toISOString().split('T')[0]
  });

  const [agencyFormData, setAgencyFormData] = useState<Omit<CommercialAgency, 'id' | 'centreId'>>({
    name: '', address: '', phone: '', secondaryPhone: '', fax: '', email: ''
  });

  const handleOpenUnitForm = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitFormData({ 
        name: unit.name, 
        address: unit.address || '',
        commune: unit.commune || '',
        phone: unit.phone || '',
        secondaryPhone: unit.secondaryPhone || '',
        fax: unit.fax || '',
        email: unit.email || '',
        nif: unit.nif || '',
        nis: unit.nis || '',
        rc: unit.rc || '',
        ai: unit.ai || '',
        bankName: unit.bankName || '',
        bankAccount: unit.bankAccount || '',
        comptePostale: unit.comptePostale || '',
        createdAt: unit.createdAt.split('T')[0] 
      });
    } else {
      setEditingUnit(null);
      setUnitFormData({ 
        name: '', 
        address: '', 
        commune: '', 
        phone: '', 
        secondaryPhone: '', 
        fax: '', 
        email: '', 
        nif: '', 
        nis: '', 
        rc: '', 
        ai: '', 
        bankName: '',
        bankAccount: '',
        comptePostale: '',
        createdAt: new Date().toISOString().split('T')[0] 
      });
    }
    setShowUnitForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCentreForm = (centre?: Centre) => {
    if (centre) {
      setEditingCentre(centre);
      setCentreFormData({ ...centre, createdAt: centre.createdAt.includes('T') ? centre.createdAt.split('T')[0] : centre.createdAt });
    } else {
      setEditingCentre(null);
      setCentreFormData({ 
        unitId: units.length > 0 ? units[0].id : '',
        name: '', prefix: '', address: '', commune: '', postalCode: '', phone: '', secondaryPhone: '', fax: '', email: '', bankName: '', bankAccount: '', comptePostale: '', 
        createdAt: new Date().toISOString().split('T')[0] 
      });
    }
    setIsCentreFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleSaveUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingUnit;
    const result = await Swal.fire({
      title: isEdit ? 'Modifier l\'Unité' : 'Ajouter une Unité',
      text: isEdit ? 'Voulez-vous enregistrer les modifications?' : 'Voulez-vous ajouter cette nouvelle unité?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: isEdit ? 'Enregistrer' : 'Ajouter',
      cancelButtonText: 'Annuler'
    });
    if (result.isConfirmed) {
      onSaveUnit({ id: editingUnit?.id || `UNT-${Date.now().toString().slice(-4)}`, ...unitFormData });
      setShowUnitForm(false);
    }
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
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Gestion des Unités, Centres et Agences.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleOpenUnitForm()}
            className={`${showUnitForm ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black'} px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-100`}
            disabled={showUnitForm}
          >
            {showUnitForm ? 'Formulaire Ouvert' : '+ Nouvelle Unité'}
          </button>
          <button 
            onClick={() => handleOpenCentreForm()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
          >
            + Nouveau Centre
          </button>
        </div>
      </div>

      {/* Formulaire Unité (Inline) */}
      {showUnitForm && (
        <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-2xl p-8 mb-12 animate-in slide-in-from-top duration-500">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                {editingUnit ? 'Modifier l\'Unité' : 'Nouvelle Unité Territoriale'}
              </h3>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">Configuration administrative et fiscale du siège social</p>
            </div>
            <button 
              onClick={() => setShowUnitForm(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSaveUnitSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Désignation (30 Car. Max) *</label>
                <input required placeholder="Ex: Unité de Médéa" maxLength={30} className="w-full p-4 border border-gray-100 rounded-2xl font-black text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={unitFormData.name} onChange={e => setUnitFormData({...unitFormData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commune (30 Car. Max) *</label>
                <input required placeholder="Ex: Médéa" maxLength={30} className="w-full p-4 border border-gray-100 rounded-2xl font-bold text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={unitFormData.commune} onChange={e => setUnitFormData({...unitFormData, commune: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse complète *</label>
              <input required placeholder="Adresse du siège" maxLength={100} className="w-full p-4 border border-gray-100 rounded-2xl font-bold text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={unitFormData.address} onChange={e => setUnitFormData({...unitFormData, address: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tél. (10 Ch.) *</label>
                <input required placeholder="021XXXXXXX" maxLength={10} type="tel" className="w-full p-4 border border-gray-100 rounded-2xl font-mono text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={unitFormData.phone} onChange={e => setUnitFormData({...unitFormData, phone: e.target.value.replace(/\D/g, '')})} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tél. Mobile (10 Ch.)</label>
                <input placeholder="0XXXXXXXXX" maxLength={10} type="tel" className="w-full p-4 border border-gray-100 rounded-2xl font-mono text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={unitFormData.secondaryPhone} onChange={e => setUnitFormData({...unitFormData, secondaryPhone: e.target.value.replace(/\D/g, '')})} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fax (10 Ch.)</label>
                <input placeholder="021XXXXXXX" maxLength={10} type="tel" className="w-full p-4 border border-gray-100 rounded-2xl font-mono text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={unitFormData.fax} onChange={e => setUnitFormData({...unitFormData, fax: e.target.value.replace(/\D/g, '')})} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (50 Car. Max)</label>
                <input type="email" placeholder="Email" maxLength={50} className="w-full p-4 border border-gray-100 rounded-2xl font-bold text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={unitFormData.email} onChange={e => setUnitFormData({...unitFormData, email: e.target.value})} />
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-gray-200 pb-4 mb-4">Informations Fiscales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">NIF (20 chiffres max) *</label>
                  <input required placeholder="Identifiant Fiscal" maxLength={20} className="w-full p-4 border border-gray-200 rounded-2xl font-mono text-sm bg-white focus:ring-4 focus:ring-slate-200" value={unitFormData.nif} onChange={e => setUnitFormData({...unitFormData, nif: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">NIS (15 chiffres max) *</label>
                  <input required placeholder="Numéro Statistique" maxLength={15} className="w-full p-4 border border-gray-200 rounded-2xl font-mono text-sm bg-white focus:ring-4 focus:ring-slate-200" value={unitFormData.nis} onChange={e => setUnitFormData({...unitFormData, nis: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">RC (N° Registre Commerce - 15 Ch.) *</label>
                  <input required placeholder="Ex: 16/B-0012345B20" maxLength={15} className="w-full p-4 border border-gray-200 rounded-2xl font-mono text-sm bg-white focus:ring-4 focus:ring-slate-200" value={unitFormData.rc} onChange={e => setUnitFormData({...unitFormData, rc: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">AI (Article d'Imposition - 11 Ch.) *</label>
                  <input required placeholder="Article Imposition" maxLength={11} className="w-full p-4 border border-gray-200 rounded-2xl font-mono text-sm bg-white focus:ring-4 focus:ring-slate-200" value={unitFormData.ai} onChange={e => setUnitFormData({...unitFormData, ai: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
            </div>

            {/* Informations Bancaires & Postales */}
            <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-50 space-y-6">
              <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest text-center border-b border-blue-100 pb-4 mb-4">Informations Bancaires & Postales</h4>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-blue-500/60 uppercase tracking-widest ml-1">Nom de la Banque *</label>
                  <input required placeholder="Ex: BNA Agency 717 Médéa" maxLength={50} className="w-full p-4 border border-blue-100 rounded-2xl font-bold text-sm bg-white focus:ring-4 focus:ring-blue-100" value={unitFormData.bankName} onChange={e => setUnitFormData({...unitFormData, bankName: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-blue-500/60 uppercase tracking-widest ml-1">N° Compte Bancaire (RIB) *</label>
                  <input required placeholder="RIB Bancaire" maxLength={30} className="w-full p-4 border border-blue-100 rounded-2xl font-mono text-sm bg-white focus:ring-4 focus:ring-blue-100" value={unitFormData.bankAccount} onChange={e => setUnitFormData({...unitFormData, bankAccount: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-blue-500/60 uppercase tracking-widest ml-1">N° Compte Postale (CCP) *</label>
                  <input required placeholder="Numéro CCP" maxLength={20} className="w-full p-4 border border-blue-100 rounded-2xl font-mono text-sm bg-white focus:ring-4 focus:ring-blue-100" value={unitFormData.comptePostale} onChange={e => setUnitFormData({...unitFormData, comptePostale: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button type="button" onClick={() => setShowUnitForm(false)} className="px-8 py-4 text-[11px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors">Annuler</button>
              <button type="submit" className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase hover:bg-black transition-all shadow-xl shadow-slate-200">
                {editingUnit ? 'Mettre à jour' : 'Enregistrer l\'Unité'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulaire Centre (Inline) */}
      {isCentreFormOpen && (
        <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-2xl p-8 mb-12 animate-in slide-in-from-top duration-500">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                {editingCentre ? 'Modifier le Centre' : 'Nouveau Centre de Gestion'}
              </h3>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">Configuration opérationnelle du centre de rattachement</p>
            </div>
            <button 
              onClick={() => setIsCentreFormOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSaveCentreSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unité de rattachement *</label>
                <select required className="w-full p-4 border border-gray-100 rounded-2xl font-black text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={centreFormData.unitId} onChange={e => setCentreFormData({...centreFormData, unitId: e.target.value})}>
                  <option value="">Sélectionnez une unité</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Désignation Centre *</label>
                   <input required placeholder="Nom du centre" className="w-full p-4 border border-gray-100 rounded-2xl font-black text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={centreFormData.name} onChange={e => setCentreFormData({...centreFormData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Préfixe (3 Car.) *</label>
                   <input required placeholder="Ex: ALG" maxLength={3} className="w-full p-4 border border-gray-100 rounded-2xl font-black uppercase text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 text-center" value={centreFormData.prefix} onChange={e => setCentreFormData({...centreFormData, prefix: e.target.value.toUpperCase()})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse complète *</label>
                <input required placeholder="Adresse du centre" className="w-full p-4 border border-gray-100 rounded-2xl font-bold text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={centreFormData.address} onChange={e => setCentreFormData({...centreFormData, address: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commune *</label>
                <input required placeholder="Ville" className="w-full p-4 border border-gray-100 rounded-2xl font-bold text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={centreFormData.commune} onChange={e => setCentreFormData({...centreFormData, commune: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tél. *</label>
                <input required placeholder="Téléphone" className="w-full p-4 border border-gray-100 rounded-2xl font-mono text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={centreFormData.phone} onChange={e => setCentreFormData({...centreFormData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <input placeholder="Email" className="w-full p-4 border border-gray-100 rounded-2xl font-bold text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={centreFormData.email} onChange={e => setCentreFormData({...centreFormData, email: e.target.value})} />
              </div>
               <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Code Postal</label>
                <input placeholder="Ex: 26000" className="w-full p-4 border border-gray-100 rounded-2xl font-mono text-sm bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50" value={centreFormData.postalCode} onChange={e => setCentreFormData({...centreFormData, postalCode: e.target.value})} />
              </div>
            </div>

            {/* Informations Bancaires */}
            <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-50 space-y-6">
              <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest text-center border-b border-blue-100 pb-4 mb-4">Informations Bancaires</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-blue-500/60 uppercase tracking-widest ml-1">Banque *</label>
                  <input required placeholder="Banque" className="w-full p-4 border border-blue-100 rounded-2xl font-bold text-sm bg-white focus:ring-4 focus:ring-blue-100" value={centreFormData.bankName} onChange={e => setCentreFormData({...centreFormData, bankName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-blue-500/60 uppercase tracking-widest ml-1">N° Compte Bancaire *</label>
                  <input required placeholder="RIB Bancaire" className="w-full p-4 border border-blue-100 rounded-2xl font-mono text-sm bg-white focus:ring-4 focus:ring-blue-100" value={centreFormData.bankAccount} onChange={e => setCentreFormData({...centreFormData, bankAccount: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button type="button" onClick={() => setIsCentreFormOpen(false)} className="px-8 py-4 text-[11px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors">Annuler</button>
              <button type="submit" className="px-12 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl shadow-blue-100">
                {editingCentre ? 'Mettre à jour' : 'Enregistrer le Centre'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des Unités */}
      {units.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Unités Territoriales ({units.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Unité</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Coordonnées</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Fiscal (NIF/RC)</th>
                  <th className="text-center p-4 font-black text-gray-500 uppercase tracking-widest">Centres</th>
                  <th className="text-center p-4 font-black text-gray-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-black text-gray-900 uppercase tracking-tight">{unit.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold">{unit.commune}</div>
                    </td>
                    <td className="p-4 text-[11px] text-gray-600">
                      <div className="font-bold">{unit.phone}</div>
                      <div>{unit.email}</div>
                    </td>
                    <td className="p-4 text-[11px] text-gray-600">
                      <div className="mb-1"><span className="font-black text-[9px] text-slate-400 uppercase">NIF:</span> <span className="font-mono">{unit.nif}</span></div>
                      <div><span className="font-black text-[9px] text-slate-400 uppercase">RC:</span> <span className="font-mono">{unit.rc}</span></div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-black text-[10px]">
                        {centres.filter(c => c.unitId === unit.id).length}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenUnitForm(unit)} className="p-2 text-gray-400 hover:text-blue-600 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={async () => {
                          const result = await Swal.fire({
                            title: 'Supprimer l\'Unité',
                            text: 'Êtes-vous sûr de vouloir supprimer cette unité?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#dc2626',
                            cancelButtonColor: '#64748b',
                            confirmButtonText: 'Supprimer',
                            cancelButtonText: 'Annuler'
                          });
                          if (result.isConfirmed) onDeleteUnit(unit.id);
                        }} className="p-2 text-gray-300 hover:text-rose-600 transition-all">
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

      {/* Liste des Centres */}
      {centres.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Centres de Gestion ({centres.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Unité</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Centre</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Préfixe</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Ville</th>
                  <th className="text-left p-4 font-black text-gray-500 uppercase tracking-widest">Coordonnées</th>
                  <th className="text-center p-4 font-black text-gray-500 uppercase tracking-widest">Agences</th>
                  <th className="text-center p-4 font-black text-gray-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {centres.map((centre) => (
                  <tr key={centre.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="p-4">
                      <span className="font-black text-slate-400 uppercase text-[9px] tracking-widest">
                        {units.find(u => u.id === centre.unitId)?.name || 'Non assignée'}
                      </span>
                    </td>
                    <td className="p-4 font-black text-gray-900 uppercase">{centre.name}</td>
                    <td className="p-4 font-black text-blue-600 uppercase">{centre.prefix}</td>
                    <td className="p-4 font-bold text-gray-600">{centre.commune}</td>
                    <td className="p-4">
                      <div className="font-bold text-gray-600">{centre.phone}</div>
                      <div className="text-gray-400 text-[10px]">{centre.email}</div>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleOpenAgencyForm(centre.id)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black text-[10px] hover:bg-blue-100 transition-all">
                        {agencies.filter(a => a.centreId === centre.id).length} Agences
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenCentreForm(centre)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={async () => {
                          const result = await Swal.fire({
                            title: 'Supprimer le Centre',
                            text: 'Cette action est irréversible.',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#dc2626',
                            cancelButtonColor: '#64748b',
                            confirmButtonText: 'Supprimer',
                            cancelButtonText: 'Annuler'
                          });
                          if (result.isConfirmed) onDeleteCentre(centre.id);
                        }} className="p-2 text-gray-300 hover:text-rose-600 transition-all">
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

      {/* Modal Agence */}
      {isAgencyFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6">Agence Commerciale</h3>
            <form onSubmit={handleSaveAgencySubmit} className="space-y-4">
              <input required placeholder="Nom de l'agence" className="w-full p-4 border border-gray-100 rounded-2xl font-bold bg-gray-50/50" value={agencyFormData.name} onChange={e => setAgencyFormData({...agencyFormData, name: e.target.value})} />
              <input required placeholder="Adresse" className="w-full p-4 border border-gray-100 rounded-2xl font-bold bg-gray-50/50" value={agencyFormData.address} onChange={e => setAgencyFormData({...agencyFormData, address: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Téléphone" className="w-full p-4 border border-gray-100 rounded-2xl font-bold bg-gray-50/50" value={agencyFormData.phone} onChange={e => setAgencyFormData({...agencyFormData, phone: e.target.value})} />
                <input required placeholder="Email" className="w-full p-4 border border-gray-100 rounded-2xl font-bold bg-gray-50/50" value={agencyFormData.email} onChange={e => setAgencyFormData({...agencyFormData, email: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsAgencyFormOpen(false)} className="px-6 py-4 text-[11px] font-black uppercase text-gray-400">Annuler</button>
                <button type="submit" className="px-10 py-4 bg-green-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl shadow-green-100">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
