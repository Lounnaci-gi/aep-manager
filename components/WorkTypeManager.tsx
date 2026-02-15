
import React, { useState } from 'react';
import { WorkType, UserRole } from '../types';
import Swal from 'sweetalert2';


interface WorkTypeManagerProps {
  workTypes: WorkType[];
  onAdd: (label: string, workType?: WorkType) => void;
  onUpdate: (id: string, label: string, workType?: WorkType) => void;
  onDelete: (id: string) => void;
  currentUser?: any;
}

export const WorkTypeManager: React.FC<WorkTypeManagerProps> = ({ workTypes, onAdd, onUpdate, onDelete, currentUser }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newAllowedRoles, setNewAllowedRoles] = useState<UserRole[]>([]); // Par défaut, aucun rôle n'est sélectionné
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editAllowedRoles, setEditAllowedRoles] = useState<UserRole[]>([]);


  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      if (newAllowedRoles.length === 0) {
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
            allowedRoles: newAllowedRoles
          };
          onAdd(newLabel.trim(), newType);
          setNewLabel('');
          setNewAllowedRoles([]); // Réinitialiser avec aucun rôle sélectionné
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
            allowedRoles: editAllowedRoles
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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">


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
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Accès Autorisés :</p>
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
                              // Ajouter le rôle
                              if (!newAllowedRoles.some(allowedRole => allowedRole === role)) {
                                setNewAllowedRoles([...newAllowedRoles, role]);
                              }
                            } else {
                              // Retirer le rôle
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
                        <span className="text-gray-900 font-bold text-sm italic flex-grow">{type.label}</span>
                        <div className="flex gap-4">
                          <button onClick={() => startEdit(type)} className="text-blue-600 hover:text-blue-800 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={async () => {
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
                          }} className="text-red-300 hover:text-red-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {editingId === type.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Accès Autorisés :</p>
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
                                    // Ajouter le rôle
                                    if (!editAllowedRoles.some(allowedRole => allowedRole === role)) {
                                      setEditAllowedRoles([...editAllowedRoles, role]);
                                    }
                                  } else {
                                    // Retirer le rôle
                                    setEditAllowedRoles(editAllowedRoles.filter(allowedRole => allowedRole !== role));
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
