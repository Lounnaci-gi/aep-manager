
import React, { useState } from 'react';
import { WorkType } from '../types';
import { DbService } from '../services/dbService';

interface WorkTypeManagerProps {
  workTypes: WorkType[];
  onAdd: (label: string) => void;
  onUpdate: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

export const WorkTypeManager: React.FC<WorkTypeManagerProps> = ({ workTypes, onAdd, onUpdate, onDelete }) => {
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const dbInfo = DbService.getDbInfo();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      onAdd(newLabel.trim());
      setNewLabel('');
    }
  };

  const startEdit = (type: WorkType) => {
    setEditingId(type.id);
    setEditLabel(type.label);
  };

  const handleUpdate = () => {
    if (editingId && editLabel.trim()) {
      onUpdate(editingId, editLabel.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* DB STATUS SECTION */}
      <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl border border-white/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
            <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">Statut de la Base de Données</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Source (MongoDB Atlas)</p>
              <code className="text-xs bg-black/50 p-2 rounded block truncate border border-white/5">
                mongodb+srv://lounnaci:********@cluster0.l0q2v.mongodb.net/
              </code>
            </div>
            <div className="flex gap-10">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Base active</p>
                <p className="text-lg font-black">{dbInfo.dbName}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Cluster</p>
                <p className="text-lg font-black">{dbInfo.cluster}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              />
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all">
                Ajouter à la base
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">
              Liste des types de travaux enregistrés
            </div>
            <ul className="divide-y divide-gray-100">
              {workTypes.map((type) => (
                <li key={type.id} className="px-6 py-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors">
                  {editingId === type.id ? (
                    <div className="flex-grow flex gap-2">
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
                      <span className="text-gray-900 font-bold text-sm italic">{type.label}</span>
                      <div className="flex gap-4">
                        <button onClick={() => startEdit(type)} className="text-blue-600 hover:text-blue-800 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => onDelete(type.id)} className="text-red-300 hover:text-red-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
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
