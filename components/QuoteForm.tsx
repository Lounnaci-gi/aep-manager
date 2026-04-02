
import React, { useState, useEffect, useRef } from 'react';
import { Quote, QuoteItem, QuoteStatus, WorkType, Client, CommercialAgency, Centre, ClientCategory } from '../types';
import { getAIRecommendation } from '../services/geminiService';
import { numberToFrenchLetters } from '../utils/numberToLetters';
import { ArticleService } from '../services/articleService';
import Swal from 'sweetalert2';

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
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
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
    // Vérifier si l'article est déjà dans le devis
    const isAlreadyAdded = items.some(item => item.description === article.name);
    if (isAlreadyAdded) {
      Swal.fire({
        title: 'Article déjà ajouté',
        text: `L'article "${article.name}" est déjà présent dans ce devis.`,
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      setSearchTerm(prev => ({ ...prev, [index]: '' }));
      setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
      return;
    }
    
    const newItems = [...items];
    newItems[index].description = article.name;
    
    // Filtrer les prix non nuls
    const validPrices = article.prices.filter((price: any) => price.price > 0);
    
    // Vérifier si on a à la fois pose et fourniture
    const fourniturePrice = article.prices.find((p: any) => p.type === 'fourniture' && p.price > 0);
    const posePrice = article.prices.find((p: any) => p.type === 'pose' && p.price > 0);
    const hasBothFournitureAndPose = fourniturePrice && posePrice;
    
    if (validPrices.length === 0) {
      // Aucun prix valide
      newItems[index].unitPrice = 0;
      setItems(newItems);
      setSearchTerm(prev => ({ ...prev, [index]: article.name }));
      setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
    } else if (validPrices.length === 1) {
      // Un seul prix valide, l'utiliser directement
      newItems[index].unitPrice = validPrices[0].price;
      // Ajouter l'indicateur de type de prix
      newItems[index].priceTypeIndicator = validPrices[0].type === 'fourniture' ? 'F' : 
                                          validPrices[0].type === 'pose' ? 'P' : 'PS';
      setItems(newItems);
      setSearchTerm(prev => ({ ...prev, [index]: article.name }));
      setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
    } else {
      // Plusieurs prix valides, demander à l'utilisateur de choisir
      const options: Array<{id: string, value: string | number, label: string, price: number, type: string}> = [
        ...validPrices.map((price: any, i: number) => ({
          id: `price-${i}`,
          value: i,
          label: `${price.type === 'fourniture' ? 'Fourniture' : 
                  price.type === 'pose' ? 'Pose' : 'Prestation'}`,
          price: price.price,
          type: price.type
        }))
      ];
      
      // Ajouter l'option combinée si les deux prix existent
      if (hasBothFournitureAndPose) {
        options.push({
          id: 'combined',
          value: 'combined',
          label: 'Fourniture + Pose',
          price: fourniturePrice.price + posePrice.price,
          type: 'combined'
        });
      }
      
      Swal.fire({
        title: 'Choisir le type de prix',
        html: `
          <div class="text-left">
            <p class="mb-3">Sélectionnez le type de prix pour "${article.name}":</p>
            ${options.map((option, i) => `
              <div class="flex items-center mb-2">
                <input type="radio" id="${option.id}" name="priceType" value="${option.value}" 
                       class="mr-2" ${i === 0 ? 'checked' : ''}>
                <label for="${option.id}" class="flex-1">
                  <span class="font-medium">${option.label}</span>
                  <span class="ml-2 text-gray-600">(${option.price.toLocaleString()} DA)</span>
                </label>
              </div>
            `).join('')}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sélectionner',
        cancelButtonText: 'Annuler',
        preConfirm: () => {
          const selectedRadio = document.querySelector('input[name="priceType"]:checked') as HTMLInputElement;
          return selectedRadio ? selectedRadio.value : '0';
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const selectedValue = result.value;
          if (selectedValue === 'combined') {
            // Prix combiné
            newItems[index].unitPrice = fourniturePrice!.price + posePrice!.price;
            newItems[index].priceTypeIndicator = 'F/P';
          } else {
            // Prix individuel
            const selectedIndex = parseInt(selectedValue);
            const selectedPrice = validPrices[selectedIndex];
            newItems[index].unitPrice = selectedPrice.price;
            newItems[index].priceTypeIndicator = selectedPrice.type === 'fourniture' ? 'F' : 
                                               selectedPrice.type === 'pose' ? 'P' : 'PS';
          }
          setItems(newItems);
          setSearchTerm(prev => ({ ...prev, [index]: article.name }));
          setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
        }
      });
    }
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const result = await Swal.fire({
      title: 'Confirmer l\'enregistrement ?',
      text: "Voulez-vous vraiment enregistrer ce devis ?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, enregistrer',
      cancelButtonText: 'Non, annuler',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

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
    <div className="max-w-5xl mx-auto mb-10 w-full">
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner border border-slate-200/50">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase transition-all ${
              activeTab === 'form' 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Édition du Devis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase transition-all ${
              activeTab === 'preview' 
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Aperçu PDF
          </button>
        </div>
      </div>

      <div className={activeTab === 'form' ? 'block' : 'hidden'}>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-4xl mx-auto animate-in fade-in duration-300">
        <div className="flex justify-between items-center border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              {isEditMode ? `Modifier Dossier ${initialData.id}` : 'Nouveau Dossier AEP'}
            </h2>
            <p className="text-sm text-gray-500 font-medium">Capture juridique et financière.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 text-[10px] font-black text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 uppercase tracking-widest">Annuler</button>
            <button type="button" onClick={() => setActiveTab('preview')} className="px-5 py-2.5 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 uppercase tracking-widest">Aperçu PDF</button>
            <button type="submit" className="px-6 py-2.5 text-[10px] font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-xl uppercase tracking-widest">Valider</button>
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
                    <input required type="text" placeholder="N° Pièce" maxLength={18} className="w-full border-none p-0 text-[10px] font-black bg-transparent" value={formData.idDocumentNumber} onChange={e => setFormData({ ...formData, idDocumentNumber: e.target.value })} />
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
              <input required placeholder="Commune Domicile" type="text" maxLength={40} className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border" value={formData.commune} onChange={e => setFormData({ ...formData, commune: e.target.value })} />
              <input required placeholder="Téléphone" type="tel" maxLength={10} className="w-full rounded-xl border-gray-200 p-3 text-sm font-black border" value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value })} />
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-[10px] font-black text-amber-600 border-l-4 border-amber-600 pl-3 uppercase tracking-widest">Site Technique</h3>
            <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100 space-y-4">
              <input required type="text" placeholder="Adresse précise du site" maxLength={120} className="w-full rounded-xl border-amber-200 p-3 text-sm font-bold bg-white shadow-sm" value={formData.installationAddress} onChange={e => setFormData({ ...formData, installationAddress: e.target.value })} />
              <input required type="text" placeholder="Commune du site" maxLength={40} className="w-full rounded-xl border-amber-200 p-3 text-sm font-black bg-white shadow-sm" value={formData.installationCommune} onChange={e => setFormData({ ...formData, installationCommune: e.target.value })} />
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
                    <td className="px-2 py-2 text-right"><input type="number" className="w-28 border-none text-xs font-bold text-right bg-transparent" value={item.unitPrice.toFixed(2)} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} /></td>
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
          
          <div className="pt-6">
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98]">
              Enregistrer le Devis
            </button>
          </div>
        </div>
      </form>
      </div>

    <div className={activeTab === 'preview' ? 'block animate-in fade-in duration-500' : 'hidden'}>
      <div className="bg-white w-full max-w-[210mm] mx-auto shadow-2xl mb-8 border border-gray-300 print:shadow-none print:border-none p-[10mm] text-slate-900" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="text-center font-bold text-[11px] mb-2 uppercase">
          الجمهورية الجزائرية الديمقراطية الشعبية
        </div>

        <div className="flex flex-col items-center mb-6">
          <img src="/ade.png" alt="ADE" className="h-[84px] w-auto object-contain mb-2" />
          <div className="w-full flex justify-between items-center text-[11px]">
            <div className="font-bold text-left leading-tight w-1/3">
              Ministère des ressources en eau<br />
              E.P ALGERIENNE DES EAUX
            </div>
            <div className="w-1/3"></div>
            <div className="font-bold text-right leading-tight w-1/3" dir="rtl">
              وزارة المــــوارد المائيــــــة<br />
              الجزائريــــــة للميــــــــــاه
            </div>
          </div>
        </div>

        <div className="bg-gray-200 border border-gray-400 p-2 mb-6">
          <div className="flex justify-between font-bold text-[11px] mb-1">
            <span>Zone d'Alger</span>
            <span>Unité de {activeCentre?.name || 'Médéa'}</span>
          </div>
          <div className="text-[11px] text-center leading-relaxed font-medium">
            Siège social : {activeCentre?.address || 'Quartier KOTTITANE - BP136 - 26000 MEDEA'} . Tél {activeCentre?.phone || '025 74 13 35'} Fax {activeCentre?.fax || '025 74 13 43'}<br />
            R.C: {activeCentre?.prefix || '01B0017164'} &nbsp;&nbsp;&nbsp; I.F: 000116189029833 &nbsp;&nbsp;&nbsp; A.I: 26010890207
          </div>
        </div>

        <div className="flex justify-between mb-8">
          <div className="w-1/2 space-y-4">
            <div>
              <span className="font-bold text-[11px] border-b border-black inline-block pb-0.5">Centre de {activeCentre?.name || 'Berrouaghia'}</span>
            </div>
            <div>
              <h1 className="font-black text-[11px] border-b border-black inline-block pb-0.5">DEVIS QUANTITATIF ET ESTIMATIF</h1>
              <div className="text-[11px] font-bold mt-1">
                N°: {initialData?.id || `AEP-${Date.now().toString().slice(-6)}`} / {new Date().getFullYear()} du: {new Date().toLocaleDateString('fr-DZ')}
              </div>
            </div>
          </div>

          <div className="w-[80mm] border border-gray-400 p-4 min-h-[40mm] rounded-[30px]">
            <div className="font-bold text-[11px] mb-2 uppercase">DOIT A {isLegal ? formData.businessName : `${formData.civility} ${formData.clientName}`}</div>
            <div className="text-[11px] leading-relaxed uppercase">
              ADRESSE : {formData.installationAddress}<br />
              {formData.installationCommune}<br />
              {formData.clientPhone && `Tel : ${formData.clientPhone}`}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <span className="font-bold text-[11px] border-b border-black inline-block pb-0.5 uppercase">Objet: {formData.serviceType}</span>
        </div>

        <table className="w-full border-collapse border border-gray-400 mb-2 font-sans text-[11px]">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border border-gray-400 p-1.5 text-left">Désignation des travaux</th>
              <th className="border border-gray-400 p-1.5 text-center w-16">Unité</th>
              <th className="border border-gray-400 p-1.5 text-center w-16">Qtité</th>
              <th className="border border-gray-400 p-1.5 text-right w-24">P.U</th>
              <th className="border border-gray-400 p-1.5 text-right w-24">Montant</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className="border border-gray-400 px-2 py-1">{item.description}</td>
                <td className="border border-gray-400 px-2 py-1 text-center">U</td>
                <td className="border border-gray-400 px-2 py-1 text-center">{item.quantity}</td>
                <td className="border border-gray-400 px-2 py-1 text-right">{item.unitPrice.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                <td className="border border-gray-400 px-2 py-1 text-right">{item.total.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            <tr>
              <td rowSpan={3} className="border border-gray-400 p-1.5 text-left align-top leading-tight space-y-0.5">
                <p>Compte CCP N°: {activeCentre?.comptePostale || '007 99 999 0007742 862 16'}</p>
                <p>Compte BADR N°: {activeCentre?.bankAccount || '003 00 853 30000426300 75'}</p>
                <p>mode de paiement : versement bancaire</p>
              </td>
              <td colSpan={2} className="border border-gray-400 font-bold p-1 align-middle text-left">THT</td>
              <td colSpan={2} className="border border-gray-400 p-1 text-right align-middle">
                {subtotal.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-gray-400 font-bold p-1 align-middle text-left">TVA 19%</td>
              <td colSpan={2} className="border border-gray-400 p-1 text-right align-middle">
                {tax.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-gray-400 font-black p-1 align-middle text-left">TTC</td>
              <td colSpan={2} className="border border-gray-400 font-black p-1 text-right align-middle bg-gray-50 uppercase">
                {total.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 text-[11px] space-y-2">
          <p className="font-bold">La Somme De Ce Présent Devis Est Arrêtée À :</p>
          <p className="font-black tracking-tight capitalize">{numberToFrenchLetters(total).toLowerCase()} Dinars.</p>
          <p className="italic">Nb: ce devis est valable pour une durée de 01 mois</p>
        </div>

        <div className="mt-10 flex justify-end">
          <div className="text-center">
            <p className="font-bold text-[11px] border-b border-black inline-block pb-0.5 pointer-events-none">LE CHEF D'AGENCE COMMERCIALE</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-5 flex justify-end gap-3 print:hidden">
        <button type="button" onClick={() => setActiveTab('form')} className="px-6 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100">Retour à l'édition</button>
        <button type="button" onClick={async (e) => { 
          // Imprimer
          window.print();
        }} className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md">Imprimer</button>
        <button type="button" onClick={(e) => { setActiveTab('form'); handleSubmit(e as any); }} className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95">Valider & Archiver</button>
      </div>
    </div>
      </div>
  );
};
