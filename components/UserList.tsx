
import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import { User, UserRole, Centre, CommercialAgency } from '../types';

interface UserListProps {
  users: User[];
  centres: Centre[];
  agencies: CommercialAgency[];
  currentUser?: User;
  onDelete: (id: string) => void;
  onEdit: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, centres, agencies, currentUser, onDelete, onEdit }) => {
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isAuthorized = isAdmin || currentUser?.role === UserRole.CHEF_CENTRE;

  useEffect(() => {
    if (!isAuthorized && currentUser) {
      Swal.fire({
        title: '🔒 Accès Refusé',
        text: 'Vous n\'avez pas les habilitations nécessaires pour consulter la liste des collaborateurs. Cette section est strictement réservée à l\'administration.',
        icon: 'error',
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'Compris'
      });
    }
  }, [isAuthorized, currentUser]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 mb-6 bg-rose-50 rounded-[2.5rem] flex items-center justify-center border border-rose-100 shadow-xl shadow-rose-50/50">
          <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Zone Restreinte</h2>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed max-w-md">
          Action interdite. Votre niveau d'accréditation est insuffisant pour accéder à ce répertoire de données confidentielles.
        </p>
      </div>
    );
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-rose-100 text-rose-700 border-rose-200';
      case UserRole.CHEF_CENTRE: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case UserRole.AGENT: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    if (isAdmin) return true;
    if (currentUser?.role === UserRole.CHEF_CENTRE) {
      return user.centreId === currentUser.centreId;
    }
    return false;
  });

  return (
    <div className="bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-gray-100 mx-2 sm:mx-0">
      <div className="px-4 sm:px-8 py-6 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
        <div>
          <h3 className="text-base sm:text-xl font-black text-gray-900 uppercase tracking-tighter">Gestion des Utilisateurs</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Accès et Habilitations GestionEau</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[10px] font-black px-3 sm:px-4 py-1.5 bg-blue-600 text-white rounded-full uppercase tracking-widest shadow-lg shadow-blue-100">
            {filteredUsers.length} Membres
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 responsive-mobile">
          <thead className="hidden sm:table-header-group">
            <tr className="bg-gray-50/30">
              <th className="px-6 sm:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
              <th className="px-6 sm:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom & Prénom</th>
              <th className="px-6 sm:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Téléphone</th>
              <th className="px-6 sm:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
              <th className="px-6 sm:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle</th>
              <th className="px-6 sm:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Affectation Structurelle</th>
              <th className="px-6 sm:px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map(user => {
              const centre = centres.find(c => c.id === user.centreId);
              const agency = agencies.find(a => a.id === user.agencyId);
              const canModify = isAdmin || (currentUser?.role === UserRole.CHEF_CENTRE && user.centreId === currentUser.centreId);

              return (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-4 sm:px-8 py-5 whitespace-nowrap" data-label="ID">
                    <div className="text-[10px] font-mono text-gray-400">{user.id}</div>
                  </td>
                  <td className="px-4 sm:px-8 py-5 whitespace-nowrap" data-label="Utilisateur">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {user.fullName?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0">
                        <div className="text-sm font-black text-gray-900 tracking-tight truncate">{user.fullName || '-'}</div>
                        <div className="text-[9px] text-gray-400 font-bold">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-5 whitespace-nowrap" data-label="Téléphone">
                    <div className="text-[11px] font-mono text-gray-600">{user.phone || '-'}</div>
                  </td>
                  <td className="px-4 sm:px-8 py-5 whitespace-nowrap" data-label="Email">
                    <div className="text-[11px] font-bold text-gray-600 truncate max-w-[180px] sm:max-w-none">{user.email}</div>
                  </td>
                  <td className="px-4 sm:px-8 py-5 whitespace-nowrap" data-label="Rôle">
                    <span className={`inline-block px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-tighter ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 sm:px-8 py-5 whitespace-nowrap" data-label="Structure">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-700 uppercase">{centre?.name || 'Siège Social'}</div>
                      {agency && <div className="text-[9px] font-bold text-blue-500 uppercase truncate">{agency.name}</div>}
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-5 whitespace-nowrap text-right" data-label="Actions">
                    <div className="flex justify-end gap-2 sm:gap-3">
                      {canModify && (
                        <>
                          <button onClick={() => onEdit(user)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-xl transition-all" title="Modifier">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          {user.username !== 'admin' && (
                            <button onClick={() => onDelete(user.id)} className="text-gray-300 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all" title="Supprimer">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
