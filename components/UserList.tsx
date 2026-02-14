
import React from 'react';
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

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-rose-100 text-rose-700 border-rose-200';
      case UserRole.CHEF_CENTRE: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case UserRole.AGENT: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-gray-100">
      <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
        <div>
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Collection : Utilisateurs</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Accès et Habilitations GestionEau</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black px-4 py-1.5 bg-blue-600 text-white rounded-full uppercase tracking-widest shadow-lg shadow-blue-100">
            {users.length} Documents
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/30">
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom & Prénom</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Téléphone</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Affectation Structurelle</th>
              <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(user => {
              const centre = centres.find(c => c.id === user.centreId);
              const agency = agencies.find(a => a.id === user.agencyId);
              
              return (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-[10px] font-mono text-gray-400">{user.id}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">
                        {user.fullName?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-black text-gray-900 tracking-tight">{user.fullName || '-'}</div>
                        <div className="text-[9px] text-gray-400 font-bold">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-[11px] font-mono text-gray-600">{user.phone || '-'}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-[11px] font-bold text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-tighter ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-700 uppercase">{centre?.name || 'Siège Social'}</div>
                      {agency && <div className="text-[9px] font-bold text-blue-500 uppercase">Agence: {agency.name}</div>}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-3">
                      {isAdmin && (
                        <>
                          <button onClick={() => onEdit(user)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-xl transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          {user.username !== 'admin' && (
                            <button onClick={() => onDelete(user.id)} className="text-gray-300 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all">
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
