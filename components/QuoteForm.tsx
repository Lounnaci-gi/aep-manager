
import React, { useState, useEffect, useRef } from 'react';
import { Quote, QuoteItem, QuoteStatus, WorkType, Client, CommercialAgency, Centre, ClientCategory } from '../types';
import { getAIRecommendation } from '../services/geminiService';
import { ArticleService } from '../services/articleService';

interface QuoteFormProps {
  onSave: (quote: Quote) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  clients: Client[];
  workTypes: WorkType[];
  agencies: CommercialAgency[];
  centres: Centre[];
  initialData?: Quote;
  currentUserAgencyId?: string;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ 
  onSave, 
  onDelete, 
  onCancel, 
  clients, 
  workTypes, 
  agencies,
  centres,
  initialData,
  currentUserAgencyId
}) => {
  const [formData, setFormData] = useState({
    category: initialData?.category || ClientCategory.PHYSICAL,
    civility: initialData?.civility || 'M.',
    businessName: initialData?.businessName || '',
    clientName: initialData?.clientName || '',
    idDocumentType: initialData?.idDocumentType || 'CNI',
    idDocumentNumber: initialData?.idDocumentNumber || '',
    idDocumentIssueDate: initialData?.idDocumentIssueDate || '',
    idDocumentIssuer: initialData?.idDocumentIssuer || '',
    clientEmail: initialData?.clientEmail || '',
    clientPhone: initialData?.clientPhone || '',
    address: initialData?.address || '',
    commune: initialData?.commune || '',
    installationAddress: initialData?.installationAddress || '',
    installationCommune: initialData?.installationCommune || '',
    serviceType: initialData?.serviceType || (workTypes.length > 0 ? workTypes[0].label : ''),
    description: initialData?.description || '',
    type: initialData?.type || 'Propriétaire',
    agencyId: initialData?.agencyId || currentUserAgencyId || (agencies.length > 0 ? agencies[0].id : ''),
  });

  const [items, setItems] = useState<QuoteItem[]>(
    initialData?.items && initialData.items.length > 0 
      ? initialData.items 
      : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]
  );

  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRec, setAiRec] = useState(initialData?.aiNotes || '');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [showArticleDropdown, setShowArticleDropdown] = useState<{[key: number]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState<{[key: number]: string}>({});

  const isLegal = formData.category === ClientCategory.LEGAL;

  // Charger les articles disponibles
  useEffect(() => {
    const loadArticles = async () => {
      try {
        const loadedArticles = await ArticleService.getArticles();
        setArticles(loadedArticles);
      } catch (error) {
        console.error('Erreur chargement articles:', error);
      }
    };
    loadArticles();
  }, []);

  // Fonction pour filtrer les articles basés sur la recherche
  const filterArticles = (term: string, index: number) => {
    if (!term) {
      setFilteredArticles([]);
      setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
      return;
    }

    const filtered = articles.filter(article => 
      article.name.toLowerCase().includes(term.toLowerCase()) ||
      article.description.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredArticles(filtered);
    setShowArticleDropdown(prev => ({ ...prev, [index]: filtered.length > 0 }));
  };

  // Gérer la sélection d'un article
  const handleArticleSelect = (article: any, index: number) => {
    const newItems = [...items];
    newItems[index].description = article.name;
    newItems[index].unitPrice = article.prices[0]?.price || 0;
    setItems(newItems);
    setSearchTerm(prev => ({ ...prev, [index]: article.name }));
    setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
  };

  useEffect(() => {
    if (!initialData && workTypes.length > 0 && !formData.serviceType) {
      setFormData(prev => ({ ...prev, serviceType: workTypes[0].label }));
    }
  }, [workTypes, initialData]);

  const handleSelectClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setFormData({
        ...formData,
        category: selected.category,
        civility: selected.civility || 'M.',
        businessName: selected.businessName || '',
        clientName: selected.name,
        idDocumentType: selected.idDocumentType || 'CNI',
        idDocumentNumber: selected.idDocumentNumber || '',
        idDocumentIssueDate: selected.idDocumentIssueDate || '',
        idDocumentIssuer: selected.idDocumentIssuer || '',
        clientEmail: selected.email,
        clientPhone: selected.phone,
        address: selected.address,
        commune: selected.commune,
        installationAddress: selected.installationAddress || selected.address,
        installationCommune: selected.installationCommune || selected.commune,
        type: selected.type || 'Propriétaire',
      });
    }
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    (item as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = (item.quantity || 0) * (item.unitPrice || 0);
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const tax = subtotal * 0.19; 
  const total = subtotal + tax;

  const handleConsultAI = async () => {
    setLoadingAI(true);
    const rec = await getAIRecommendation({
      serviceType: formData.serviceType,
      clientName: isLegal ? formData.businessName : formData.clientName,
      description: formData.description,
      total: total
    });
    setAiRec(rec);
    setLoadingAI(false);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const quoteData: Quote = {
      id: initialData?.id || `AEP-${Date.now().toString().slice(-6)}`,
      ...formData,
      items,
      subtotal,
      tax,
      total,
      status: initialData?.status || QuoteStatus.PENDING,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      aiNotes: aiRec
    };
    onSave(quoteData);
  };

  const { agency: activeAgency, centre: activeCentre } = (function() {
    const agency = agencies.find(a => a.id === formData.agencyId);
    const centre = agency ? centres.find(c => c.id === agency.centreId) : null;
    return { agency, centre };
  })();

  const isEditMode = !!initialData;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-4xl mx-auto mb-10 animate-in fade-in duration-300">
        <div className="flex justify-between items-center border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              {isEditMode ? `Modifier Dossier ${initialData.id}` : 'Nouveau Dossier AEP'}
            </h2>
            <p className="text-sm text-gray-500 font-medium">Capture juridique et financière.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 text-[10px] font-black text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 uppercase tracking-widest">Annuler</button>
            <button type="button" onClick={() => setIsPreviewOpen(true)} className="px-5 py-2.5 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 uppercase tracking-widest">Aperçu PDF</button>
            <button type="submit" className="px-6 py-2.5 text-[10px] font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xl uppercase tracking-widest">Valider</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <h3 className="text-[10px] font-black text-blue-600 border-l-4 border-blue-600 pl-3 uppercase tracking-widest">Abonné & Identification</h3>
            
            {!isEditMode && (
              <select className="w-full rounded-xl border-gray-200 bg-gray-50/50 p-3 text-sm font-bold border" onChange={handleSelectClient}>
                <option value="">-- Saisie Manuelle --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.category === ClientCategory.LEGAL ? `[E] ${c.businessName}` : `[I] ${c.name}`}</option>)}
              </select>
            )}

            <div className="bg-gray-50/30 p-4 rounded-2xl border border-gray-100 space-y-4">
              {isLegal && (
                <input required type="text" placeholder="Raison Sociale" className="w-full rounded-xl border-gray-200 p-3 text-sm font-black border bg-white" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
              )}
              <div className="grid grid-cols-4 gap-2">
                {!isLegal && (
                  <select className="col-span-1 rounded-xl border-gray-200 p-2.5 text-xs font-black border bg-white" value={formData.civility} onChange={e => setFormData({ ...formData, civility: e.target.value })}>
                    <option value="M.">M.</option>
                    <option value="Mme">Mme</option>
                  </select>
                )}
                <input required type="text" placeholder="Nom Complet" className={`${isLegal ? 'col-span-4' : 'col-span-3'} rounded-xl border-gray-200 p-2.5 text-sm font-black border bg-white`} value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} />
              </div>
              
              {!isLegal && (
                <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-2 shadow-inner">
                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">Pièce : {formData.idDocumentType}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input required type="text" placeholder="N° Pièce" className="w-full border-none p-0 text-[10px] font-black bg-transparent" value={formData.idDocumentNumber} onChange={e => setFormData({ ...formData, idDocumentNumber: e.target.value })} />
                    <input required type="date" className="w-full border-none p-0 text-[10px] font-black bg-transparent text-right" value={formData.idDocumentIssueDate} onChange={e => setFormData({ ...formData, idDocumentIssueDate: e.target.value })} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[9px] font-black text-emerald-600 uppercase mb-1 ml-1">Qualité de l'abonné</label>
                <select className="w-full rounded-xl border-emerald-200 p-2.5 text-xs font-black border bg-white" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                  <option value="Propriétaire">Propriétaire</option>
                  <option value="Locataire">Locataire</option>
                  <option value="Mandataire">Mandataire</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Commune Domicile" type="text" className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border" value={formData.commune} onChange={e => setFormData({ ...formData, commune: e.target.value })} />
              <input required placeholder="Téléphone" type="tel" className="w-full rounded-xl border-gray-200 p-3 text-sm font-black border" value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value })} />
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-[10px] font-black text-amber-600 border-l-4 border-amber-600 pl-3 uppercase tracking-widest">Site Technique</h3>
            <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100 space-y-4">
              <input required type="text" placeholder="Adresse précise du site" className="w-full rounded-xl border-amber-200 p-3 text-sm font-bold bg-white shadow-sm" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
              <input required type="text" placeholder="Commune du site" className="w-full rounded-xl border-amber-200 p-3 text-sm font-black bg-white shadow-sm" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
              <select className="w-full rounded-xl border-amber-200 p-3 text-xs font-black bg-white" value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })}>
                {workTypes.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-blue-600 border-l-4 border-blue-600 pl-3 uppercase tracking-widest">Détails Financiers</h3>
            <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])} className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full uppercase border border-blue-100">+ Ligne</button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <tr><th className="px-4 py-3 text-left">Désignation</th><th className="px-4 py-3 text-center w-20">Qté</th><th className="px-4 py-3 text-right w-32">P.U HT</th><th className="px-4 py-3 text-right w-32">Total</th><th className="w-10"></th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2 relative">
                      <input 
                        type="text" 
                        className="w-full border-none p-2 text-xs font-bold bg-transparent relative z-20" 
                        value={searchTerm[index] || item.description} 
                        onChange={e => {
                          const value = e.target.value;
                          setSearchTerm(prev => ({ ...prev, [index]: value }));
                          updateItem(index, 'description', value);
                          filterArticles(value, index);
                        }}
                        onFocus={() => {
                          if (searchTerm[index] && searchTerm[index].length > 0) {
                            filterArticles(searchTerm[index], index);
                          }
                        }}
                        onBlur={() => setTimeout(() => {
                          setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
                        }, 200)}
                      />
                      {showArticleDropdown[index] && filteredArticles.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredArticles.map((article, idx) => (
                            <div 
                              key={idx}
                              className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                              onMouseDown={() => handleArticleSelect(article, index)}
                            >
                              <span className="text-xs font-bold">{article.name}</span>
                              <span className="text-[8px] text-gray-500">{article.prices[0]?.price || 0} DA</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center"><input type="number" className="w-16 border-none text-xs font-bold text-center bg-transparent" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                    <td className="px-2 py-2 text-right"><input type="number" className="w-28 border-none text-xs font-bold text-right bg-transparent" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} /></td>
                    <td className="px-4 py-2 text-xs font-black text-right">{item.total.toLocaleString()} DA</td>
                    <td className="px-2 py-2 text-right">{items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="text-gray-300 hover:text-red-500">×</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-50">
          <div className="space-y-4">
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Expertise IA</span>
               <button type="button" onClick={handleConsultAI} disabled={loadingAI} className="text-[8px] font-black bg-blue-600 text-white px-2 py-1 rounded-full uppercase">{loadingAI ? 'Analyse...' : 'Relancer'}</button>
             </div>
             <div className="bg-slate-900 text-blue-100 p-4 rounded-2xl text-[10px] italic border-l-4 border-blue-500">{aiRec || "Recommandations hydrauliques SEAAL/ADE..."}</div>
          </div>
          <div className="bg-gray-900 text-white p-6 rounded-3xl space-y-3">
             <div className="flex justify-between text-[10px] opacity-60 uppercase"><span>Total HT</span><span>{formatCurrency(subtotal)}</span></div>
             <div className="flex justify-between text-[10px] opacity-60 uppercase"><span>TVA (19%)</span><span>{formatCurrency(tax)}</span></div>
             <div className="flex justify-between text-2xl font-black border-t border-white/10 pt-4 mt-4 uppercase tracking-tighter"><span>Total TTC</span><span className="text-blue-400">{formatCurrency(total)}</span></div>
          </div>
        </div>
      </form>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 my-8">
            <div className="flex justify-between items-center px-10 py-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900 uppercase">Aperçu Devis Officiel</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="text-gray-400 hover:text-gray-900"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="p-16 space-y-12 bg-white">
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8">
                <div>
                  <div className="text-3xl font-black text-blue-600 tracking-tighter mb-2 uppercase">AEP MANAGER</div>
                  <div className="text-[10px] font-black text-gray-400 uppercase space-y-1">
                    <p>{activeCentre?.name}</p>
                    <p>{activeAgency?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter mb-2">DEVIS</h1>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Émis le : {new Date().toLocaleDateString('fr-DZ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-16">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">IDENTITÉ ABONNÉ</h4>
                    {isLegal && <p className="text-xl font-black text-gray-900 uppercase mb-1">{formData.businessName}</p>}
                    <p className={`${isLegal ? 'text-xs text-gray-500 font-bold' : 'text-xl font-black text-gray-900 uppercase'}`}>{formData.civility} {formData.clientName}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1 uppercase">{formData.address}, {formData.commune}</p>
                    
                    {!isLegal && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pièce d'Identité : {formData.idDocumentType}</p>
                        <p className="text-[10px] font-black text-gray-800">N° {formData.idDocumentNumber}</p>
                        <p className="text-[9px] font-bold text-gray-500 mt-1">Délivrée le {formData.idDocumentIssueDate} par {formData.idDocumentIssuer}</p>
                      </div>
                    )}

                    <div className="inline-block px-3 py-1 mt-4 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full uppercase tracking-widest">QUALITÉ : {formData.type}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">SITE DES TRAVAUX</h4>
                    <p className="text-xs font-black text-gray-900 uppercase">LIEU : {formData.installationAddress}</p>
                    <p className="text-xs font-black text-gray-900 uppercase">COMMUNE : {formData.installationCommune}</p>
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-[10px] font-black text-amber-800 uppercase leading-tight">{formData.serviceType}</p>
                    </div>
                  </div>
                </div>
              </div>

              <table className="w-full border-collapse">
                <thead><tr className="border-b-2 border-gray-900 text-[10px] font-black text-gray-900 uppercase tracking-widest"><th className="py-4 text-left">Désignation</th><th className="py-4 px-4 text-center w-20">Qté</th><th className="py-4 text-right">P.U HT</th><th className="py-4 text-right">Total HT</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr key={i}><td className="py-4 text-sm font-bold uppercase text-gray-800">{item.description}</td><td className="py-4 px-4 text-sm text-center font-bold">{item.quantity}</td><td className="py-4 text-sm text-right">{item.unitPrice.toLocaleString()}</td><td className="py-4 text-sm font-black text-right">{item.total.toLocaleString()} DA</td></tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-end gap-12">
                <div className="flex-1 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">DOMICILIATION BANCAIRE</h4>
                  <p className="text-[10px] font-black text-gray-900 uppercase mb-2">{activeCentre?.bankName}</p>
                  <p className="text-sm font-mono font-black text-blue-700 tracking-wider break-all">{activeCentre?.bankAccount}</p>
                </div>
                <div className="w-80 bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-4">
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase"><span>TOTAL HT</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase"><span>TVA (19%)</span><span>{formatCurrency(tax)}</span></div>
                  <div className="flex flex-col gap-1 pt-6 border-t-2 border-blue-600 mt-2">
                    <span className="font-black text-blue-400 uppercase text-[10px]">NET À PAYER TTC</span>
                    <span className="font-black text-4xl text-white tracking-tighter">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
              <button onClick={() => setIsPreviewOpen(false)} className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-200 rounded-xl">Fermer</button>
              <button onClick={() => { setIsPreviewOpen(false); handleSubmit(); }} className="px-10 py-3 text-[11px] font-black text-white bg-blue-600 rounded-xl uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">Valider & Archiver</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
