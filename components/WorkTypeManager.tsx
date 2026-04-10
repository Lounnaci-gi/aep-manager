
import React, { useState } from 'react';
import { WorkType, UserRole, User } from '../types';
import Swal from 'sweetalert2';


interface WorkTypeManagerProps {
  workTypes: WorkType[];
  users?: User[];
  onAdd: (label: string, workType?: WorkType) => void;
  onUpdate: (id: string, label: string, workType?: WorkType) => void;
  onDelete: (id: string) => void;
  currentUser?: any;
}

export const WorkTypeManager: React.FC<WorkTypeManagerProps> = ({ workTypes, users = [], onAdd, onUpdate, onDelete, currentUser }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newAllowedRoles, setNewAllowedRoles] = useState<UserRole[]>([]); // Rôles pour créer la demande
  const [newRequestValidationRoles, setNewRequestValidationRoles] = useState<UserRole[]>([]); // Rôles pour valider la demande
  const [newQuoteAllowedRoles, setNewQuoteAllowedRoles] = useState<UserRole[]>([]); // Rôles pour créer le devis
  const [newQuoteValidationRoles, setNewQuoteValidationRoles] = useState<UserRole[]>([]); // Rôles pour valider le devis
  const [newDeleteAllowedRoles, setNewDeleteAllowedRoles] = useState<UserRole[]>([]); // Rôles pour supprimer le type
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editAllowedRoles, setEditAllowedRoles] = useState<UserRole[]>([]);
  const [editRequestValidationRoles, setEditRequestValidationRoles] = useState<UserRole[]>([]);
  const [editQuoteAllowedRoles, setEditQuoteAllowedRoles] = useState<UserRole[]>([]);
  const [editQuoteValidationRoles, setEditQuoteValidationRoles] = useState<UserRole[]>([]);
  const [editDeleteAllowedRoles, setEditDeleteAllowedRoles] = useState<UserRole[]>([]);


  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      if (newAllowedRoles.length === 0) {
        Swal.fire({
          title: 'Aucun rôle sélectionné',
          text: 'Veuillez sélectionner au moins un rôle autorisé pour créer ce type de travail.',
          icon: 'warning',
          confirmButtonColor: '#2563eb',
          timer: 3000,
          showConfirmButton: true
        });
        return;
      }
      
      // Vérifier si un type de travail avec le même libellé existe déjà
      const typeExists = workTypes.some(
        type => type.label.toLowerCase() === newLabel.trim().toLowerCase()
      );
      
      if (typeExists) {
        Swal.fire({
          title: 'Type de travail existant',
          text: `Un type de travail avec le libellé "${newLabel.trim()}" existe déjà. Veuillez choisir un libellé unique.`,
          icon: 'warning',
          confirmButtonColor: '#2563eb',
          timer: 4000,
          showConfirmButton: true
        });
        return;
      }
      
      Swal.fire({
        title: 'Confirmation',
        text: `Êtes-vous sûr de vouloir ajouter le type de travail "${newLabel.trim()}" ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Oui, ajouter',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          // Créer un objet WorkType avec les rôles sélectionnés
          const newType: WorkType = {
            id: `WT-${Date.now().toString().slice(-4)}`,
            label: newLabel.trim(),
            allowedRoles: newAllowedRoles,
            requestValidationRoles: newRequestValidationRoles,
            quoteAllowedRoles: newQuoteAllowedRoles,
            quoteValidationRoles: newQuoteValidationRoles,
            deleteAllowedRoles: newDeleteAllowedRoles
          };
          onAdd(newLabel.trim(), newType);
          setNewLabel('');
          setNewAllowedRoles([]);
          setNewRequestValidationRoles([]);
          setNewQuoteAllowedRoles([]);
          setNewQuoteValidationRoles([]);
          setNewDeleteAllowedRoles([]);
          Swal.fire({
            title: 'Ajouté !',
            text: `Le type de travail "${newLabel.trim()}" a été ajouté avec succès.`,
            icon: 'success',
            confirmButtonColor: '#2563eb',
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    }
  };

  const startEdit = (type: WorkType) => {
    setEditingId(type.id);
    setEditLabel(type.label);
    // Initialiser avec les rôles existants, ou un tableau vide si non définis
    const rolesToSet = type.allowedRoles && Array.isArray(type.allowedRoles) ? type.allowedRoles : [];
    setEditAllowedRoles(rolesToSet);
    const reqValRoles = type.requestValidationRoles && Array.isArray(type.requestValidationRoles) ? type.requestValidationRoles : [];
    setEditRequestValidationRoles(reqValRoles);
    const quoteRoles = type.quoteAllowedRoles && Array.isArray(type.quoteAllowedRoles) ? type.quoteAllowedRoles : [];
    setEditQuoteAllowedRoles(quoteRoles);
    const quoteValidationRoles = type.quoteValidationRoles && Array.isArray(type.quoteValidationRoles) ? type.quoteValidationRoles : [];
    setEditQuoteValidationRoles(quoteValidationRoles);
    const deleteRoles = type.deleteAllowedRoles && Array.isArray(type.deleteAllowedRoles) ? type.deleteAllowedRoles : [];
    setEditDeleteAllowedRoles(deleteRoles);
  };

  const handleUpdate = () => {
    if (editingId && editLabel.trim()) {
      if (editAllowedRoles.length === 0) {
        Swal.fire({
          title: 'Aucun rôle sélectionné',
          text: 'Veuillez sélectionner au moins un rôle autorisé pour ce type de travail.',
          icon: 'warning',
          confirmButtonColor: '#2563eb',
          timer: 3000,
          showConfirmButton: true
        });
        return;
      }
      
      // Vérifier si un type de travail avec le même libellé existe déjà (autre que celui en cours de modification)
      const typeExists = workTypes.some(
        type => type.id !== editingId && type.label.toLowerCase() === editLabel.trim().toLowerCase()
      );
      
      if (typeExists) {
        Swal.fire({
          title: 'Type de travail existant',
          text: `Un type de travail avec le libellé "${editLabel.trim()}" existe déjà. Veuillez choisir un libellé unique.`,
          icon: 'warning',
          confirmButtonColor: '#2563eb',
          timer: 4000,
          showConfirmButton: true
        });
        return;
      }
      
      Swal.fire({
        title: 'Confirmation',
        text: `Êtes-vous sûr de vouloir modifier ce type de travail ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Oui, modifier',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          // Créer un objet WorkType avec les rôles autorisés
          const updatedType: WorkType = {
            id: editingId,
            label: editLabel.trim(),
            allowedRoles: editAllowedRoles,
            requestValidationRoles: editRequestValidationRoles,
            quoteAllowedRoles: editQuoteAllowedRoles,
            quoteValidationRoles: editQuoteValidationRoles,
            deleteAllowedRoles: editDeleteAllowedRoles
          };
          onUpdate(editingId, editLabel.trim(), updatedType);
          setEditingId(null);
          Swal.fire({
            title: 'Modifié !',
            text: `Le type de travail a été modifié avec succès.`,
            icon: 'success',
            confirmButtonColor: '#2563eb',
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    }
  };

  return (
    <div className="max-w-[95%] mx-auto space-y-8 pb-20">


      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Nouveau Type</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input 
                type="text" 
                placeholder="Libellé travaux..."
                className="w-full rounded-md border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                disabled={currentUser?.role !== UserRole.ADMIN}
              />
              
              {/* Section pour sélectionner les rôles autorisés */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">📝 Rôles - Création Demande :</p>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Fermer tous les autres dropdowns
                      const dropdowns = document.querySelectorAll('.role-dropdown');
                      dropdowns.forEach(dropdown => {
                        if (dropdown !== e.currentTarget.nextElementSibling) {
                          (dropdown as HTMLElement).style.display = 'none';
                        }
                      });
                      // Basculer l'affichage de ce dropdown
                      const dropdown = e.currentTarget.nextElementSibling;
                      (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                    }}
                  >
                    {newAllowedRoles.length > 0 ? `${newAllowedRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                    <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                    {Object.values(UserRole).map((role, index) => (
                      <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600 focus:ring-blue-500"
                          checked={newAllowedRoles.some(allowedRole => allowedRole === role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (!newAllowedRoles.some(allowedRole => allowedRole === role)) {
                                setNewAllowedRoles([...newAllowedRoles, role]);
                              }
                            } else {
                              setNewAllowedRoles(newAllowedRoles.filter(allowedRole => allowedRole !== role));
                            }
                          }}
                        />
                        <span className="ml-2 text-xs">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Affichage des rôles sélectionnés sous forme de badges */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {newAllowedRoles.map((role, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-[8px] font-bold">
                      {role}
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setNewAllowedRoles(newAllowedRoles.filter(r => r !== role));
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* NOUVEAU: Section pour les rôles de validation de demande */}
              <div className="mt-3 pt-3 border-t border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">✓ Rôles - Validation Demande :</p>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full p-2 border border-amber-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      const dropdowns = document.querySelectorAll('.role-dropdown');
                      dropdowns.forEach(dropdown => {
                        if (dropdown !== e.currentTarget.nextElementSibling) {
                          (dropdown as HTMLElement).style.display = 'none';
                        }
                      });
                      const dropdown = e.currentTarget.nextElementSibling;
                      (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                    }}
                  >
                    {newRequestValidationRoles.length > 0 ? `${newRequestValidationRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                    <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-amber-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                    {Object.values(UserRole).map((role, index) => (
                      <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-amber-600 focus:ring-amber-500"
                          checked={newRequestValidationRoles.some(allowedRole => allowedRole === role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (!newRequestValidationRoles.some(allowedRole => allowedRole === role)) {
                                setNewRequestValidationRoles([...newRequestValidationRoles, role]);
                              }
                            } else {
                              setNewRequestValidationRoles(newRequestValidationRoles.filter(allowedRole => allowedRole !== role));
                            }
                          }}
                        />
                        <span className="ml-2 text-xs">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {newRequestValidationRoles.map((role, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-[8px] font-bold">
                      {role}
                      <button
                        type="button"
                        className="text-amber-600 hover:text-amber-800"
                        onClick={() => {
                          setNewRequestValidationRoles(newRequestValidationRoles.filter(r => r !== role));
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* NOUVEAU: Section pour les rôles de création de devis */}
              <div className="mt-3 pt-3 border-t border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">💰 Rôles - Création Devis :</p>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full p-2 border border-emerald-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      const dropdowns = document.querySelectorAll('.role-dropdown');
                      dropdowns.forEach(dropdown => {
                        if (dropdown !== e.currentTarget.nextElementSibling) {
                          (dropdown as HTMLElement).style.display = 'none';
                        }
                      });
                      const dropdown = e.currentTarget.nextElementSibling;
                      (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                    }}
                  >
                    {newQuoteAllowedRoles.length > 0 ? `${newQuoteAllowedRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                    <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-emerald-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                    {Object.values(UserRole).map((role, index) => (
                      <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                          checked={newQuoteAllowedRoles.some(allowedRole => allowedRole === role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (!newQuoteAllowedRoles.some(allowedRole => allowedRole === role)) {
                                setNewQuoteAllowedRoles([...newQuoteAllowedRoles, role]);
                              }
                            } else {
                              setNewQuoteAllowedRoles(newQuoteAllowedRoles.filter(allowedRole => allowedRole !== role));
                            }
                          }}
                        />
                        <span className="ml-2 text-xs">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {newQuoteAllowedRoles.map((role, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-[8px] font-bold">
                      {role}
                      <button
                        type="button"
                        className="text-emerald-600 hover:text-emerald-800"
                        onClick={() => {
                          setNewQuoteAllowedRoles(newQuoteAllowedRoles.filter(r => r !== role));
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* NOUVEAU: Section pour les rôles de validation de devis */}
              <div className="mt-3 pt-3 border-t border-purple-100">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">✓ Rôles - Validation Devis :</p>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full p-2 border border-purple-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      const dropdowns = document.querySelectorAll('.role-dropdown');
                      dropdowns.forEach(dropdown => {
                        if (dropdown !== e.currentTarget.nextElementSibling) {
                          (dropdown as HTMLElement).style.display = 'none';
                        }
                      });
                      const dropdown = e.currentTarget.nextElementSibling;
                      (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                    }}
                  >
                    {newQuoteValidationRoles.length > 0 ? `${newQuoteValidationRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                    <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-purple-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                    {Object.values(UserRole).map((role, index) => (
                      <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-purple-600 focus:ring-purple-500"
                          checked={newQuoteValidationRoles.some(allowedRole => allowedRole === role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (!newQuoteValidationRoles.some(allowedRole => allowedRole === role)) {
                                setNewQuoteValidationRoles([...newQuoteValidationRoles, role]);
                              }
                            } else {
                              setNewQuoteValidationRoles(newQuoteValidationRoles.filter(allowedRole => allowedRole !== role));
                            }
                          }}
                        />
                        <span className="ml-2 text-xs">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {newQuoteValidationRoles.map((role, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-[8px] font-bold">
                      {role}
                      <button
                        type="button"
                        className="text-purple-600 hover:text-purple-800"
                        onClick={() => {
                          setNewQuoteValidationRoles(newQuoteValidationRoles.filter(r => r !== role));
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* NOUVEAU: Section pour les rôles de suppression */}
              <div className="mt-3 pt-3 border-t border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">🗑️ Rôles - Suppression :</p>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full p-2 border border-rose-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      const dropdowns = document.querySelectorAll('.role-dropdown');
                      dropdowns.forEach(dropdown => {
                        if (dropdown !== e.currentTarget.nextElementSibling) {
                          (dropdown as HTMLElement).style.display = 'none';
                        }
                      });
                      const dropdown = e.currentTarget.nextElementSibling;
                      (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                    }}
                  >
                    {newDeleteAllowedRoles.length > 0 ? `${newDeleteAllowedRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                    <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-rose-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                    {Object.values(UserRole).map((role, index) => (
                      <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-rose-600 focus:ring-rose-500"
                          checked={newDeleteAllowedRoles.some(allowedRole => allowedRole === role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (!newDeleteAllowedRoles.some(allowedRole => allowedRole === role)) {
                                setNewDeleteAllowedRoles([...newDeleteAllowedRoles, role]);
                              }
                            } else {
                              setNewDeleteAllowedRoles(newDeleteAllowedRoles.filter(allowedRole => allowedRole !== role));
                            }
                          }}
                        />
                        <span className="ml-2 text-xs">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {newDeleteAllowedRoles.map((role, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-[8px] font-bold">
                      {role}
                      <button
                        type="button"
                        className="text-rose-600 hover:text-rose-800"
                        onClick={() => {
                          setNewDeleteAllowedRoles(newDeleteAllowedRoles.filter(r => r !== role));
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <button 
                type="submit" 
                className={`w-full ${currentUser?.role !== UserRole.ADMIN ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all`}
                disabled={currentUser?.role !== UserRole.ADMIN}
              >
                {currentUser?.role !== UserRole.ADMIN ? 'Non autorisé' : 'Ajouter à la base'}
              </button>
            </form>
            {currentUser?.role !== UserRole.ADMIN && (
              <p className="text-[10px] text-rose-600 font-bold uppercase mt-2 px-1 leading-tight">
                * Réservé aux administrateurs
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">
              Liste des types de travaux enregistrés
            </div>
            <ul className="divide-y divide-gray-100">
              {workTypes.map((type) => (
                <li key={type.id} className="px-6 py-4 flex flex-col hover:bg-blue-50/30 transition-colors">
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between w-full">
                      {editingId === type.id ? (
                        <div className="flex-grow flex gap-2 mr-4">
                          <input 
                            type="text" 
                            className="flex-grow rounded-md border-gray-300 sm:text-sm p-1 border"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                          />
                          <button onClick={handleUpdate} className="text-green-600 font-bold text-xs uppercase">Sauver</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs uppercase">Annuler</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-grow">
                            <span className="text-gray-900 font-bold text-sm italic">{type.label}</span>
                            
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Demandes */}
                              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                  <span>📝 Demandes</span>
                                </div>
                                {type.allowedRoles && type.allowedRoles.length > 0 ? (
                                  <div className="space-y-3">
                                    {type.allowedRoles.map((role, i) => {
                                      const roleUsers = users.filter(u => u.role === role);
                                      return (
                                        <div key={i} className="text-xs">
                                          <div className="font-bold text-blue-800/80 mb-1.5 border-b border-blue-100/50 pb-1">{role}</div>
                                          {roleUsers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                              {roleUsers.map(u => (
                                                <span key={u.id} className="inline-flex items-center bg-white text-blue-700 px-2 py-0.5 rounded shadow-sm text-[10px] border border-blue-100 font-medium">
                                                  {u.fullName}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-[10px] text-gray-400 italic block mt-1">Aucun utilisateur</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Aucun rôle assigné</span>
                                )}
                              </div>

                              {/* Validation Demande */}
                              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                  <span>✓ Valider Demande</span>
                                </div>
                                {type.requestValidationRoles && type.requestValidationRoles.length > 0 ? (
                                  <div className="space-y-3">
                                    {type.requestValidationRoles.map((role, i) => {
                                      const roleUsers = users.filter(u => u.role === role);
                                      return (
                                        <div key={i} className="text-xs">
                                          <div className="font-bold text-amber-800/80 mb-1.5 border-b border-amber-100/50 pb-1">{role}</div>
                                          {roleUsers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                              {roleUsers.map(u => (
                                                <span key={u.id} className="inline-flex items-center bg-white text-amber-700 px-2 py-0.5 rounded shadow-sm text-[10px] border border-amber-100 font-medium">
                                                  {u.fullName}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-[10px] text-gray-400 italic block mt-1">Aucun utilisateur</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Aucun rôle assigné</span>
                                )}
                              </div>

                              {/* Devis */}
                              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                  <span>💰 Devis</span>
                                </div>
                                {type.quoteAllowedRoles && type.quoteAllowedRoles.length > 0 ? (
                                  <div className="space-y-3">
                                    {type.quoteAllowedRoles.map((role, i) => {
                                      const roleUsers = users.filter(u => u.role === role);
                                      return (
                                        <div key={i} className="text-xs">
                                          <div className="font-bold text-emerald-800/80 mb-1.5 border-b border-emerald-100/50 pb-1">{role}</div>
                                          {roleUsers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                              {roleUsers.map(u => (
                                                <span key={u.id} className="inline-flex items-center bg-white text-emerald-700 px-2 py-0.5 rounded shadow-sm text-[10px] border border-emerald-100 font-medium">
                                                  {u.fullName}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-[10px] text-gray-400 italic block mt-1">Aucun utilisateur</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Aucun rôle assigné</span>
                                )}
                              </div>

                              {/* Validations Devis */}
                              <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                                <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                  <span>✓ Validations Devis</span>
                                </div>
                                {type.quoteValidationRoles && type.quoteValidationRoles.length > 0 ? (
                                  <div className="space-y-3">
                                    {type.quoteValidationRoles.map((role, i) => {
                                      const roleUsers = users.filter(u => u.role === role);
                                      return (
                                        <div key={i} className="text-xs">
                                          <div className="font-bold text-purple-800/80 mb-1.5 border-b border-purple-100/50 pb-1">{role}</div>
                                          {roleUsers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                              {roleUsers.map(u => (
                                                <span key={u.id} className="inline-flex items-center bg-white text-purple-700 px-2 py-0.5 rounded shadow-sm text-[10px] border border-purple-100 font-medium">
                                                  {u.fullName}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-[10px] text-gray-400 italic block mt-1">Aucun utilisateur</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Aucun rôle assigné</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <button onClick={() => startEdit(type)} className="text-blue-600 hover:text-blue-800 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button 
                              onClick={async () => {
                                // Vérifier si l'utilisateur actuel a le droit de supprimer
                                const canDelete = !type.deleteAllowedRoles || 
                                                  type.deleteAllowedRoles.length === 0 || 
                                                  type.deleteAllowedRoles.includes(currentUser?.role);
                                
                                if (!canDelete) {
                                  Swal.fire({
                                    title: 'Accès Refusé',
                                    text: 'Vous n\'avez pas l\'autorisation de supprimer ce type de travail.',
                                    icon: 'error',
                                    confirmButtonColor: '#2563eb',
                                    timer: 3000,
                                    showConfirmButton: true
                                  });
                                  return;
                                }
                                
                                const result = await Swal.fire({
                                  title: 'Êtes-vous sûr ?',
                                  text: 'Cette action supprimera définitivement ce type de travail.',
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#dc2626',
                                  cancelButtonColor: '#64748b',
                                  confirmButtonText: 'Oui, supprimer',
                                  cancelButtonText: 'Annuler'
                                });
                                if (result.isConfirmed) {
                                  onDelete(type.id);
                                  Swal.fire({
                                    title: 'Supprimé !',
                                    text: 'Le type de travail a été supprimé avec succès.',
                                    icon: 'success',
                                    confirmButtonColor: '#2563eb',
                                    timer: 2000,
                                    showConfirmButton: false
                                  });
                                }
                              }} 
                              className={`${
                                (!type.deleteAllowedRoles || type.deleteAllowedRoles.length === 0 || type.deleteAllowedRoles.includes(currentUser?.role))
                                  ? 'text-red-300 hover:text-red-600'
                                  : 'text-gray-300 cursor-not-allowed'
                              } transition-colors`}
                              disabled={
                                type.deleteAllowedRoles && 
                                type.deleteAllowedRoles.length > 0 && 
                                !type.deleteAllowedRoles.includes(currentUser?.role)
                              }
                              title={
                                (type.deleteAllowedRoles && type.deleteAllowedRoles.length > 0 && !type.deleteAllowedRoles.includes(currentUser?.role))
                                  ? 'Vous n\'avez pas l\'autorisation de supprimer'
                                  : 'Supprimer'
                              }
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {editingId === type.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                      {/* Rôles création demande */}
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">📝 Rôles - Création Demande :</p>
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full p-2 border border-gray-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              const dropdowns = document.querySelectorAll('.role-dropdown');
                              dropdowns.forEach(dropdown => {
                                if (dropdown !== e.currentTarget.nextElementSibling) {
                                  (dropdown as HTMLElement).style.display = 'none';
                                }
                              });
                              const dropdown = e.currentTarget.nextElementSibling;
                              (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                            }}
                          >
                            {editAllowedRoles.length > 0 ? `${editAllowedRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                            <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </button>
                          
                          <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto overflow-visible" style={{ display: 'none' }}>
                            {Object.values(UserRole).map((role, index) => (
                              <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded text-blue-600 focus:ring-blue-500"
                                  checked={editAllowedRoles.some(allowedRole => allowedRole === role)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (!editAllowedRoles.some(allowedRole => allowedRole === role)) {
                                        setEditAllowedRoles([...editAllowedRoles, role]);
                                      }
                                    } else {
                                      setEditAllowedRoles(editAllowedRoles.filter(allowedRole => allowedRole !== role));
                                    }
                                  }}
                                />
                                <span className="ml-2 text-xs">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {editAllowedRoles.map((role, index) => (
                            <span key={index} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-[8px] font-bold">
                              {role}
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => {
                                  setEditAllowedRoles(editAllowedRoles.filter(r => r !== role));
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* NOUVEAU: Rôles validation demande */}
                      <div className="pt-3 border-t border-amber-100">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">✓ Rôles - Validation Demande :</p>
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full p-2 border border-amber-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              const dropdowns = document.querySelectorAll('.role-dropdown');
                              dropdowns.forEach(dropdown => {
                                if (dropdown !== e.currentTarget.nextElementSibling) {
                                  (dropdown as HTMLElement).style.display = 'none';
                                }
                              });
                              const dropdown = e.currentTarget.nextElementSibling;
                              (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                            }}
                          >
                            {editRequestValidationRoles.length > 0 ? `${editRequestValidationRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                            <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </button>
                          
                          <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-amber-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                            {Object.values(UserRole).map((role, index) => (
                              <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded text-amber-600 focus:ring-amber-500"
                                  checked={editRequestValidationRoles.some(allowedRole => allowedRole === role)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (!editRequestValidationRoles.some(allowedRole => allowedRole === role)) {
                                        setEditRequestValidationRoles([...editRequestValidationRoles, role]);
                                      }
                                    } else {
                                      setEditRequestValidationRoles(editRequestValidationRoles.filter(allowedRole => allowedRole !== role));
                                    }
                                  }}
                                />
                                <span className="ml-2 text-xs">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {editRequestValidationRoles.map((role, index) => (
                            <span key={index} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-[8px] font-bold">
                              {role}
                              <button
                                type="button"
                                className="text-amber-600 hover:text-amber-800"
                                onClick={() => {
                                  setEditRequestValidationRoles(editRequestValidationRoles.filter(r => r !== role));
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* NOUVEAU: Rôles création devis */}
                      <div className="pt-3 border-t border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">💰 Rôles - Création Devis :</p>
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full p-2 border border-emerald-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              const dropdowns = document.querySelectorAll('.role-dropdown');
                              dropdowns.forEach(dropdown => {
                                if (dropdown !== e.currentTarget.nextElementSibling) {
                                  (dropdown as HTMLElement).style.display = 'none';
                                }
                              });
                              const dropdown = e.currentTarget.nextElementSibling;
                              (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                            }}
                          >
                            {editQuoteAllowedRoles.length > 0 ? `${editQuoteAllowedRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                            <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </button>
                          
                          <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-emerald-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                            {Object.values(UserRole).map((role, index) => (
                              <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded text-emerald-600 focus:ring-emerald-500"
                                  checked={editQuoteAllowedRoles.some(allowedRole => allowedRole === role)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (!editQuoteAllowedRoles.some(allowedRole => allowedRole === role)) {
                                        setEditQuoteAllowedRoles([...editQuoteAllowedRoles, role]);
                                      }
                                    } else {
                                      setEditQuoteAllowedRoles(editQuoteAllowedRoles.filter(allowedRole => allowedRole !== role));
                                    }
                                  }}
                                />
                                <span className="ml-2 text-xs">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {editQuoteAllowedRoles.map((role, index) => (
                            <span key={index} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-[8px] font-bold">
                              {role}
                              <button
                                type="button"
                                className="text-emerald-600 hover:text-emerald-800"
                                onClick={() => {
                                  setEditQuoteAllowedRoles(editQuoteAllowedRoles.filter(r => r !== role));
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* NOUVEAU: Rôles validation devis */}
                      <div className="pt-3 border-t border-purple-100">
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">✓ Rôles - Validation Devis :</p>
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full p-2 border border-purple-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              const dropdowns = document.querySelectorAll('.role-dropdown');
                              dropdowns.forEach(dropdown => {
                                if (dropdown !== e.currentTarget.nextElementSibling) {
                                  (dropdown as HTMLElement).style.display = 'none';
                                }
                              });
                              const dropdown = e.currentTarget.nextElementSibling;
                              (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                            }}
                          >
                            {editQuoteValidationRoles.length > 0 ? `${editQuoteValidationRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                            <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </button>
                          
                          <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-purple-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                            {Object.values(UserRole).map((role, index) => (
                              <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded text-purple-600 focus:ring-purple-500"
                                  checked={editQuoteValidationRoles.some(allowedRole => allowedRole === role)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (!editQuoteValidationRoles.some(allowedRole => allowedRole === role)) {
                                        setEditQuoteValidationRoles([...editQuoteValidationRoles, role]);
                                      }
                                    } else {
                                      setEditQuoteValidationRoles(editQuoteValidationRoles.filter(allowedRole => allowedRole !== role));
                                    }
                                  }}
                                />
                                <span className="ml-2 text-xs">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {editQuoteValidationRoles.map((role, index) => (
                            <span key={index} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-[8px] font-bold">
                              {role}
                              <button
                                type="button"
                                className="text-purple-600 hover:text-purple-800"
                                onClick={() => {
                                  setEditQuoteValidationRoles(editQuoteValidationRoles.filter(r => r !== role));
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* NOUVEAU: Rôles suppression */}
                      <div className="pt-3 border-t border-rose-100">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">🗑️ Rôles - Suppression :</p>
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full p-2 border border-rose-300 rounded-md text-xs bg-white text-left flex justify-between items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              const dropdowns = document.querySelectorAll('.role-dropdown');
                              dropdowns.forEach(dropdown => {
                                if (dropdown !== e.currentTarget.nextElementSibling) {
                                  (dropdown as HTMLElement).style.display = 'none';
                                }
                              });
                              const dropdown = e.currentTarget.nextElementSibling;
                              (dropdown as HTMLElement).style.display = (dropdown as HTMLElement).style.display === 'block' ? 'none' : 'block';
                            }}
                          >
                            {editDeleteAllowedRoles.length > 0 ? `${editDeleteAllowedRoles.length} rôle(s) sélectionné(s)` : 'Sélectionner des rôles...'}
                            <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </button>
                          
                          <div className="role-dropdown absolute z-10 w-full mt-1 bg-white border border-rose-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ display: 'none' }}>
                            {Object.values(UserRole).map((role, index) => (
                              <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded text-rose-600 focus:ring-rose-500"
                                  checked={editDeleteAllowedRoles.some(allowedRole => allowedRole === role)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (!editDeleteAllowedRoles.some(allowedRole => allowedRole === role)) {
                                        setEditDeleteAllowedRoles([...editDeleteAllowedRoles, role]);
                                      }
                                    } else {
                                      setEditDeleteAllowedRoles(editDeleteAllowedRoles.filter(allowedRole => allowedRole !== role));
                                    }
                                  }}
                                />
                                <span className="ml-2 text-xs">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {editDeleteAllowedRoles.map((role, index) => (
                            <span key={index} className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-[8px] font-bold">
                              {role}
                              <button
                                type="button"
                                className="text-rose-600 hover:text-rose-800"
                                onClick={() => {
                                  setEditDeleteAllowedRoles(editDeleteAllowedRoles.filter(r => r !== role));
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
