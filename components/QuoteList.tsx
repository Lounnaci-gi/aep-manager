
import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Quote, QuoteStatus, Centre, CommercialAgency, WorkType } from '../types';

interface QuoteListProps {
  quotes: Quote[];
  centres: Centre[];
  agencies: CommercialAgency[];
  workTypes: WorkType[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
  onEdit: (quote: Quote) => void;
}

type SortDirection = 'asc' | 'desc' | 'none';

export const QuoteList: React.FC<QuoteListProps> = ({ quotes, centres, agencies, workTypes, onDelete, onUpdateStatus, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [statusSortOrder, setStatusSortOrder] = useState<SortDirection>('none');

  const getStatusColor = (status: QuoteStatus, isExpired: boolean) => {
    if (status === QuoteStatus.PENDING && isExpired) {
      return 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm shadow-rose-100';
    }
    switch (status) {
      case QuoteStatus.PENDING: return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case QuoteStatus.APPROVED: return 'bg-green-50 text-green-800 border-green-200';
      case QuoteStatus.REJECTED: return 'bg-red-50 text-red-800 border-red-200';
      case QuoteStatus.PAID: return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const checkIsExpired = (createdAt: string, status: QuoteStatus) => {
    if (status !== QuoteStatus.PENDING) return false;
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 });
  };

  const filteredAgencies = useMemo(() => {
    if (!selectedCentreId) return agencies;
    return agencies.filter(a => a.centreId === selectedCentreId);
  }, [agencies, selectedCentreId]);

  const filteredAndSortedQuotes = useMemo(() => {
    let result = quotes.filter(q => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        q.clientName.toLowerCase().includes(term) || 
        q.id.toLowerCase().includes(term);

      const quoteDate = new Date(q.createdAt).setHours(0, 0, 0, 0);
      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (quoteDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (quoteDate > end) matchesDate = false;
      }

      let matchesStructure = true;
      if (selectedAgencyId) {
        if (q.agencyId !== selectedAgencyId) matchesStructure = false;
      } else if (selectedCentreId) {
        const quoteAgency = agencies.find(a => a.id === q.agencyId);
        if (!quoteAgency || quoteAgency.centreId !== selectedCentreId) matchesStructure = false;
      }

      let matchesWorkType = true;
      if (selectedWorkType && q.serviceType !== selectedWorkType) {
        matchesWorkType = false;
      }

      return matchesSearch && matchesDate && matchesStructure && matchesWorkType;
    });

    if (statusSortOrder !== 'none') {
      result.sort((a, b) => {
        const statusA = a.status.toString();
        const statusB = b.status.toString();
        return statusSortOrder === 'asc' ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
      });
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [quotes, searchTerm, startDate, endDate, selectedCentreId, selectedAgencyId, selectedWorkType, agencies, statusSortOrder]);

  return (
    <div className="bg-white shadow-xl rounded-2xl md:rounded-[2rem] overflow-hidden border border-gray-100 mx-2 sm:mx-0">
      <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Gestion des Dossiers Travaux</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Surveillance des délais d'attente (30 jours max)</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            className="rounded-xl border-gray-200 p-2.5 text-[10px] font-black uppercase tracking-widest bg-white border"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="rounded-xl border-gray-200 p-2.5 text-[10px] font-black uppercase bg-white border"
            value={selectedCentreId}
            onChange={(e) => { setSelectedCentreId(e.target.value); setSelectedAgencyId(''); }}
          >
            <option value="">Tous les centres</option>
            {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className="rounded-xl border-gray-200 p-2.5 text-[10px] font-black uppercase bg-white border disabled:opacity-50"
            value={selectedAgencyId}
            onChange={(e) => setSelectedAgencyId(e.target.value)}
            disabled={!selectedCentreId}
          >
            <option value="">Toutes les agences</option>
            {filteredAgencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCentreId(''); setSelectedAgencyId(''); }}
            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-500"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/30">
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Réf / Date</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client / Prestation</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant TTC</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filteredAndSortedQuotes.map((quote) => {
              const expired = checkIsExpired(quote.createdAt, quote.status);
              
              return (
                <tr key={quote.id} className={`hover:bg-blue-50/30 transition-colors group ${expired ? 'bg-rose-50/10' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-black text-blue-600 tracking-tight">{quote.id}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-black text-gray-900 leading-none">{quote.clientName}</div>
                    <div className="text-[10px] text-blue-400 uppercase font-black tracking-tighter mt-1">{quote.serviceType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-black">
                    {formatCurrency(quote.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 inline-flex text-[10px] font-black rounded-full uppercase tracking-tighter border-2 ${getStatusColor(quote.status, expired)}`}>
                        {quote.status}
                      </span>
                      {expired && (
                        <div className="flex items-center gap-1 group/expired relative cursor-help" title="Dépassement du délai de 30 jours">
                          <div className="w-5 h-5 text-rose-600 animate-pulse bg-rose-100 rounded-full flex items-center justify-center p-1 border border-rose-200 shadow-sm shadow-rose-200">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/expired:opacity-100 transition-opacity bg-rose-600 text-white text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest whitespace-nowrap z-10 shadow-xl pointer-events-none">
                            Relance requise (+30j)
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center gap-3">
                      <button onClick={() => onEdit(quote)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <select
                        className="text-[10px] font-black uppercase bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 focus:ring-2 focus:ring-blue-500/20"
                        value={quote.status}
                        onChange={(e) => onUpdateStatus(quote.id, e.target.value as QuoteStatus)}
                      >
                        {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => onDelete(quote.id)} className="text-gray-200 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAndSortedQuotes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <p className="text-sm text-gray-300 font-black uppercase tracking-widest italic">Aucun dossier trouvé dans cette sélection.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
