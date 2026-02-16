
import React, { useState, useMemo } from 'react';
import { WorkRequest, RequestStatus, CommercialAgency, Centre, BranchementType } from '../types';

interface WorkRequestListProps {
  requests: WorkRequest[];
  agencies: CommercialAgency[];
  centres: Centre[];
  onDelete: (id: string) => void;
  onEdit: (request: WorkRequest) => void;
  onCreateQuote: (request: WorkRequest) => void;
  onUpdateStatus: (id: string, status: RequestStatus) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc';

export const WorkRequestList: React.FC<WorkRequestListProps> = ({ 
  requests, 
  agencies,
  centres,
  onDelete, 
  onEdit, 
  onCreateQuote, 
  onUpdateStatus 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.RECEIVED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case RequestStatus.UNDER_STUDY: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case RequestStatus.VALIDATED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case RequestStatus.QUOTED: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case RequestStatus.REJECTED: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAgencyTag = (agencyId: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    const centre = agency ? centres.find(c => c.id === agency.centreId) : null;
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
          {centre?.name || '---'}
        </span>
        <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
          {agency?.name || 'Agence inconnue'}
        </span>
      </div>
    );
  };

  const filteredAndSortedRequests = useMemo(() => {
    let result = requests.filter(req => {
      const matchesSearch = 
        req.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === '' || req.status === statusFilter;
      
      const reqDate = new Date(req.createdAt).getTime();
      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (reqDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (reqDate > end) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'name-asc') {
        return a.clientName.localeCompare(b.clientName);
      }
      return 0;
    });

    return result;
  }, [requests, searchTerm, statusFilter, startDate, endDate, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setSortBy('date-desc');
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 mx-2 sm:mx-0">
      {/* Filters Bar */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none">Registre des Demandes</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Centralisation des dossiers d'agences</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black px-3 py-1 bg-blue-600 text-white rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">
              {filteredAndSortedRequests.length} Dossiers
            </span>
            {(searchTerm || statusFilter || startDate || endDate) && (
              <button 
                onClick={clearFilters}
                className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                Effacer filtres
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Recherche */}
          <div className="md:col-span-1 lg:col-span-2">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Recherche Rapide</label>
            <input 
              type="text"
              placeholder="Nom ou Réf..."
              className="w-full rounded-xl border-gray-200 bg-white p-2.5 text-[10px] font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">État du dossier</label>
            <select
              className="w-full rounded-xl border-gray-200 bg-white p-2.5 text-[10px] font-black uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | '')}
            >
              <option value="">Tous les statuts</option>
              {Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Tri */}
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ordre d'affichage</label>
            <select
              className="w-full rounded-xl border-gray-200 bg-white p-2.5 text-[10px] font-black uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="date-desc">Plus récents</option>
              <option value="date-asc">Plus anciens</option>
              <option value="name-asc">Nom (A-Z)</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="sm:col-span-2 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Du</label>
              <input 
                type="date"
                className="w-full rounded-xl border-gray-200 bg-white p-2.5 text-[10px] font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Au</label>
              <input 
                type="date"
                className="w-full rounded-xl border-gray-200 bg-white p-2.5 text-[10px] font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border transition-all"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto relative">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/30">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Réf / Agence</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Abonné</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Prestation</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filteredAndSortedRequests.map(req => (
              <tr key={req.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-black text-gray-900 tracking-tight">{req.id}</div>
                  {getAgencyTag(req.agencyId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-black text-gray-900">{req.clientName}</div>
                  <div className="text-[10px] text-gray-500 font-medium italic truncate max-w-[200px]">{req.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{req.serviceType}</div>
                  {req.serviceType === "Branchement d'eau potable" && req.branchementType && (
                    <div className="text-[9px] text-emerald-600 font-bold mt-1">
                      {req.branchementType === BranchementType.AUTRE && req.branchementDetails 
                        ? `${req.branchementType}: ${req.branchementDetails}` 
                        : req.branchementType}
                    </div>
                  )}
                  <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{new Date(req.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase border ${getStatusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end items-center gap-3">
                    {req.status !== RequestStatus.QUOTED && req.status !== RequestStatus.REJECTED && (
                      <button 
                        onClick={() => onCreateQuote(req)}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100/50 flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Établir Devis
                      </button>
                    )}
                    <button 
                      onClick={() => onEdit(req)} 
                      className="text-blue-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                      title="Modifier la demande"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <select
                      className="text-[9px] font-black uppercase bg-gray-50 border border-gray-100 rounded-xl p-2 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={req.status}
                      onChange={(e) => onUpdateStatus(req.id, e.target.value as RequestStatus)}
                    >
                      {Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button 
                      onClick={() => onDelete(req.id)} 
                      className="text-gray-200 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg"
                      title="Supprimer la demande"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAndSortedRequests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-black uppercase tracking-widest italic">Aucun dossier trouvé.</p>
                      <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">Ajustez vos filtres ou vérifiez la saisie.</p>
                    </div>
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
