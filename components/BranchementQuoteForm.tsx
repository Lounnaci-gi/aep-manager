import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Quote, QuoteItem, WorkRequest, Client, CommercialAgency, Centre, UserRole, QuoteStatus, Article, Unit, User, WorkType } from '../types';
import { numberToFrenchLetters } from '../utils/numberToLetters';
import { ArticleService } from '../services/articleService';
import { PermissionService } from '../services/permissionService';

interface BranchementQuoteFormProps {
  request: WorkRequest;
  clients: Client[];
  agencies: CommercialAgency[];
  centres: Centre[];
  units: Unit[];
  quotes: Quote[];
  currentUser: { role: UserRole; agencyId?: string; id: string };
  users: User[];
  workTypes: WorkType[];
  onSave: (quote: Quote) => void;
  onCancel: () => void;
  existingQuote?: Quote;
}

export const BranchementQuoteForm: React.FC<BranchementQuoteFormProps> = ({ 
  request,
  clients,
  agencies,
  centres,
  units,
  quotes,
  users,
  workTypes,
  currentUser,
  onSave,
  onCancel,
  existingQuote
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [formData, setFormData] = useState({
    requestId: existingQuote?.requestId || request.id || '',
    clientId: existingQuote?.clientId || request.clientId || '',
    clientName: existingQuote?.clientName || request.clientName || '',
    clientEmail: existingQuote?.clientEmail || request.clientEmail || request.correspondenceEmail || '',
    clientPhone: existingQuote?.clientPhone || request.clientPhone || request.correspondencePhone || '',
    centreId: existingQuote?.centreId || request.centreId || '',
    agencyId: existingQuote?.agencyId || request.agencyId || '',
    installationAddress: existingQuote?.installationAddress || request.installationAddress || '',
    installationCommune: existingQuote?.installationCommune || request.installationCommune || '',
    serviceType: existingQuote?.serviceType || request.serviceType || '',
    description: existingQuote?.description || request.description || '',
    type: existingQuote?.type || request.type || 'Propriétaire',
    category: existingQuote?.category || request.category || undefined,
    civility: existingQuote?.civility || request.civility || 'M.',
    businessName: existingQuote?.businessName || request.businessName || '',
    idDocumentType: existingQuote?.idDocumentType || request.idDocumentType || 'CNI',
    idDocumentNumber: existingQuote?.idDocumentNumber || request.idDocumentNumber || '',
    idDocumentIssueDate: existingQuote?.idDocumentIssueDate || request.idDocumentIssueDate || '',
    idDocumentIssuer: existingQuote?.idDocumentIssuer || request.idDocumentIssuer || '',
    address: existingQuote?.address || request.address || '',
    commune: existingQuote?.commune || request.commune || '',
    branchementType: existingQuote?.branchementType || request.branchementType || undefined,
    branchementDetails: existingQuote?.branchementDetails || request.branchementDetails || '',
    diameter: existingQuote?.diameter || request.diameter || '',
    flowRate: existingQuote?.flowRate || request.flowRate || '',
    correspondencePhone: request.correspondencePhone || '',
    correspondenceEmail: request.correspondenceEmail || '',
    installationPhone: request.installationPhone || '',
    installationEmail: request.installationEmail || '',
    clientFax: existingQuote?.clientFax || request.clientFax || '',
  });

  const [items, setItems] = useState<QuoteItem[]>([]);

  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [showArticleDropdown, setShowArticleDropdown] = useState<{[key: number]: boolean}>({});
  const [searchTerms, setSearchTerms] = useState<{[key: number]: string}>({});
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>(
    existingQuote && existingQuote.id && !existingQuote.id.startsWith('TEMP-') ? 'preview' : 'form'
  );
  
  // FORCER le mode formulaire au chargement si pas de devis existant valide
  useEffect(() => {
    const shouldShowForm = !existingQuote || !existingQuote.id || existingQuote.id.startsWith('TEMP-');
    if (shouldShowForm && activeTab !== 'form') {
      console.log('[BranchementQuoteForm] Forçage du mode formulaire');
      setActiveTab('form');
    }
    console.log('[BranchementQuoteForm] Initialisation:', {
      existingQuoteId: existingQuote?.id,
      activeTab,
      shouldShowForm
    });
  }, []);
  
  const [taxRate, setTaxRate] = useState(19); // 19% TVA

  // --- NOUVEAU: LOGIQUE DE VALIDATION MULTI-UTILISATEUR ---
  const isFullyApproved = useMemo(() => {
    if (!existingQuote) return false;
    
    // 1. Trouver le type de travaux et ses rôles de validation
    const matchedWorkType = workTypes.find(wt => wt.label === existingQuote.serviceType);
    const quoteValidationRoles = (matchedWorkType?.quoteValidationRoles && matchedWorkType.quoteValidationRoles.length > 0)
      ? matchedWorkType.quoteValidationRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE];
    
    // 2. Identifier tous les utilisateurs ayant ces rôles
    const requiredUsers = users.filter(u => quoteValidationRoles.includes(u.role));
    
    // 3. Vérifier les validations actuelles
    const currentValidations = existingQuote.validations || [];
    const validatedUserIds = currentValidations.filter(v => v.status === 'validated').map(v => v.userId);
    
    // 4. Est-ce que TOUS les utilisateurs requis ont validé ?
    const allUsersValidated = requiredUsers.every(u => validatedUserIds.includes(u.id));
    
    // Le devis est "Pleinement Approuvé" SSI statut APPROVED ET toutes les signatures ok
    return existingQuote.status === QuoteStatus.APPROVED && allUsersValidated;
  }, [existingQuote, users, workTypes]);

  // Nombre de validations manquantes
  const missingValidationsCount = useMemo(() => {
    if (!existingQuote) return 0;
    const matchedWorkType = workTypes.find(wt => wt.label === existingQuote.serviceType);
    const quoteValidationRoles = (matchedWorkType?.quoteValidationRoles && matchedWorkType.quoteValidationRoles.length > 0)
      ? matchedWorkType.quoteValidationRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE];
    const requiredUsers = users.filter(u => quoteValidationRoles.includes(u.role));
    const validatedUserIds = (existingQuote.validations || []).filter(v => v.status === 'validated').map(v => v.userId);
    return requiredUsers.length - validatedUserIds.filter(id => requiredUsers.some(u => u.id === id)).length;
  }, [existingQuote, users, workTypes]);

  const canEdit = useMemo(() => {
    const matchedWorkType = workTypes.find(wt => wt.label === formData.serviceType);
    return PermissionService.canManageQuote(currentUser as any, matchedWorkType, existingQuote, users);
  }, [currentUser, workTypes, formData.serviceType, existingQuote, users]);

  // Générer ou récupérer le numéro de devis
  const getQuoteNumber = (): string => {
    // Si un devis existant est fourni, utiliser son ID (uniquement s'il n'est pas temporaire)
    if (existingQuote && existingQuote.id && !existingQuote.id.startsWith('TEMP-')) {
      return existingQuote.id;
    }
    
    // Sinon, générer un numéro au format NNNN/préfix/yyyy
    const currentYear = new Date().getFullYear();
    
    // Obtenir le préfixe du centre d'appartenance de la demande
    // Essayer d'abord avec request.centreId, sinon via l'agence
    let centre = centres.find(c => c.id === request.centreId);
    
    // Si pas de centreId dans la demande, essayer de trouver via l'agence
    if (!centre && request.agencyId) {
      const agency = agencies.find(a => a.id === request.agencyId);
      if (agency) {
        centre = centres.find(c => c.id === agency.centreId);
      }
    }
    
    console.log('Debug Centre:', { 
      requestCentreId: request.centreId, 
      requestAgencyId: request.agencyId,
      foundCentre: centre, 
      prefix: centre?.prefix 
    });
    
    const prefix = centre?.prefix || 'DV'; // Utiliser le préfixe du centre ou DV par défaut
    
    // Compter le nombre de devis existants pour ce centre et cette année
    const existingQuotesForCentre = quotes.filter(q => {
      // Extraire le préfixe et l'année de l'ID du devis
      const parts = q.id.split('/');
      if (parts.length === 3) {
        const quotePrefix = parts[1];
        const quoteYear = parseInt(parts[2]);
        return quotePrefix === prefix && quoteYear === currentYear;
      }
      return false;
    });
    
    // Le prochain numéro est le nombre de devis + 1, formaté sur 4 chiffres
    const nextNumber = existingQuotesForCentre.length + 1;
    const sequenceNumber = String(nextNumber).padStart(4, '0');
    
    console.log('Generated Quote Number:', `${sequenceNumber}/${prefix}/${currentYear}`);
    return `${sequenceNumber}/${prefix}/${currentYear}`;
  };

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

  // Fonction pour ouvrir la boîte de dialogue de sélection de prix
  const openPriceSelectionDialog = (article: Article, index: number) => {
    // Filtrer les prix non nuls
    const validPrices = article.prices.filter(price => price.price > 0);
    
    // Vérifier si on a à la fois pose et fourniture
    const fourniturePrice = article.prices.find(p => p.type === 'fourniture' && p.price > 0);
    const posePrice = article.prices.find(p => p.type === 'pose' && p.price > 0);
    const hasBothFournitureAndPose = fourniturePrice && posePrice;
    
    if (validPrices.length === 0) {
      Swal.fire({
        title: 'Aucun prix disponible',
        text: `L'article "${article.name}" n'a aucun prix de vente défini.`,
        icon: 'info',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Plusieurs prix valides ou combinés possibles, demander à l'utilisateur de choisir
    if (validPrices.length > 1 || hasBothFournitureAndPose) {
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
          price: (fourniturePrice?.price || 0) + (posePrice?.price || 0),
          type: 'combined'
        });
      }
      
      Swal.fire({
        title: 'Choisir le type de prix',
        html: `
          <div class="text-left font-sans">
            <p class="mb-4 text-sm text-gray-600">Sélectionnez le type de prix souhaité pour l'article :<br><strong class="text-gray-900">${article.name}</strong></p>
            <div class="space-y-2">
              ${options.map((option, i) => `
                <label class="flex items-center p-3 border-2 border-gray-100 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                  <input type="radio" id="${option.id}" name="priceType" value="${option.value}" 
                         class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" ${i === 0 ? 'checked' : ''}>
                  <div class="ml-3 flex-1">
                    <div class="text-sm font-bold text-gray-900">${option.label}</div>
                    <div class="text-xs font-black text-blue-600">${option.price.toLocaleString()} DA</div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Appliquer ce prix',
        cancelButtonText: 'Conserver l\'actuel',
        confirmButtonColor: '#2563eb', // blue-600
        cancelButtonColor: '#64748b', // slate-500
        preConfirm: () => {
          const selectedRadio = document.querySelector('input[name="priceType"]:checked') as HTMLInputElement;
          return selectedRadio ? selectedRadio.value : null;
        }
      }).then((result) => {
        if (result.isConfirmed && result.value !== null) {
          const selectedValue = result.value;
          
          setItems(prevItems => {
            const newItems = [...prevItems];
            if (selectedValue === 'combined') {
              // Prix combiné
              newItems[index].unitPrice = (fourniturePrice?.price || 0) + (posePrice?.price || 0);
              newItems[index].priceTypeIndicator = 'F/P';
            } else {
              // Prix individuel
              const selectedIndex = parseInt(selectedValue);
              const selectedPrice = validPrices[selectedIndex];
              newItems[index].unitPrice = selectedPrice.price;
              newItems[index].priceTypeIndicator = selectedPrice.type === 'fourniture' ? 'F' : 
                                                 selectedPrice.type === 'pose' ? 'P' : 'PS';
            }
            newItems[index].totalHT = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
            return newItems;
          });
          setSearchTerms(prev => ({ ...prev, [index]: article.name }));
        }
      });
    } else {
      // Un seul prix possible
      setItems(prevItems => {
        const newItems = [...prevItems];
        newItems[index].unitPrice = validPrices[0].price;
        newItems[index].priceTypeIndicator = validPrices[0].type === 'fourniture' ? 'F' : 
                                            validPrices[0].type === 'pose' ? 'P' : 'PS';
        newItems[index].totalHT = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
        return newItems;
      });
      setSearchTerms(prev => ({ ...prev, [index]: article.name }));
      
      // Petit feedback visuel
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Prix mis à jour (Type unique)',
        showConfirmButton: false,
        timer: 2000
      });
    }
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
    
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        description: article.name,
        unit: article.unit
      };
      return newItems;
    });
    
    // Ouvrir la boîte de dialogue de sélection de prix (ou appliquer automatiquement si un seul prix)
    openPriceSelectionDialog(article, index);
    
    // Fermer le dropdown et mettre à jour le terme de recherche
    setSearchTerms(prev => ({ ...prev, [index]: article.name }));
    setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
  };

  // Calcul des totaux
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  // Fonction pour obtenir la catégorie d'un article à partir de son nom
  const getItemCategory = (itemName: string): string => {
    const article = allArticles.find(a => a.name === itemName);
    return article?.category || 'Autres';
  };

  // Définir l'ordre des familles
  const familyOrder = [
    'TRAVAUX DE TERRASSEMENT & VOIRIE',
    'CANALISATIONS (TUBES PEHD)',
    'PIÈCES SPÉCIALES',
    'DIVERS & PRESTATIONS',
    'Comptage',
    'Cautionnement pour Branchement'
  ];

  // Fonction pour convertir un nombre en chiffres romains
  const toRoman = (num: number): string => {
    const romanNumerals: {[key: number]: string} = {
      1000: 'M', 900: 'CM', 500: 'D', 400: 'CD',
      100: 'C', 90: 'XC', 50: 'L', 40: 'XL',
      10: 'X', 9: 'IX', 5: 'V', 4: 'IV', 1: 'I'
    };
    
    let result = '';
    for (const [value, numeral] of Object.entries(romanNumerals).reverse()) {
      while (num >= Number(value)) {
        result += numeral;
        num -= Number(value);
      }
    }
    return result;
  };

  // Regrouper les items par famille
  const groupedItems = React.useMemo(() => {
    const groups: { [key: string]: typeof items } = {};
    
    // Initialiser les groupes dans l'ordre défini
    familyOrder.forEach(family => {
      groups[family] = [];
    });
    groups['Autres'] = [];
    
    // Répartir les items dans les groupes
    items.forEach(item => {
      const category = getItemCategory(item.description);
      
      // Trouver la famille correspondante
      let matchedFamily = 'Autres';
      for (const family of familyOrder) {
        if (category.toUpperCase().includes(family.split(' ')[0].toUpperCase()) || 
            category.includes(family)) {
          matchedFamily = family;
          break;
        }
      }
      
      if (!groups[matchedFamily]) {
        groups[matchedFamily] = [];
      }
      groups[matchedFamily].push(item);
    });
    
    return groups;
  }, [items, allArticles]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, unit: 'U' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Filtrer les articles valides (avec description et prix > 0)
    const validItems = items.filter(item => item.description && item.unitPrice > 0);
    
    // Validation
    if (items.length === 0 || validItems.length === 0 || total === 0) {
      Swal.fire({
        title: 'Devis vide ou incomplet',
        text: 'Veuillez ajouter au moins un article avec un montant valide avant d\'enregistrer.',
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
      id: generateTempQuoteId(),
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
  
  const activeCentre = centres.find(c => c.id === formData.centreId) || centres[0];
  const activeAgency = agencies.find(a => a.id === formData.agencyId) || agencies[0];
  const activeUnit = (activeCentre ? units.find(u => u.id === activeCentre.unitId) : null) || units[0];
  
  // Fonction pour générer un ID temporaire pour les devis
  const generateTempQuoteId = () => {
    const currentYear = new Date().getFullYear();
    
    // Utiliser le préfixe du centre
    let prefix = 'DV'; // Préfixe par défaut pour Devis
    if (activeCentre && activeCentre.prefix) {
      prefix = activeCentre.prefix;
    }
    
    // ID spécial pour indiquer au backend de générer le vrai numéro incrémental
    return `TEMP-QUOTE-${Date.now()}-${prefix}-${currentYear}`;
  };

  return (
    <div className="max-w-full mx-auto mb-10 w-full animate-in fade-in duration-300">
      {/* Printing Style Orchestration - GLOBAL PROTECTION */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Isolation: Hide everything except blocked message if unapproved */
          .print-hidden, nav, footer, .sidebar, .no-print, form, .bg-gray-50, .max-w-full, .quote-print-doc {
            display: none !important;
          }
          /* If approved, show the doc */
          ${existingQuote?.status === QuoteStatus.APPROVED ? `
          .quote-print-doc {
            display: block !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 15mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 1.2mm solid black !important;
            border-radius: 10mm !important;
            position: absolute;
            left: 0;
            top: 0;
            overflow: hidden;
            visibility: visible !important;
          }
          ` : ''}

          .print-blocked-message {
            display: ${existingQuote?.status !== QuoteStatus.APPROVED ? 'block' : 'none'} !important;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            font-family: sans-serif;
            width: 100%;
            z-index: 9999;
          }
        }
        .print-blocked-message {
          display: none;
        }
      `}</style>

      {/* Message visible uniquement à l'impression si bloqué */}
      <div className="print-blocked-message">
        <h1 style={{ color: 'red', fontSize: '40pt', fontWeight: '900', textTransform: 'uppercase' }}>Impression Interdite</h1>
        <p style={{ fontSize: '20pt', fontWeight: 'bold' }}>Ce devis n'est pas encore approuvé par les responsables.</p>
      </div>

      <div className={activeTab === 'form' ? 'block' : 'hidden'} style={{ display: activeTab === 'form' ? 'block' : 'none' }}>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-full mx-auto">
          {/* ... Contenu du formulaire resté inchangé ... */}
          {/* (Note: Code truncated for replace_file_content tool, but I will make sure the replacement is complete) */}
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
            Destinataire (Abonné)
          </h3>
          
          <div className="w-full md:w-[450px] bg-gray-50/50 p-6 rounded-xl border border-gray-100 flex flex-col space-y-3 relative">
            <div className="space-y-2">
              <div className="flex gap-2 text-sm">
                <span className="font-bold text-gray-500 whitespace-nowrap min-w-[140px]">DOIT A :</span>
                <span className="text-gray-800 font-bold">{formData.civility} {formData.clientName || formData.businessName || '……………………….'}</span>
              </div>
              
              <div className="flex gap-2 text-sm">
                <span className="font-bold text-gray-500 whitespace-nowrap min-w-[140px]">Adresse :</span>
                <span className="text-gray-700">{formData.address || '…………………………………………….'}</span>
              </div>

              <div className="flex gap-2 text-sm">
                <span className="font-bold text-gray-500 whitespace-nowrap min-w-[140px]">Commune :</span>
                <span className="text-gray-700">{formData.commune || '……………………….'}</span>
              </div>

              <div className="pt-2 border-t border-gray-100 mt-2 space-y-2">
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-400 whitespace-nowrap min-w-[140px]">Tél :</span>
                  <span className="text-gray-700 font-medium">{formData.clientPhone || '……………………….'}</span>
                </div>
                
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-400 whitespace-nowrap min-w-[140px]">Fax :</span>
                  <span className="text-gray-700 font-medium">{formData.clientFax || '……………………….'}</span>
                </div>

                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-400 whitespace-nowrap min-w-[140px]">Email :</span>
                  <span className="text-gray-700 font-medium truncate">{formData.clientEmail || '……………………….'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400 ml-1">Téléphone de contact</span>
              <input 
                type="text" 
                placeholder="Téléphone"
                className="w-full bg-gray-50 border-none rounded-lg p-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-100 transition-all"
                value={formData.clientPhone}
                onChange={e => setFormData({...formData, clientPhone: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400 ml-1">Fax</span>
              <input 
                type="text" 
                placeholder="Fax"
                className="w-full bg-gray-50 border-none rounded-lg p-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-100 transition-all"
                value={formData.clientFax}
                onChange={e => setFormData({...formData, clientFax: e.target.value})}
              />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400 ml-1">Email</span>
              <input 
                type="email" 
                placeholder="Email professionnel"
                className="w-full bg-gray-50 border-none rounded-lg p-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-100 transition-all"
                value={formData.clientEmail}
                onChange={e => setFormData({...formData, clientEmail: e.target.value})}
              />
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
        
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm mt-4">
          <table className="w-full border-collapse">
            <thead className="bg-[#1e90ff] text-white text-[11px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-4 py-3 text-left rounded-tl-xl">Description</th>
                <th className="px-2 py-3 text-center">Unité</th>
                <th className="px-2 py-3 text-center w-20">Qté</th>
                <th className="px-2 py-3 text-center w-32">P.U (DZD)</th>
                <th className="px-4 py-3 text-right">Total HT</th>
                <th className="px-4 py-3 w-10 rounded-tr-xl"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-gray-400 italic bg-gray-50/30">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-[11px] font-black uppercase tracking-widest">Aucun article dans le devis</p>
                      <p className="text-xs font-medium">Cliquez sur « Ajouter une ligne » pour commencer</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-2 relative">
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
                        className="w-full text-[13px] font-semibold bg-transparent border-transparent focus:border-blue-200 focus:bg-white rounded p-1 transition-all"
                        placeholder="Description..."
                      />
                      {showArticleDropdown[index] && filteredArticles.length > 0 && (
                        <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {filteredArticles.map((article, idx) => (
                            <div 
                              key={idx}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
                              onMouseDown={() => handleArticleSelect(article, index)}
                            >
                              <span className="text-sm font-bold text-gray-700">{article.name}</span>
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{article.prices[0]?.price || 0} DA</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">
                        {item.unit || 'U'}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full text-center text-[13px] font-bold bg-transparent border-transparent focus:border-blue-200 focus:bg-white rounded p-1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        onDoubleClick={() => {
                          const article = allArticles.find(a => a.name === item.description);
                          if (article) {
                            openPriceSelectionDialog(article, index);
                          } else {
                            Swal.fire({
                              toast: true,
                              position: 'top-end',
                              icon: 'warning',
                              title: 'Article non trouvé dans la base',
                              showConfirmButton: false,
                              timer: 2000
                            });
                          }
                        }}
                        className="w-full text-center text-[13px] font-black text-gray-700 bg-transparent border-transparent focus:border-blue-200 focus:bg-white rounded p-1 cursor-pointer"
                        title="Double-cliquez pour choisir le type de prix"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[13px] font-black text-blue-600">
                          {(item.quantity * item.unitPrice).toFixed(2)} DA
                        </span>
                        {item.priceTypeIndicator && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] font-black rounded-full uppercase tracking-tighter">
                            {item.priceTypeIndicator}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        title="Supprimer la ligne"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50/50 border-t border-gray-100">
            <button
              type="button"
              onClick={handleAddItem}
              className="bg-transparent border-[1.5px] border-dashed border-[#1e90ff] text-[#1e90ff] rounded-[4px] px-[18px] py-[6px] text-[13px] font-semibold cursor-pointer tracking-wider hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <span className="text-base font-medium">+</span> Ajouter une ligne
            </button>
          </div>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="mt-10 bg-gray-50 p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm mb-4">
              Récapitulatif
            </h4>
            <div className="space-y-3 py-3 bg-white rounded-xl border border-gray-100 shadow-sm font-medium">
              <div className="px-4 space-y-2">
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>Sous-total:</span>
                  <span className="text-gray-700 font-bold">{subtotal.toFixed(2)} DZD</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>TVA ({taxRate}%):</span>
                  <span className="text-gray-700 font-bold">{tax.toFixed(2)} DZD</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-[#1e90ff] text-white p-4 rounded-xl shadow-lg shadow-blue-100 mx-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Total Global</span>
                  <span className="font-black text-[10px] uppercase leading-none">Net à Payer</span>
                </div>
                <span className="font-black text-xl tracking-tighter">{total.toFixed(2)} DZD</span>
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
                disabled={items.length === 0 || total === 0 || !items.some(it => it.description && it.unitPrice > 0)}
                className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                  (items.length === 0 || total === 0 || !items.some(it => it.description && it.unitPrice > 0))
                    ? 'bg-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                }`}
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

    {/* Printing Style Orchestration - GLOBAL PROTECTION */}
    <style>{`
      @media print {
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        /* Isolation: Hide everything except blocked message if unapproved */
        .print-hidden, nav, footer, .sidebar, .no-print, form, .bg-gray-50, .max-w-full, .quote-print-doc {
          display: none !important;
        }
        /* If approved, show the doc */
        ${isFullyApproved ? `
        .quote-print-doc {
          display: block !important;
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 15mm !important;
          margin: 0 !important;
          box-shadow: none !important;
          border: 1.2mm solid black !important;
          border-radius: 10mm !important;
          position: absolute;
          left: 0;
          top: 0;
          overflow: hidden;
          visibility: visible !important;
        }
        ` : ''}

        .print-blocked-message {
          display: ${!isFullyApproved ? 'block' : 'none'} !important;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          font-family: sans-serif;
          width: 100%;
          z-index: 9999;
        }
      }
      .print-blocked-message {
        display: none;
      }
    `}</style>

    {/* Message visible uniquement à l'impression si bloqué */}
    <div className="print-blocked-message">
      <h1 style={{ color: 'red', fontSize: '40pt', fontWeight: '900', textTransform: 'uppercase' }}>Impression Interdite</h1>
      <p style={{ fontSize: '20pt', fontWeight: 'bold' }}>Ce devis n'est pas encore validé par TOUS les responsables requis ({missingValidationsCount} manquantes).</p>
    </div>

    <div className={activeTab === 'preview' ? 'block animate-in fade-in duration-500' : 'hidden'} style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
      <div className={`quote-print-doc bg-white w-full max-w-[210mm] mx-auto p-[15mm] text-slate-900 block-print-unapproved relative overflow-hidden`} style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        
        {/* Watermark for non-approved quotes */}
        {existingQuote?.status !== QuoteStatus.APPROVED && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
            <div className="text-gray-200 text-[120px] font-black uppercase tracking-[0.2em] -rotate-45 whitespace-nowrap opacity-40">
              NON VALIDÉ
            </div>
          </div>
        )}



        {/* === HEADER (Logo + Textes officiels) === */}
        <div className="flex justify-center items-center gap-5 mb-6 relative z-10">
          <img src="/ade.png" alt="ADE" className="h-20 w-auto object-contain" />
          <div className="flex flex-col">
            <div className="text-[#1592ef] font-black text-[16px] leading-tight">الجزائرية للمياه</div>
            <div className="text-[#1592ef] font-black text-[15px] leading-tight tracking-tighter">ⵜⴰⵣⵣⴰⵢⵔⵉⵜ ⵏ ⵡⴰⵎⴰⵏ</div>
            <div className="text-[#1592ef] font-black text-[11px] uppercase tracking-widest mt-1">ALGERIAN WATER UTILITY</div>
          </div>
        </div>

        <div className="bg-gray-100 border border-gray-400 p-2 mb-6" style={{ borderRadius: '8px' }}>
          <div className="flex justify-between font-bold text-[11px] mb-1">
            <span>Zone d'Alger</span>
            <span>Unité de {activeUnit?.name || '................'}</span>
          </div>
          <div className="text-[11px] text-center leading-relaxed font-medium">
            Siège social : {activeUnit?.address || activeCentre?.address || '...........................'} - {activeUnit?.commune || activeCentre?.commune || '...........................'} . Tél: {activeUnit?.phone || activeCentre?.phone || '.............'} Fax: {activeUnit?.fax || activeCentre?.fax || '.............'}<br />
            R.C: {activeUnit?.rc || '................'} &nbsp;&nbsp;&nbsp; I.F (NIF): {activeUnit?.nif || '................'} &nbsp;&nbsp;&nbsp; A.I: {activeUnit?.ai || '................'}
          </div>
        </div>

        <div className="flex justify-between mb-8">
          <div className="space-y-6">
            <div>
              <span className="font-bold text-[11px] border-b border-black inline-block pb-0.5">Centre de {activeCentre?.name}</span>
            </div>
            <div>
              <h1 className="font-black text-[13px] border-b-[2px] border-black inline-block pb-1 uppercase tracking-tight leading-tight">
                DEVIS QUANTITATIF ET ESTIMATIF
              </h1>
              <div className="text-[11px] font-bold mt-1">
                N°: {getQuoteNumber()} du: {new Date(existingQuote?.createdAt || new Date()).toLocaleDateString('fr-DZ')}
              </div>
            </div>
          </div>

          <div className="w-fit min-w-[85mm] max-w-full border border-gray-400 p-4 min-h-[40mm] bg-white shadow-sm" style={{ borderRadius: '8px' }}>
            <div className="text-[11px] leading-relaxed text-gray-900">
              <div className="mb-3"><span className="font-bold uppercase pr-2">Doit A :</span> <span className="font-black uppercase">{formData.businessName || (`${formData.civility || ''} ${formData.clientName}`).trim()}</span></div>
              <div className="mb-1.5"><span className="font-bold pr-2">Adresse :</span> <span className="uppercase">{formData.address || request.address || '...........................................'}</span></div>
              <div className="mb-1.5"><span className="font-bold pr-2">Commune :</span> <span className="uppercase">{formData.commune || request.commune || '...................................'}</span></div>
              <div className="mb-1.5"><span className="font-bold pr-2">Tél :</span> <span className="uppercase">{formData.clientPhone || formData.correspondencePhone || request.clientPhone || request.correspondencePhone || '...........................................'}</span></div>
              <div className="mb-1.5"><span className="font-bold pr-2">Fax :</span> <span className="uppercase">.........................................</span></div>
              <div className="mb-1.5"><span className="font-bold pr-2">Email :</span> <span className="lowercase">{formData.clientEmail || formData.correspondenceEmail || request.clientEmail || request.correspondenceEmail || '.........................................'}</span></div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <span className="font-bold text-[11px] border-b border-black inline-block pb-0.5 uppercase">Objet: {request.serviceType}</span>
        </div>

        {/* Table Wrap for Border Radius */}
        <div className="mb-0 overflow-hidden border border-gray-400" style={{ borderRadius: '8px' }}>
          <table className="w-full border-collapse font-sans text-[11px]">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="border-b border-r border-gray-400 p-1.5 text-left">Désignation des travaux</th>
                <th className="border-b border-r border-gray-400 p-1.5 text-center w-16">Unité</th>
                <th className="border-b border-r border-gray-400 p-1.5 text-center w-16">Qtité</th>
                <th className="border-b border-r border-gray-400 p-1.5 text-right w-24">P.U</th>
                <th className="border-b border-gray-400 p-1.5 text-right w-24">Montant</th>
              </tr>
            </thead>
            <tbody>
              {familyOrder.map((family, familyIndex) => {
                const familyItems = groupedItems[family] || [];
                if (familyItems.length === 0) return null;
                
                return (
                  <React.Fragment key={family}>
                    {/* En-tête de famille */}
                    <tr className="bg-gray-200">
                      <td colSpan={5} className="border-b border-r border-gray-400 px-2 py-1 font-black text-[10px] uppercase">
                        {toRoman(familyIndex + 1)}. {family}
                      </td>
                    </tr>
                    {/* Items de cette famille */}
                    {familyItems.map((item, i) => {
                      // Trouver l'article correspondant pour récupérer son unité
                      const article = allArticles.find(a => a.name === item.description);
                      const unit = article?.unit || 'U';
                      
                      return (
                        <tr key={`${family}-${i}`}>
                          <td className="border-b border-r border-gray-400 px-2 py-1 pl-4">
                            {item.priceTypeIndicator && (
                              <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                                {item.priceTypeIndicator}
                              </span>
                            )}
                            {item.description}
                          </td>
                          <td className="border-b border-r border-gray-400 px-2 py-1 text-center">{unit}</td>
                          <td className="border-b border-r border-gray-400 px-2 py-1 text-center">{item.quantity}</td>
                          <td className="border-b border-r border-gray-400 px-2 py-1 text-right">{item.unitPrice.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                          <td className="border-b border-gray-400 px-2 py-1 text-right">{(item.quantity * item.unitPrice).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              
              {/* Afficher les items "Autres" s'il y en a */}
              {(() => {
                const autresItems = groupedItems['Autres'] || [];
                if (autresItems.length === 0) return null;
                
                return (
                  <React.Fragment>
                    <tr className="bg-gray-200">
                      <td colSpan={5} className="border-b border-r border-gray-400 px-2 py-1 font-black text-[10px] uppercase">
                        {toRoman(familyOrder.length + 1)}. AUTRES
                      </td>
                    </tr>
                    {autresItems.map((item, i) => {
                      // Trouver l'article correspondant pour récupérer son unité
                      const article = allArticles.find(a => a.name === item.description);
                      const unit = article?.unit || 'U';
                      
                      return (
                        <tr key={`autres-${i}`}>
                          <td className="border-b border-r border-gray-400 px-2 py-1 pl-4">
                            {item.priceTypeIndicator && (
                              <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                                {item.priceTypeIndicator}
                              </span>
                            )}
                            {item.description}
                          </td>
                          <td className="border-b border-r border-gray-400 px-2 py-1 text-center">{unit}</td>
                          <td className="border-b border-r border-gray-400 px-2 py-1 text-center">{item.quantity}</td>
                          <td className="border-b border-r border-gray-400 px-2 py-1 text-right">{item.unitPrice.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                          <td className="border-b border-gray-400 px-2 py-1 text-right">{(item.quantity * item.unitPrice).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })()}
              
              <tr className="hover:bg-gray-50/20">
                <td rowSpan={3} colSpan={1} className="border-r border-gray-400 p-1.5 text-left align-top leading-tight space-y-0.5">
                  <p>Compte CCP N°: <span className="font-bold">{activeCentre?.comptePostale || activeUnit?.comptePostale || '...........................'}</span></p>
                  <p>Compte <span className="font-bold">{activeCentre?.bankName || activeUnit?.bankName || '..........'}</span> N°: <span className="font-bold">{activeCentre?.bankAccount || activeUnit?.bankAccount || '...........................'}</span></p>
                  <p>Mode de paiement : Chèque, Espece, Versement</p>
                </td>
                <td colSpan={2} className="border-b border-r border-gray-400 font-bold p-1 align-middle text-left uppercase text-gray-600">Total HT</td>
                <td colSpan={2} className="border-b border-gray-400 p-1 text-right align-middle font-bold">
                  {subtotal.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="hover:bg-gray-50/20">
                <td colSpan={2} className="border-b border-r border-gray-400 font-bold p-1 align-middle text-left uppercase text-gray-600">TVA 19%</td>
                <td colSpan={2} className="border-b border-gray-400 p-1 text-right align-middle font-bold">
                  {tax.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="bg-gray-50/50">
                <td colSpan={2} className="border-r border-gray-400 font-black p-1 align-middle text-left uppercase">Total TTC</td>
                <td colSpan={2} className="font-black p-1 text-right align-middle text-[12px] text-blue-800">
                  {total.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-[11px] space-y-2">
          <p className="font-black tracking-tight capitalize">{numberToFrenchLetters(total).toLowerCase()}.</p>
          <p className="italic">Nb: ce devis est valable pour une durée de 01 mois</p>
        </div>

        <div className="mt-10 flex justify-end">
          <div className="text-center">
            <p className="font-bold text-[11px] border-b border-black inline-block pb-0.5 pointer-events-none">LE CHEF D'AGENCE COMMERCIALE</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-full mx-auto print:hidden">
        {/* ⚠️ Bannière d'avertissement si devis non validé */}
        {!isFullyApproved && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-amber-100">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Impression bloquée</p>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                Ce devis nécessite encore <strong className="font-black h-[18px] inline-flex items-center px-2 bg-amber-200 rounded text-amber-900 mx-1">{missingValidationsCount}</strong> validation(s) pour être imprimable.
              </p>
            </div>
          </div>
        )}

        {/* Floating return button to keep preview clean - Securing based on canEdit */}
        {canEdit && (
          <button 
            onClick={() => setActiveTab('form')}
            className="fixed bottom-8 right-8 z-[110] bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5L6 10L11 15M6 10H18" /></svg>
            Retour à l'édition
          </button>
        )}
      </div>
    </div>
    </div>
  );
};