import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Quote, QuoteItem, WorkRequest, Client, CommercialAgency, Centre, UserRole, QuoteStatus, Article } from '../types';
import { numberToFrenchLetters } from '../utils/numberToLetters';
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
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
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

    // Confirmation avant enregistrement
    const result = await Swal.fire({
      title: 'Confirmer l\'enregistrement ?',
      text: "Voulez-vous vraiment enregistrer ce devis de branchement ?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669', // emerald-600
      cancelButtonColor: '#64748b', // slate-500
      confirmButtonText: 'Oui, enregistrer',
      cancelButtonText: 'Non, annuler',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

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
    <div className="max-w-full mx-auto mb-10 w-full animate-in fade-in duration-300">
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
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-full mx-auto">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
          Établissement de Devis - Branchement d'Eau
        </h2>
        <p className="text-base text-gray-500 font-medium mt-2">
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
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Client
                </label>
                <p className="font-bold text-gray-900 text-lg">{formData.clientName}</p>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Qualité
                </label>
                <p className="font-bold text-gray-900 text-lg">{formData.type}</p>
              </div>
            </div>
            
            <div className="mt-5">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Adresse de branchement
              </label>
              <p className="font-bold text-gray-900 text-base">{formData.installationAddress}, {formData.installationCommune}</p>
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
                <label className="block text-xs font-black text-amber-600 uppercase tracking-widest mb-1.5">
                  Type de branchement
                </label>
                <p className="font-bold text-amber-900 text-lg">{formData.branchementType}</p>
              </div>
              <div>
                <label className="block text-xs font-black text-amber-600 uppercase tracking-widest mb-1.5">
                  Diamètre
                </label>
                <p className="font-bold text-amber-900 text-lg">{formData.diameter}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black text-amber-600 uppercase tracking-widest mb-1.5">
                Débit moyen horaire
              </label>
              <p className="font-bold text-amber-900 text-lg">{formData.flowRate}</p>
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
            <div key={index} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-lg relative">
              <div className="col-span-4 relative">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
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
                  className="w-full rounded-md border-gray-200 p-2 text-sm font-bold border bg-white relative z-20 shadow-sm"
                  placeholder="Description de l'article"
                  required
                />
                {showArticleDropdown[index] && filteredArticles.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredArticles.map((article, idx) => (
                      <div 
                        key={idx}
                        className="px-3 py-1.5 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        onMouseDown={() => handleArticleSelect(article, index)}
                      >
                        <span className="text-sm font-bold">{article.name}</span>
                        <span className="text-[10px] text-gray-500">{article.prices[0]?.price || 0} DA</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Qté
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border-gray-200 p-2 text-sm font-bold border bg-white shadow-sm"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Prix Unitaire (DZD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice.toFixed(2)}
                  onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border-gray-200 p-2 text-sm font-bold border bg-white shadow-sm"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Total
                </label>
                <div className="flex items-center gap-2 h-7 mt-0.5">
                  <p className="font-black text-emerald-600 flex-1 truncate text-xs">
                    {(item.quantity * item.unitPrice).toFixed(2)} DZD
                  </p>
                  {item.priceTypeIndicator && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] font-bold rounded-full">
                      {item.priceTypeIndicator}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="col-span-2 flex items-center justify-end gap-1 h-7 mt-0.5">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                    title="Supprimer cet article"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                {index === items.length - 1 && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-500 hover:text-blue-700 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                    title="Ajouter un article"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="font-black text-emerald-600 text-xl">{total.toFixed(2)} DZD</span>
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
                onClick={() => setActiveTab('preview')}
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
                N°: {request.id} / {new Date().getFullYear()} du: {new Date().toLocaleDateString('fr-DZ')}
              </div>
            </div>
          </div>

          <div className="w-[80mm] border border-gray-400 p-4 min-h-[40mm] rounded-[30px]">
            <div className="font-bold text-[11px] mb-2 uppercase">DOIT A {request.businessName || (`${request.civility} ${request.clientName}`)}</div>
            <div className="text-[11px] leading-relaxed uppercase">
              ADRESSE : {request.installationAddress}<br />
              {request.installationCommune}<br />
              {request.clientPhone && `Tel : ${request.clientPhone}`}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <span className="font-bold text-[11px] border-b border-black inline-block pb-0.5 uppercase">Objet: {request.serviceType}</span>
        </div>

        <table className="w-full border-collapse border border-gray-400 mb-0 font-sans text-[11px]">
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
                <td className="border border-gray-400 px-2 py-1 text-right">{(item.quantity * item.unitPrice).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
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