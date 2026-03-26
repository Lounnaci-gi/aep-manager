import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Quote, QuoteItem, WorkRequest, Client, CommercialAgency, Centre, UserRole, QuoteStatus, Article } from '../types';
import { ArticleService } from '../services/articleService';

interface BranchementQuoteFormProps {
  request: WorkRequest;
  clients: Client[];
  agencies: CommercialAgency[];
  centres: Centre[];
  currentUser: { role: UserRole; agencyId?: string };
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}

export const BranchementQuoteForm: React.FC<BranchementQuoteFormProps> = ({ 
  request,
  clients,
  agencies,
  centres,
  currentUser,
  onSave,
  onCancel
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [formData, setFormData] = useState({
    clientId: request.clientId || '',
    clientName: request.clientName || '',
    clientEmail: request.clientEmail || '',
    clientPhone: request.clientPhone || '',
    centreId: request.centreId || '',
    agencyId: request.agencyId || '',
    installationAddress: request.installationAddress || '',
    installationCommune: request.installationCommune || '',
    serviceType: request.serviceType || '',
    description: request.description || '',
    type: request.type || 'Propriétaire',
    category: request.category || undefined,
    civility: request.civility || '',
    businessName: request.businessName || '',
    idDocumentType: request.idDocumentType || '',
    idDocumentNumber: request.idDocumentNumber || '',
    idDocumentIssueDate: request.idDocumentIssueDate || '',
    idDocumentIssuer: request.idDocumentIssuer || '',
    address: request.address || '',
    commune: request.commune || '',
    branchementType: request.branchementType || undefined,
    branchementDetails: request.branchementDetails || '',
    diameter: request.diameter || '',
    flowRate: request.flowRate || '',
    correspondencePhone: request.correspondencePhone || '',
    correspondenceEmail: request.correspondenceEmail || '',
    installationPhone: request.installationPhone || '',
    installationEmail: request.installationEmail || '',
  });

  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unitPrice: 0 }
  ]);

  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [showArticleDropdown, setShowArticleDropdown] = useState<{[key: number]: boolean}>({});
  const [searchTerms, setSearchTerms] = useState<{[key: number]: string}>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [taxRate, setTaxRate] = useState(19); // 19% TVA

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoadingArticles(true);
    try {
      const data = await ArticleService.getArticles();
      setArticles(data);
      setAllArticles(data); // Stocker tous les articles pour la recherche
      
      // Si aucun article n'existe, charger les articles par défaut
      if (data.length === 0) {
        const defaultArticles = ArticleService.getDefaultBranchementArticles();
        setArticles(defaultArticles);
        setAllArticles(defaultArticles); // Stocker aussi les articles par défaut
        // Sauvegarder les articles par défaut
        for (const article of defaultArticles) {
          await ArticleService.saveArticle(article);
        }
      }
    } catch (error) {
      console.error('Erreur chargement articles:', error);
      // Charger les articles par défaut en cas d'erreur
      const defaultArticles = ArticleService.getDefaultBranchementArticles();
      setArticles(defaultArticles);
      setAllArticles(defaultArticles); // Stocker aussi les articles par défaut
    } finally {
      setLoadingArticles(false);
    }
  };

  // Fonction pour filtrer les articles basés sur la recherche
  const filterArticles = (term: string, index: number) => {
    if (!term) {
      setFilteredArticles([]);
      setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
      return;
    }

    const filtered = allArticles.filter(article => 
      article.name.toLowerCase().includes(term.toLowerCase()) ||
      article.description.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredArticles(filtered);
    setShowArticleDropdown(prev => ({ ...prev, [index]: filtered.length > 0 }));
  };

  // Gérer la sélection d'un article
  const handleArticleSelect = (article: Article, index: number) => {
    // Vérifier si l'article est déjà dans le devis
    const isAlreadyAdded = items.some(item => item.description === article.name);
    if (isAlreadyAdded) {
      Swal.fire({
        title: 'Article déjà ajouté',
        text: `L'article "${article.name}" est déjà présent dans ce devis.`,
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      setSearchTerms(prev => ({ ...prev, [index]: '' }));
      setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
      return;
    }
    
    const newItems = [...items];
    newItems[index].description = article.name;
    
    // Filtrer les prix non nuls
    const validPrices = article.prices.filter(price => price.price > 0);
    
    // Vérifier si on a à la fois pose et fourniture
    const fourniturePrice = article.prices.find(p => p.type === 'fourniture' && p.price > 0);
    const posePrice = article.prices.find(p => p.type === 'pose' && p.price > 0);
    const hasBothFournitureAndPose = fourniturePrice && posePrice;
    
    if (validPrices.length === 0) {
      // Aucun prix valide
      newItems[index].unitPrice = 0;
      setItems(newItems);
      setSearchTerms(prev => ({ ...prev, [index]: article.name }));
      setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
    } else if (validPrices.length === 1) {
      // Un seul prix valide, l'utiliser directement
      newItems[index].unitPrice = validPrices[0].price;
      // Ajouter l'indicateur de type de prix
      newItems[index].priceTypeIndicator = validPrices[0].type === 'fourniture' ? 'F' : 
                                          validPrices[0].type === 'pose' ? 'P' : 'PS';
      setItems(newItems);
      setSearchTerms(prev => ({ ...prev, [index]: article.name }));
      setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
    } else {
      // Plusieurs prix valides, demander à l'utilisateur de choisir
      const options: Array<{id: string, value: string | number, label: string, price: number, type: string}> = [
        ...validPrices.map((price, i) => ({
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
          setSearchTerms(prev => ({ ...prev, [index]: article.name }));
          setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
        }
      });
    }
  };

  // Calcul des totaux
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (items.some(item => !item.description || item.unitPrice <= 0)) {
      Swal.fire({
        title: 'Formulaire incomplet',
        text: 'Veuillez remplir tous les champs obligatoires',
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    const quote: Quote = {
      id: `DEV-${Date.now().toString().slice(-6)}`,
      requestId: request.id,
      clientId: formData.clientId,
      clientName: formData.clientName,
      centreId: formData.centreId,
      agencyId: formData.agencyId,
      address: formData.address,
      commune: formData.commune,
      installationAddress: formData.installationAddress,
      installationCommune: formData.installationCommune,
      serviceType: formData.serviceType,
      description: formData.description,
      type: formData.type as 'Proprietaire' | 'Locataire' | 'Mandataire',
      items: items.filter(item => item.description && item.unitPrice > 0),
      subtotal: subtotal,
      tax: tax,
      total: total,
      status: QuoteStatus.PENDING,
      category: formData.category,
      civility: formData.civility,
      businessName: formData.businessName,
      idDocumentType: formData.idDocumentType,
      idDocumentNumber: formData.idDocumentNumber,
      idDocumentIssueDate: formData.idDocumentIssueDate,
      idDocumentIssuer: formData.idDocumentIssuer,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      createdAt: new Date().toISOString()
    };

    onSave(quote);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount);
  };
  const activeCentre = centres.find(c => c.id === formData.centreId);
  const activeAgency = agencies.find(a => a.id === formData.agencyId);

  return (
    <>
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-6xl mx-auto">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
          Établissement de Devis - Branchement d'Eau
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-2">
          Devis pour la demande n°{request.id} - {request.clientName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informations Client */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-3">
            Informations Client
          </h3>
          
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Client
                </label>
                <p className="font-bold text-gray-900">{formData.clientName}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Qualité
                </label>
                <p className="font-bold text-gray-900">{formData.type}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Adresse de branchement
              </label>
              <p className="font-bold text-gray-900">{formData.installationAddress}, {formData.installationCommune}</p>
            </div>
          </div>
        </div>

        {/* Informations Techniques */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-amber-600 uppercase tracking-widest border-l-4 border-amber-600 pl-3">
            Caractéristiques Techniques
          </h3>
          
          <div className="bg-amber-50 p-4 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                  Type de branchement
                </label>
                <p className="font-bold text-amber-900">{formData.branchementType}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                  Diamètre
                </label>
                <p className="font-bold text-amber-900">{formData.diameter}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                Débit moyen horaire
              </label>
              <p className="font-bold text-amber-900">{formData.flowRate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Détails du Devis */}
      <div className="mt-10">
        <h3 className="text-lg font-black text-emerald-600 uppercase tracking-widest border-l-4 border-emerald-600 pl-3 mb-6">
          Détails du Devis
        </h3>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl relative">
              <div className="col-span-4 relative">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={searchTerms[index] || item.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerms(prev => ({ ...prev, [index]: value }));
                    handleItemChange(index, 'description', value);
                    filterArticles(value, index);
                  }}
                  onFocus={() => {
                    if (searchTerms[index] && searchTerms[index].length > 0) {
                      filterArticles(searchTerms[index], index);
                    }
                  }}
                  onBlur={() => setTimeout(() => {
                    setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
                  }, 200)}
                  className="w-full rounded-lg border-gray-200 p-2 text-sm font-bold border bg-white relative z-20"
                  placeholder="Description de l'article"
                  required
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
              </div>
              
              <div className="col-span-2">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Qté
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border-gray-200 p-2 text-sm font-bold border bg-white"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Prix Unitaire (DZD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice.toFixed(2)}
                  onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border-gray-200 p-2 text-sm font-bold border bg-white"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Total
                </label>
                <div className="flex items-center gap-2 h-10">
                  <p className="font-black text-emerald-600 flex-1 truncate">
                    {(item.quantity * item.unitPrice).toFixed(2)} DZD
                  </p>
                  {item.priceTypeIndicator && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded-full">
                      {item.priceTypeIndicator}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="col-span-2 flex items-center justify-end gap-1 h-10">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Supprimer cet article"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                {index === items.length - 1 && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Ajouter un article"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Add item button is now inline with rows */}
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="mt-10 bg-gray-50 p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm mb-4">
              Récapitulatif
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sous-total:</span>
                <span className="font-bold">{subtotal.toFixed(2)} DZD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TVA ({taxRate}%):</span>
                <span className="font-bold">{tax.toFixed(2)} DZD</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="font-black text-gray-900">TOTAL:</span>
                <span className="font-black text-emerald-600 text-lg">{total.toFixed(2)} DZD</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm mb-4">
              Actions
            </h4>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all shadow-sm"
              >
                Aperçu PDF
              </button>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                Enregistrer le Devis
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-300 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>

    {/* Modal Aperçu PDF */}
    {isPreviewOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
          <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Aperçu Devis Officiel - Branchement</h3>
            <button type="button" onClick={() => setIsPreviewOpen(false)} className="p-2 text-slate-400 hover:text-slate-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-12 md:p-16 space-y-12 bg-white text-left">
            <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-800 pb-8 gap-6">
              <div className="flex items-center gap-4">
                <img src="/ade.png" alt="ADE Logo" className="h-16 md:h-20 w-auto object-contain" />
                <div>
                  <div className="text-3xl font-black text-emerald-600 tracking-tighter mb-2 uppercase">ADE MANAGER - BRANCHEMENT</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase space-y-1">
                    <p>{activeCentre?.name}</p>
                    <p>{activeAgency?.name}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-5xl font-black text-slate-800 uppercase tracking-tighter mb-2">DEVIS</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demande n° {request.id}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Émis le : {new Date().toLocaleDateString('fr-DZ')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">IDENTITÉ ABONNÉ</h4>
                  <p className="text-lg font-black text-slate-800 uppercase mb-1">{formData.clientName}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase pt-1">Qualité: {formData.type}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase pt-1">{formData.address}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">SITE TECHNIQUE</h4>
                  <p className="text-xs font-bold text-slate-800 uppercase">LIEU : {formData.installationAddress}</p>
                  <p className="text-xs font-bold text-slate-800 uppercase">COMMUNE : {formData.installationCommune}</p>
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex justify-between gap-2">
                    <p className="text-[10px] font-black text-amber-800 uppercase">Type: {formData.branchementType}</p>
                    <p className="text-[10px] font-black text-amber-800 uppercase">Ø {formData.diameter}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="py-3 px-4 text-left">Désignation</th>
                    <th className="py-3 px-4 text-center w-20">Qté</th>
                    <th className="py-3 px-4 text-right w-24">P.U HT</th>
                    <th className="py-3 px-4 text-right w-32">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, i) => (
                    <tr key={i} className="bg-white">
                      <td className="py-3 px-4 text-sm font-semibold text-slate-700">
                        {item.description}
                        {item.priceTypeIndicator && <span className="ml-2 px-1 text-[8px] border text-slate-400 border-slate-200 rounded">{item.priceTypeIndicator}</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-center font-bold text-slate-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-600">{item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-800 text-right">{(item.quantity * item.unitPrice).toFixed(2)} DA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="flex-1 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">DOMICILIATION BANCAIRE</h4>
                <p className="text-[10px] font-bold text-slate-800 uppercase mb-1">{activeCentre?.bankName || 'AEP MANAGER BANK'}</p>
                <p className="text-sm font-mono font-bold text-slate-600 break-all">{activeCentre?.bankAccount || '002 0000000000000'}</p>
              </div>
              <div className="w-full md:w-80 bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"><span>Sous-Total HT</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-4"><span>TVA ({taxRate}%)</span><span>{formatCurrency(tax)}</span></div>
                <div className="pt-4 border-t border-slate-700">
                  <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">NET À PAYER TTC</span>
                  <span className="block text-2xl font-black text-white">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-[2.5rem]">
            <button type="button" onClick={() => setIsPreviewOpen(false)} className="px-6 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100">Fermer</button>
            <button type="button" onClick={(e) => { setIsPreviewOpen(false); handleSubmit(e as any); }} className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95">Valider & Archiver</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};