
import React, { useState, useEffect } from 'react';
import { User, UserRole, Centre, CommercialAgency } from '../types';
import { verifyPassword } from '../services/passwordUtils';
import Swal from 'sweetalert2';

interface UserFormProps {
  onSave: (user: User) => void;
  onCancel: () => void;
  centres: Centre[];
  agencies: CommercialAgency[];
  initialData?: User;
  existingAdmin?: boolean;
  currentUser?: User;
}

export const UserForm: React.FC<UserFormProps> = ({ onSave, onCancel, centres, agencies, initialData, existingAdmin = false, currentUser }) => {
  const [formData, setFormData] = useState({
    username: initialData?.username || '',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    password: initialData?.password || '',
    role: initialData?.role || UserRole.AGENT,
    centreId: initialData?.centreId || '',
    agencyId: initialData?.agencyId || '',
  });
  const [oldPassword, setOldPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validation du téléphone (format algérien)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(05|06|07)[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Validation de l'email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation du téléphone
    if (!validatePhone(formData.phone)) {
      setPhoneError('Format de téléphone invalide. Exemple: 0661234567');
      return;
    } else {
      setPhoneError('');
    }
    
    // Validation de l'email
    if (!validateEmail(formData.email)) {
      setEmailError('Format d\'email invalide');
      return;
    } else {
      setEmailError('');
    }
    
    // Si un nouveau mot de passe est entré, vérifier l'ancien mot de passe
    if (formData.password && initialData) {
      if (!oldPassword) {
        alert('Veuillez entrer votre ancien mot de passe');
        return;
      }
      // Verify old password against hashed version
      const isValid = await verifyPassword(oldPassword, initialData.password || '');
      if (!isValid) {
        alert('L\'ancien mot de passe est incorrect');
        return;
      }
    }
    
    // Message de confirmation avec SweetAlert2
    const result = await Swal.fire({
      title: initialData ? 'Modifier le collaborateur' : 'Ajouter un nouveau collaborateur',
      html: `
        <div class="text-left space-y-2">
          <p><strong>Nom & Prénom:</strong> ${formData.fullName}</p>
          <p><strong>Identifiant:</strong> ${formData.username}</p>
          <p><strong>Téléphone:</strong> ${formData.phone}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Rôle:</strong> ${formData.role}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: initialData ? 'Modifier' : 'Ajouter',
      cancelButtonText: 'Annuler'
    });
    
    if (result.isConfirmed) {
      const user: User = {
        id: initialData?.id || `USR-${Date.now().toString().slice(-4)}`,
        ...formData,
        createdAt: initialData?.createdAt || new Date().toISOString(),
      };
      onSave(user);
    }
  };

  const filteredAgencies = agencies.filter(a => a.centreId === formData.centreId);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-2xl mx-auto animate-in slide-in-from-bottom duration-300">
      <div className="mb-8 border-b border-gray-50 pb-6">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
          {initialData ? 'Modifier Profil' : 'Nouveau Collaborateur'}
        </h2>
        <p className="text-sm text-gray-500 font-medium">Définissez les privilèges et l'ancrage géographique.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Identifiant de connexion</label>
            <input 
              required
              type="text" 
              className="w-full rounded-2xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 p-3.5 border text-sm font-black bg-gray-50/50"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="ex: m.amine"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nom & Prénom</label>
            <input 
              required
              type="text" 
              className="w-full rounded-2xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 p-3.5 border text-sm font-medium bg-gray-50/50"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="ex: Mohamed Amine"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Téléphone</label>
            <input 
              required
              type="tel" 
              className={`w-full rounded-2xl border p-3.5 text-sm font-medium bg-gray-50/50 ${phoneError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'}`}
              value={formData.phone}
              onChange={e => {
                setFormData({ ...formData, phone: e.target.value });
                if (phoneError && validatePhone(e.target.value)) {
                  setPhoneError('');
                }
              }}
              placeholder="ex: 0661234567"
            />
            {phoneError && (
              <p className="text-[10px] text-red-600 font-bold mt-1 ml-1">{phoneError}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Adresse Email</label>
            <input 
              required
              type="email" 
              className={`w-full rounded-2xl border p-3.5 text-sm font-medium bg-gray-50/50 ${emailError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'}`}
              value={formData.email}
              onChange={e => {
                setFormData({ ...formData, email: e.target.value });
                if (emailError && validateEmail(e.target.value)) {
                  setEmailError('');
                }
              }}
              placeholder="nom@gestioneau.dz"
            />
            {emailError && (
              <p className="text-[10px] text-red-600 font-bold mt-1 ml-1">{emailError}</p>
            )}
          </div>
        </div>

        {initialData && (
        <div className="bg-blue-50/50 p-6 rounded-3xl space-y-4 border border-blue-100">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="changePassword"
              checked={changePassword}
              onChange={e => { 
                setChangePassword(e.target.checked); 
                if (!e.target.checked) {
                  setFormData({ ...formData, password: '' });
                  setOldPassword('');
                }
              }}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="changePassword" className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Changer le mot de passe
            </label>
          </div>

          {changePassword && (
            <>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ancien mot de passe *</label>
                <input 
                  required
                  type="password" 
                  className="w-full rounded-2xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 p-3.5 border text-sm font-black bg-gray-50/50"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="Entrez l'ancien mot de passe"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nouveau mot de passe *</label>
                <input 
                  required={changePassword}
                  type="password" 
                  className="w-full rounded-2xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 p-3.5 border text-sm font-black bg-gray-50/50"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Nouveau mot de passe"
                />
              </div>
            </>
          )}
        </div>
        )}

        {!initialData && (
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Mot de passe d'accès</label>
          <input 
            required={!initialData}
            type="password" 
            className="w-full rounded-2xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 p-3.5 border text-sm font-black bg-gray-50/50"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        )}

        <div className="bg-blue-50/50 p-6 rounded-3xl space-y-4 border border-blue-100">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Affectation Structurelle
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Centre de rattachement</label>
              <select 
                required
                className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 p-3 border text-sm font-black"
                value={formData.centreId}
                onChange={e => {
                  setFormData({ ...formData, centreId: e.target.value, agencyId: '' });
                }}
                disabled={!!initialData?.centreId || currentUser?.role === UserRole.CHEF_CENTRE}
              >
                {currentUser?.role === UserRole.CHEF_CENTRE ? (
                  // Chef de centre ne voit que son propre centre
                  <option value={currentUser.centreId}>
                    {centres.find(c => c.id === currentUser.centreId)?.name || 'Votre centre'}
                  </option>
                ) : (
                  // Admin voit tous les centres
                  <>
                    <option value="">-- Choisir un centre --</option>
                    {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </>
                )}
              </select>
              {currentUser?.role === UserRole.CHEF_CENTRE && (
                <p className="text-[9px] text-blue-600 font-bold uppercase mt-2 px-1 leading-tight">
                  * En tant que Chef-Centre, vous ne pouvez affecter des utilisateurs qu'à votre centre
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Unité (Optionnel)</label>
              <select 
                className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 p-3 border text-sm font-black disabled:opacity-50"
                disabled={!formData.centreId}
                value={formData.agencyId}
                onChange={e => setFormData({ ...formData, agencyId: e.target.value })}
              >
                <option value="">Siège du Centre (Vue globale)</option>
                {filteredAgencies.map(a => <option key={a.id} value={a.id}>Agence : {a.name}</option>)}
              </select>
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-2 px-1 leading-tight">
                * Laissez vide pour un accès transversal à tout le centre technique.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Rôle et Droits Système</label>
          <select 
            className="w-full rounded-2xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 p-3.5 border text-sm font-black bg-white"
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
          >
            {Object.values(UserRole).map(role => (
              <option 
                key={role} 
                value={role}
                disabled={existingAdmin && role === UserRole.ADMIN && formData.role !== UserRole.ADMIN}
              >
                {role}{existingAdmin && role === UserRole.ADMIN && formData.role !== UserRole.ADMIN ? ' (Déjà existant)' : ''}
              </option>
            ))}
          </select>
          {existingAdmin && formData.role !== UserRole.ADMIN && (
            <p className="text-[9px] text-rose-600 font-bold uppercase mt-2 px-1 leading-tight">
              * Un administrateur existe déjà dans le système
            </p>
          )}
        </div>

        <div className="flex gap-4 pt-6">
          <button type="button" onClick={onCancel} className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
            Annuler
          </button>
          <button type="submit" className="flex-2 bg-blue-600 text-white py-4 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
            {initialData ? 'Mettre à jour le profil' : 'Créer le compte collaborateur'}
          </button>
        </div>
      </form>
    </div>
  );
};
