
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Quote, QuoteStatus, WorkType, WorkRequest, RequestStatus } from '../types';

interface DashboardProps {
  quotes: Quote[];
  requests: WorkRequest[];
  workTypes: WorkType[];
}

export const Dashboard: React.FC<DashboardProps> = ({ quotes, requests, workTypes }) => {
  const stats = {
    totalRequests: requests.length,
    totalQuotes: quotes.length,
    revenue: quotes
      .filter(q => q.status === QuoteStatus.APPROVED || q.status === QuoteStatus.PAID)
      .reduce((acc, curr) => acc + curr.total, 0),
    conversionRate: requests.length ? Math.round((quotes.length / requests.length) * 100) : 0,
    pendingQuotes: quotes.filter(q => q.status === QuoteStatus.PENDING).length
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 });
  };

  const dataStatus = [
    { name: 'En attente', value: quotes.filter(q => q.status === QuoteStatus.PENDING).length, color: '#FBBF24' },
    { name: 'Approuvé', value: quotes.filter(q => q.status === QuoteStatus.APPROVED).length, color: '#10B981' },
    { name: 'Payé', value: quotes.filter(q => q.status === QuoteStatus.PAID).length, color: '#6366F1' },
    { name: 'Rejeté', value: quotes.filter(q => q.status === QuoteStatus.REJECTED).length, color: '#EF4444' },
  ];

  const dataRevenueByType = workTypes.map(type => ({
    name: type.label.length > 20 ? type.label.substring(0, 17) + '...' : type.label,
    revenue: quotes
      .filter(q => q.serviceType === type.label && (q.status === QuoteStatus.APPROVED || q.status === QuoteStatus.PAID))
      .reduce((acc, curr) => acc + curr.total, 0)
  })).filter(d => d.revenue > 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header Overview with DB Sync Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter">Tableau de Bord</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Synchronisation Locale : Active (Sim Cluster0)</p>
          </div>
        </div>
        <div className="bg-blue-600 px-6 py-3 rounded-2xl shadow-xl shadow-blue-200">
          <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest leading-none mb-1">C.A Validé</p>
          <p className="text-2xl font-black text-white leading-none">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-600 transition-colors">
              <svg className="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Demandes</span>
          </div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{stats.totalRequests}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">Total dossiers ADE</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 rounded-2xl group-hover:bg-rose-600 transition-colors">
              <svg className="w-6 h-6 text-rose-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">En Attente</span>
          </div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{stats.pendingQuotes}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">Devis en cours</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-500 transition-colors">
              <svg className="w-6 h-6 text-emerald-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Performance</span>
          </div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{stats.conversionRate}%</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">Taux de concrétisation</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 transition-colors">
              <svg className="w-6 h-6 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Archivés</span>
          </div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{stats.totalQuotes}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">Base historique</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Portefeuille Statuts</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tight">Répartition en temps réel des dossiers</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {dataStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '16px', fontSize: '10px', color: '#fff', fontWeight: '900' }} itemStyle={{ color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
          <div className="mb-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Poids Financier / Prestation</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tight">Volume d'affaires généré par type de travaux</p>
          </div>
          <div className="h-72 w-full">
            {dataRevenueByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataRevenueByType}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900', fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900', fill: '#9CA3AF' }} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '16px', fontSize: '10px', color: '#fff', fontWeight: '900' }} formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] italic">Aucun flux financier en attente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
