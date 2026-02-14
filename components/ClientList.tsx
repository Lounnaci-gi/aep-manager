
import React from 'react';
import { Client } from '../types';

interface ClientListProps {
  clients: Client[];
  onDelete: (id: string) => void;
  onEdit: (client: Client) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ clients, onDelete, onEdit }) => {
  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case 'Particulier': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Locataire': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'Mandataire': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 mx-2 sm:mx-0">
      <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Annuaire des Abonnés</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Base Clients GestionEau</p>
        </div>
        <span className="text-[10px] font-black px-3 py-1 bg-blue-600 text-white rounded-full uppercase tracking-widest">
          {clients.length} Inscrits
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/30">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type / Qualité</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Localisation</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
                      {client.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-black text-gray-900 tracking-tight">{(client.civility ? client.civility + ' ' : '') + client.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold">ID: {client.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase border tracking-tighter ${getTypeBadgeStyles(client.type)}`}>
                    {client.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs text-gray-900 font-medium">{client.email}</div>
                  <div className="text-[10px] text-gray-500 font-black tracking-widest mt-0.5">{client.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-gray-600 truncate max-w-[200px] italic">{client.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => onEdit(client)} className="text-blue-400 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => onDelete(client.id)} className="text-gray-200 hover:text-rose-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <svg className="w-12 h-12 text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <p className="text-sm text-gray-400 font-black uppercase tracking-widest italic">Aucun abonné enregistré dans la base Atlas.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
