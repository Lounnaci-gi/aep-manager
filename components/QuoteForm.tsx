
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Quote, QuoteItem, QuoteStatus, WorkType, Client, CommercialAgency, Centre, ClientCategory, Unit, WorkRequest, UserRole, User, TaxRate, TaxType } from '../types';
import { TaxService } from '../services/taxService';
import { getAIRecommendation } from '../services/geminiService';
import { numberToFrenchLetters } from '../utils/numberToLetters';
import { ArticleService } from '../services/articleService';
import Swal from 'sweetalert2';

interface QuoteFormProps {
  onSave: (quote: Quote) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  clients: Client[];
  requests: WorkRequest[];
  quotes: Quote[];
  workTypes: WorkType[];
  agencies: CommercialAgency[];
  centres: Centre[];
  units: Unit[];
  users: User[];
  initialData?: Quote;
  currentUserAgencyId?: string;
  currentUser?: { role: UserRole, id: string };
  taxRates: TaxRate[];
}

export const QuoteForm: React.FC<QuoteFormProps> = ({
  onSave,
  onDelete,
  onCancel,
  clients,
  quotes,
  workTypes,
  agencies,
  centres,
  units,
  users,
  initialData,
  currentUserAgencyId,
  requests,
  currentUser,
  taxRates,
}) => {
  const defaultTva = useMemo(() => {
    return TaxService.getApplicableRate(taxRates, TaxType.PRESTATION, new Date());
  }, [taxRates]);

  const [formData, setFormData] = useState({
    requestId: initialData?.requestId || '',
    clientId: initialData?.clientId || '',
    centreId: initialData?.centreId || '',
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
    // Nouveaux champs
    projectTitle: initialData?.projectTitle || '',
    validUntil: initialData?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    workStartDate: initialData?.workStartDate || '',
    estimatedDuration: initialData?.estimatedDuration || '',
    paymentConditions: initialData?.paymentConditions || 'Chèque, Espèces, Virement bancaire',
    iban: initialData?.iban || 'FR76 1478 9563 1254 4789 4598',
    bic: initialData?.bic || 'MCPRIFRPP',
    wasteManagement: initialData?.wasteManagement || 'À définir',
    clientFax: initialData?.clientFax || '',
    // Champs techniques pour types de travaux spécifiques
    branchementType: initialData?.branchementType || '',
    branchementDetails: initialData?.branchementDetails || '',
    diameter: initialData?.diameter || '',
    flowRate: initialData?.flowRate || '',
  });

  const [items, setItems] = useState<QuoteItem[]>(() => {
    if (initialData?.items && initialData.items.length > 0) {
      // Recalculer totalHT pour chaque ligne au chargement pour garantir la cohérence
      return initialData.items.map(item => ({
        ...item,
        tva: item.tva ?? defaultTva,
        totalHT: (item.quantity || 0) * (item.unitPrice || 0),
      }));
    }
    return [];
  }, [initialData]);

  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRec, setAiRec] = useState(initialData?.aiNotes || '');
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>(
    (initialData && initialData.id && !initialData.id.startsWith('TEMP-')) ? 'preview' : 'form'
  );
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [showArticleDropdown, setShowArticleDropdown] = useState<{ [key: number]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const shouldShowForm = !initialData || !initialData.id || initialData.id.startsWith('TEMP-');
    if (shouldShowForm && activeTab !== 'form') {
      setActiveTab('form');
    }
  }, [initialData]);

  const isLegal = formData.category === ClientCategory.LEGAL;

  // Déterminer le type de travaux actuel
  const currentWorkType = useMemo(() => {
    return workTypes.find(wt => wt.label === formData.serviceType);
  }, [formData.serviceType, workTypes]);

  // Configuration dynamique selon le type de travaux
  const workTypeConfig = useMemo(() => {
    const isBranchement = formData.serviceType.toLowerCase().includes('branchement');
    const isReparation = formData.serviceType.toLowerCase().includes('réparation') || formData.serviceType.toLowerCase().includes('reparation');
    const isChangement = formData.serviceType.toLowerCase().includes('changement');
    const isDeménagement = formData.serviceType.toLowerCase().includes('déménagement') || formData.serviceType.toLowerCase().includes('deménagement');
    const isFermeture = formData.serviceType.toLowerCase().includes('fermeture');
    const isRésiliation = formData.serviceType.toLowerCase().includes('résiliation') || formData.serviceType.toLowerCase().includes('resiliation');
    const isAudit = formData.serviceType.toLowerCase().includes('audit');
    const isAssainissement = formData.serviceType.toLowerCase().includes('assainissement');

    return {
      isBranchement,
      isReparation,
      isChangement,
      isDeménagement,
      isFermeture,
      isRésiliation,
      isAudit,
      isAssainissement,
      requiresTechnicalDetails: isBranchement || isChangement || isDeménagement,
      requiresDuration: isReparation || isAudit || isBranchement,
      showDiameter: isBranchement || isChangement,
      showFlowRate: isBranchement,
      showBranchementType: isBranchement,
    };
  }, [formData.serviceType]);

  // --- NOUVEAU: LOGIQUE DE VALIDATION MULTI-UTILISATEUR ---
  const isFullyApproved = useMemo(() => {
    if (!initialData) return false;

    // 1. Trouver le type de travaux et ses rôles de validation
    const matchedWorkType = workTypes.find(wt => wt.label === initialData.serviceType);
    const quoteValidationRoles = (matchedWorkType?.quoteValidationRoles && matchedWorkType.quoteValidationRoles.length > 0)
      ? matchedWorkType.quoteValidationRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE];

    // 2. Identifier tous les utilisateurs ayant ces rôles
    const requiredUsers = users.filter(u => quoteValidationRoles.includes(u.role));

    // 3. Vérifier les validations actuelles
    const currentValidations = initialData.validations || [];
    const validatedUserIds = currentValidations.filter(v => v.status === 'validated').map(v => v.userId);

    // 4. Est-ce que TOUS les utilisateurs requis ont validé ?
    const allUsersValidated = requiredUsers.every(u => validatedUserIds.includes(u.id));

    // Le devis est "Pleinement Approuvé" SSI statut APPROVED ET toutes les signatures ok
    return initialData.status === QuoteStatus.APPROVED && allUsersValidated;
  }, [initialData, users, workTypes]);

  // Relation Clientèle et Chef d'Agence : mode lecture seule
  const isReadOnly = currentUser?.role === UserRole.AGENT || currentUser?.role === UserRole.CHEF_AGENCE;

  // Nombre de validations manquantes
  const missingValidationsCount = useMemo(() => {
    if (!initialData) return 0;
    const matchedWorkType = workTypes.find(wt => wt.label === initialData.serviceType);
    const quoteValidationRoles = (matchedWorkType?.quoteValidationRoles && matchedWorkType.quoteValidationRoles.length > 0)
      ? matchedWorkType.quoteValidationRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE];
    const requiredUsers = users.filter(u => quoteValidationRoles.includes(u.role));
    const validatedUserIds = (initialData.validations || []).filter(v => v.status === 'validated').map(v => v.userId);
    return requiredUsers.length - validatedUserIds.filter(id => requiredUsers.some(u => u.id === id)).length;
  }, [initialData, users, workTypes]);

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

  // Auto-complétion des informations client manquantes depuis la demande source
  useEffect(() => {
    if (initialData?.requestId && requests.length > 0) {
      const sourceRequest = requests.find(r => r.id === initialData.requestId);
      if (sourceRequest) {
        setFormData(prev => ({
          ...prev,
          // Compléter uniquement si le champ est vide
          clientPhone: prev.clientPhone || sourceRequest.clientPhone || sourceRequest.correspondencePhone || '',
          clientEmail: prev.clientEmail || sourceRequest.clientEmail || sourceRequest.correspondenceEmail || '',
          clientFax: prev.clientFax || sourceRequest.clientFax || '',
          address: prev.address || sourceRequest.address || '',
          commune: prev.commune || sourceRequest.commune || '',
          civility: prev.civility || sourceRequest.civility || 'M.',
          clientName: prev.clientName || sourceRequest.clientName || '',
          businessName: prev.businessName || sourceRequest.businessName || '',
          idDocumentType: prev.idDocumentType || sourceRequest.idDocumentType || 'CNI',
          idDocumentNumber: prev.idDocumentNumber || sourceRequest.idDocumentNumber || '',
          idDocumentIssueDate: prev.idDocumentIssueDate || sourceRequest.idDocumentIssueDate || '',
          idDocumentIssuer: prev.idDocumentIssuer || sourceRequest.idDocumentIssuer || '',
          // Champs techniques
          branchementType: prev.branchementType || sourceRequest.branchementType || '',
          branchementDetails: prev.branchementDetails || sourceRequest.branchementDetails || '',
          diameter: prev.diameter || sourceRequest.diameter || '',
          flowRate: prev.flowRate || sourceRequest.flowRate || '',
        }));
      }
    }
  }, [initialData?.requestId, requests]);

  // Fonction pour filtrer les articles basés sur la recherche
  const filterArticles = (term: string, index: number) => {
    if (!term) {
      setFilteredArticles(articles);
      setShowArticleDropdown(prev => ({ ...prev, [index]: true }));
      return;
    }

    const filtered = articles.filter(article =>
      article.name.toLowerCase().includes(term.toLowerCase()) ||
      article.description.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredArticles(filtered);
    setShowArticleDropdown(prev => ({ ...prev, [index]: filtered.length > 0 }));
  };

  // Fonction pour ouvrir la boîte de dialogue de sélection de prix
  const openPriceSelectionDialog = (article: any, index: number) => {
    // Filtrer les prix non nuls
    const validPrices = article.prices.filter((price: any) => price.price > 0);

    // Vérifier si on a à la fois pose et fourniture
    const fourniturePrice = article.prices.find((p: any) => p.type === 'fourniture' && p.price > 0);
    const posePrice = article.prices.find((p: any) => p.type === 'pose' && p.price > 0);
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
      const options: Array<{ id: string, value: string | number, label: string, price: number, type: string }> = [
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
          setSearchTerm(prev => ({ ...prev, [index]: article.name }));
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
      setSearchTerm(prev => ({ ...prev, [index]: article.name }));

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

    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        description: article.name,
        unit: article.unit
      };

      // Lookup dynamic TVA - prioritiser le type défini sur l'article
      const type = article.taxType || TaxService.getTaxTypeByCategory(article.category || '');
      const rate = TaxService.getApplicableRate(taxRates, type, new Date());
      newItems[index].tva = rate;

      return newItems;
    });

    // Ouvrir la boîte de dialogue de sélection de prix (ou appliquer automatiquement si un seul prix)
    openPriceSelectionDialog(article, index);

    // Fermer le dropdown et mettre à jour le terme de recherche
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
        clientFax: selected.fax || '',
        address: selected.address,
        commune: selected.commune,
        installationAddress: selected.installationAddress || selected.address,
        installationCommune: selected.installationCommune || selected.commune,
        type: selected.type || 'Propriétaire',
      });
    }
  };

  const handleSelectRequest = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const requestId = e.target.value;
    const selected = requests.find(r => r.id === requestId);
    if (selected) {
      setFormData({
        ...formData,
        category: selected.category || ClientCategory.PHYSICAL,
        civility: selected.civility || 'M.',
        businessName: selected.businessName || '',
        clientName: selected.clientName,
        idDocumentType: selected.idDocumentType || 'CNI',
        idDocumentNumber: selected.idDocumentNumber || '',
        idDocumentIssueDate: selected.idDocumentIssueDate || '',
        idDocumentIssuer: selected.idDocumentIssuer || '',
        clientEmail: selected.clientEmail || selected.correspondenceEmail || '',
        clientPhone: selected.clientPhone || selected.correspondencePhone || '',
        clientFax: selected.clientFax || '',
        address: selected.address || '',
        commune: selected.commune || '',
        installationAddress: selected.installationAddress || selected.address || '',
        installationCommune: selected.installationCommune || selected.commune || '',
        serviceType: selected.serviceType,
        description: selected.description,
        type: selected.type || 'Propriétaire',
        // Champs techniques
        branchementType: selected.branchementType || '',
        branchementDetails: selected.branchementDetails || '',
        diameter: selected.diameter || '',
        flowRate: selected.flowRate || '',
      });
    }
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    (item as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice' || field === 'margin') {
      item.totalHT = (item.quantity || 0) * (item.unitPrice || 0);
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((acc, item) => acc + (item.totalHT || 0), 0);
  const tax = items.reduce((acc, item) => acc + ((item.totalHT || 0) * (item.tva || 19) / 100), 0);
  const total = subtotal + tax;

  const tvaSummaries = useMemo(() => {
    const sums: { [key: number]: number } = {};
    items.forEach(item => {
      const rate = item.tva ?? defaultTva;
      sums[rate] = (sums[rate] || 0) + ((item.totalHT || 0) * rate / 100);
    });
    return Object.entries(sums).map(([r, a]) => [Number(r), a] as [number, number]).sort((a, b) => b[0] - a[0]);
  }, [items, defaultTva]);

  const grossMargin = items.reduce((acc, item) => {
    const cost = (item.unitPrice || 0) / (1 + (item.margin || 0) / 100);
    return acc + (item.quantity * ((item.unitPrice || 0) - cost));
  }, 0);

  const marginRate = subtotal > 0 ? (grossMargin / subtotal) * 100 : 0;

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

    if (items.length === 0 || total === 0) {
      Swal.fire({
        title: 'Devis vide',
        text: 'Vous ne pouvez pas enregistrer un devis sans aucun article ou avec un montant nul.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

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
      id: initialData?.id || generateTempQuoteId(),
      ...formData,
      type: formData.type as 'Proprietaire' | 'Locataire' | 'Mandataire',
      items,
      subtotal,
      tax,
      total,
      status: initialData?.status || QuoteStatus.PENDING,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      aiNotes: aiRec,
      // Champs techniques
      branchementType: formData.branchementType || undefined,
      branchementDetails: formData.branchementDetails || undefined,
      diameter: formData.diameter || undefined,
      flowRate: formData.flowRate || undefined,
    };
    onSave(quoteData);
  };

  const { agency: activeAgency, centre: activeCentre, unit: activeUnit } = (function () {
    const agency = agencies.find(a => a.id === formData.agencyId);
    const centre = agency ? centres.find(c => c.id === agency.centreId) : null;
    const unit = centre ? units.find(u => u.id === centre.unitId) : null;
    return {
      agency: agency || agencies[0],
      centre: centre || centres[0],
      unit: unit || units[0]
    };
  })();

  // Fonction pour générer un ID temporaire pour les devis
  const generateTempQuoteId = () => {
    const currentYear = new Date().getFullYear();

    // Utiliser le préfixe du centre de l'agence sélectionnée
    let prefix = 'DV'; // Préfixe par défaut pour Devis
    if (activeCentre && activeCentre.prefix) {
      prefix = activeCentre.prefix;
    }

    // ID spécial pour indiquer au backend de générer le vrai numéro incrémental
    return `TEMP-QUOTE-${Date.now()}-${prefix}-${currentYear}`;
  };

  const isEditMode = !!initialData;

  // Calcule le prochain numéro de devis incrémental pour ce centre et cette année
  const getNextQuoteNumber = (): string => {
    const prefix = activeCentre?.prefix || 'DV';
    const year = new Date().getFullYear();
    const regex = new RegExp(`^\\d{4}/${prefix}/${year}$`);
    let maxNum = 0;
    quotes.forEach(q => {
      if (regex.test(q.id)) {
        const num = parseInt(q.id.split('/')[0]) || 0;
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `${nextNum.toString().padStart(4, '0')}/${prefix}/${year}`;
  };

  return (
    <div className="max-w-7xl mx-auto mb-10 w-full animate-in fade-in duration-500">

      <div className={activeTab === 'form' ? 'block' : 'hidden'}>
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[1.5rem] shadow-xl border border-gray-100 max-w-7xl mx-auto space-y-8">

          {/* 1. RELOCATED QUOTE HEADER (Full Width Title) */}
          <div className="mb-2 pb-6 border-b-2 border-blue-50">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              {initialData?.id && !initialData.id.startsWith('TEMP-') && !initialData.id.startsWith('AEP-')
                ? `Devis n° ${initialData.id}`
                : `Devis n° ${getNextQuoteNumber()}`
              }
            </h2>
            <div className="flex flex-wrap items-center gap-6 mt-4">
              <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-[0.2em] flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Établi le : <span className="text-gray-900">{new Date().toLocaleDateString('fr-FR')}</span>
              </p>
              <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-[0.2em] flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                État : <span className="text-emerald-600 font-black px-2 py-0.5 bg-emerald-50 rounded italic">{initialData?.status || QuoteStatus.PENDING}</span>
              </p>
            </div>
          </div>

          {/* 2. RESTRUCTURED FLEX ROW WITH TWO BOXES SIDE-BY-SIDE */}
          <div className="flex flex-col md:flex-row justify-between items-stretch gap-8 border-b border-gray-50 pb-10">

            {/* COMPANY INFO BOX (LEFT) */}
            <div className="w-full md:w-1/2 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex flex-col space-y-4 relative overflow-hidden group hover:border-blue-200 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
              <div className="space-y-2 relative z-10">
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-500 whitespace-nowrap min-w-[140px] uppercase">UNITE :</span>
                  <span className="text-blue-600 font-black uppercase tracking-tight">{activeUnit?.name || '---'}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-500 whitespace-nowrap min-w-[140px] uppercase">CENTRE :</span>
                  <span className="text-gray-900 font-black uppercase tracking-tight">{activeCentre?.name || '---'}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-500 whitespace-nowrap min-w-[140px] uppercase underline decoration-gray-200 decoration-2">Adresse :</span>
                  <span className="text-gray-700 font-medium">{activeCentre?.address || '---'}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 mt-2 space-y-2">
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-400 whitespace-nowrap min-w-[140px] uppercase">Tél :</span>
                    <span className="text-gray-700 font-bold">{activeCentre?.phone || '---'}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-400 whitespace-nowrap min-w-[140px] uppercase">Fax :</span>
                    <span className="text-gray-700 font-bold">{activeCentre?.fax || '---'}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-400 whitespace-nowrap min-w-[140px] uppercase">Email :</span>
                    <span className="text-blue-500 font-bold truncate lowercase">{activeCentre?.email || '---'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CLIENT INFO BOX (RIGHT) - Restyled to match precisely */}
            <div className="w-full md:w-[450px] bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex flex-col space-y-4 relative overflow-hidden group hover:border-emerald-200 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
              <div className="space-y-2 relative z-10">
                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-500 whitespace-nowrap min-w-[140px] uppercase">DOIT A :</span>
                  <span className="text-gray-800 font-black uppercase tracking-tight">{formData.civility} {formData.clientName || formData.businessName || '……………………….'}</span>
                </div>

                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-500 whitespace-nowrap min-w-[140px] uppercase underline decoration-gray-200 decoration-2">Adresse :</span>
                  <span className="text-gray-700 font-medium">{formData.address || '…………………………………………….'}</span>
                </div>

                <div className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-500 whitespace-nowrap min-w-[140px] uppercase">Commune :</span>
                  <span className="text-gray-700 font-medium">{formData.commune || '……………………….'}</span>
                </div>

                <div className="pt-2 border-t border-gray-100 mt-2 space-y-2">
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-400 whitespace-nowrap min-w-[140px] uppercase">Tél :</span>
                    <span className="text-gray-700 font-bold">{formData.clientPhone || '……………………….'}</span>
                  </div>

                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-400 whitespace-nowrap min-w-[140px] uppercase">Fax :</span>
                    <span className="text-gray-700 font-bold">{formData.clientFax || '……………………….'}</span>
                  </div>

                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-400 whitespace-nowrap min-w-[140px] uppercase">Email :</span>
                    <span className="text-gray-700 font-bold truncate lowercase">{formData.clientEmail || '……………………….'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="-mt-10">
            <div className="flex items-center gap-3 group relative max-w-2xl">
              <input
                type="text"
                placeholder="Nature de la demande"
                className="w-full bg-gray-50 border-none rounded-lg p-3 text-lg font-medium text-gray-700 cursor-default select-none"
                value={formData.serviceType}
                readOnly
              />
              <div className="flex gap-2">
                <button type="button" className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button type="button" className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Table Section (Quote Details) */}
          <div className="space-y-4">
            <h3 className="text-[#1e90ff] font-extrabold text-sm uppercase pl-2 tracking-wide">Details du Devis</h3>

            {/* Champs techniques conditionnels selon le type de travaux */}
            {workTypeConfig.requiresTechnicalDetails && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Informations Techniques
                </h4>

                {workTypeConfig.showBranchementType && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Type de branchement
                    </label>
                    <select
                      value={formData.branchementType}
                      onChange={e => setFormData({ ...formData, branchementType: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-white text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="Domestique (Maison individuelle)">Domestique (Maison individuelle)</option>
                      <option value="Immeuble collectif">Immeuble collectif</option>
                      <option value="Commerciaux">Commerciaux</option>
                      <option value="Industrie ou tourisme">Industrie ou tourisme</option>
                      <option value="Besoins de chantier">Besoins de chantier</option>
                      <option value="Borne d'incendie">Borne d'incendie</option>
                      <option value="Autres (à préciser)">Autres (à préciser)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workTypeConfig.showDiameter && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                        Diamètre (mm)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 20, 25, 32..."
                        value={formData.diameter}
                        onChange={e => setFormData({ ...formData, diameter: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-white text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </div>
                  )}

                  {workTypeConfig.showFlowRate && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                        Débit (m³/h)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 1.5, 2.0, 3.0..."
                        value={formData.flowRate}
                        onChange={e => setFormData({ ...formData, flowRate: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-white text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </div>
                  )}
                </div>

                {workTypeConfig.showBranchementType && formData.branchementType === 'Autres (à préciser)' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Précisions
                    </label>
                    <textarea
                      rows={2}
                      value={formData.branchementDetails}
                      onChange={e => setFormData({ ...formData, branchementDetails: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-white text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      placeholder="Décrivez le type de branchement..."
                    />
                  </div>
                )}
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-[#1e90ff] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-[11px] uppercase tracking-wider rounded-tl-xl w-1/2">Description</th>
                    <th className="px-4 py-4 text-center font-bold text-[11px] uppercase tracking-wider w-20">Unité</th>
                    <th className="px-4 py-4 text-center font-bold text-[11px] uppercase tracking-wider w-20">Qté</th>
                    <th className="px-4 py-4 text-center font-bold text-[11px] uppercase tracking-wider w-36">Prix Unit (DZD)</th>
                    <th className="px-4 py-4 text-center font-bold text-[11px] uppercase tracking-wider w-16">TVA</th>
                    <th className="px-6 py-4 text-right font-bold text-[11px] uppercase tracking-wider w-44 rounded-tr-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          Aucun article ajouté. Cliquez sur le bouton "Ajouter" pour commencer.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-4 py-4">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Description de l'article"
                              className="w-full border border-gray-200 rounded-md p-2.5 text-[13px] bg-white text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                              value={searchTerm[index] || item.description}
                              onChange={e => {
                                const value = e.target.value;
                                setSearchTerm(prev => ({ ...prev, [index]: value }));
                                updateItem(index, 'description', value);
                                filterArticles(value, index);
                              }}
                              onFocus={() => {
                                filterArticles(searchTerm[index] || '', index);
                              }}
                              onBlur={() => setTimeout(() => {
                                setShowArticleDropdown(prev => ({ ...prev, [index]: false }));
                              }, 200)}
                            />
                            {showArticleDropdown[index] && filteredArticles.length > 0 && (
                              <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {filteredArticles.map((article, idx) => (
                                  <div
                                    key={idx}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
                                    onMouseDown={() => handleArticleSelect(article, index)}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-700">{article.name}</span>
                                      <span className="text-[10px] text-gray-400 font-medium">{article.category}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                      {article.prices[0]?.price || 0} DA
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-4 text-center border-b border-gray-100">
                          <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">
                            {item.unit || 'U'}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded-md p-2.5 text-[13px] bg-white text-center text-gray-700 focus:border-blue-400 transition-all font-medium"
                            value={item.quantity}
                            onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-2 py-4">
                          <input
                            type="number"
                            className="w-full border border-gray-200 rounded-md p-2.5 text-[13px] bg-white text-center text-gray-700 focus:border-blue-400 transition-all font-semibold cursor-pointer"
                            value={item.unitPrice}
                            onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            onDoubleClick={() => {
                              const article = articles.find(a => a.name === item.description);
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
                            title="Double-cliquez pour choisir le type de prix"
                          />
                        </td>
                        <td className="px-2 py-4">
                          <div className="relative">
                            <input
                              type="number"
                              className="w-full border border-gray-200 rounded-md p-2.5 text-[13px] bg-white text-center text-gray-700 focus:border-blue-400 transition-all font-medium"
                              value={item.tva}
                              onChange={e => updateItem(index, 'tva', parseFloat(e.target.value) || 0)}
                            />
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-300">%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-4">
                            <span className="text-blue-600 font-bold text-[14px] whitespace-nowrap">
                              {(item.totalHT || 0).toFixed(2)} DZD
                            </span>
                            <div className="flex items-center gap-2">

                              <button
                                type="button"
                                onClick={() => setItems(items.filter((_, i) => i !== index))}
                                className="p-2 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors shadow-sm"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="py-2">
              <button
                type="button"
                onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0, unit: 'U', margin: 0, tva: defaultTva, totalHT: 0 }])}
                className="bg-transparent border-[1.5px] border-dashed border-[#1e90ff] text-[#1e90ff] rounded-[4px] px-[18px] py-[6px] text-[13px] font-semibold cursor-pointer tracking-[0.3px] hover:bg-blue-50 transition-colors flex items-center gap-2 mt-2"
              >
                <span>+</span> Ajouter une ligne
              </button>
            </div>
          </div>

          {/* Footer Section: Payment & Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-10 border-t border-gray-50">
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-700">Conditions de paiement</h3>
                </div>
                <p className="text-xs text-gray-500">Méthodes de paiement acceptées : {formData.paymentConditions}</p>
                <div className="bg-white border-l-2 border-red-400 p-3 space-y-1">
                  <p className="text-xs text-red-500 font-medium">Acompte de 30,00 % à la signature soit {(total * 0.3).toLocaleString()} DA TTC</p>
                  <p className="text-xs text-red-500">Reste à facturer : {(total * 0.7).toLocaleString()} DA TTC</p>
                </div>
                <div className="border border-gray-100 p-4 rounded-lg space-y-1 text-xs">
                  <p><span className="font-semibold text-gray-400">IBAN :</span> <span className="text-gray-600">{formData.iban}</span></p>
                  <p><span className="font-semibold text-gray-400">BIC :</span> <span className="text-gray-600">{formData.bic}</span></p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-700">Gestion des déchets</h3>
                </div>
                <p className="text-xs text-blue-500 underline cursor-pointer">{formData.wasteManagement}</p>
              </div>
            </div>

            <div className="space-y-1 flex flex-col items-end">
              <div className="w-full max-w-[400px] space-y-4">
                <div className="space-y-1.5 border-b border-gray-50 pb-3 px-4 text-xs font-semibold">
                  <div className="flex justify-between text-gray-500"><span>Sous-total HT</span><span className="text-gray-700">{subtotal.toLocaleString()} DA</span></div>
                  <div className="flex justify-between text-gray-500"><span>Montant TVA</span><span className="text-gray-700">{tax.toLocaleString()} DA</span></div>
                </div>

                <div className="bg-[#1e90ff] text-white p-4 rounded-xl flex justify-between items-center shadow-lg shadow-blue-100 ring-4 ring-blue-50/10 mx-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Total Global</span>
                    <span className="text-base font-black mt-0.5 leading-none">Net à Payer</span>
                  </div>
                  <span className="text-2xl font-black tracking-tighter">{total.toLocaleString()} DA</span>
                </div>



              </div>

              <div className="pt-10 flex gap-4 w-full justify-end">
                <button type="button" onClick={onCancel} className="px-6 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">Annuler</button>
                {!isReadOnly && (
                  <button type="button" onClick={() => setActiveTab('preview')} className="px-6 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all">Aperçu</button>
                )}
                <button
                  type="submit"
                  disabled={items.length === 0 || total === 0}
                  className={`px-8 py-3 text-xs font-bold rounded-lg shadow-lg transition-all ${(items.length === 0 || total === 0)
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-60 shadow-none'
                    : 'bg-[#1e90ff] text-white shadow-blue-100 hover:bg-blue-600'
                    }`}
                >
                  VALIDER ET ENREGISTRER
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Printing Style Orchestration - MOVED OUTSIDE FOR ABSOLUTE PROTECTION */}
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
          /* Isolation: Hide all non-print elements */
          .print-hidden, nav, footer, .sidebar, .no-print, form, .bg-gray-50 {
            display: none !important;
          }
          /* Document container */
          .quote-print-doc {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 15mm !important;
            margin: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: 1.2mm solid black !important;
            border-radius: 10mm !important;
            position: absolute;
            left: 0;
            top: 0;
            overflow: hidden;
            display: ${isFullyApproved ? 'block' : 'none'} !important;
          }
          
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

      <div className={activeTab === 'preview' ? 'block animate-in fade-in duration-500' : 'hidden'}>
        <div className={`quote-print-doc bg-white w-full max-w-[210mm] mx-auto p-[15mm] text-slate-900 block-print-unapproved`} style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          {/* Watermark for non-approved quotes */}
          {initialData?.status !== QuoteStatus.APPROVED && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
              <div className="text-gray-200 text-[120px] font-black uppercase tracking-[0.2em] -rotate-45 whitespace-nowrap opacity-40">
                NON VALIDÉ
              </div>
            </div>
          )}

          {/* Republic Text */}
          <div className="text-center font-bold text-[13px] mb-2 uppercase">
            الجمهورية الجزائرية الديمقراطية الشعبية
          </div>

          {/* === HEADER (3 colonnes) === */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-[10px] font-bold text-left leading-tight w-1/3">
              Ministère des ressources en eau<br />
              E.P ALGERIENNE DES EAUX
            </div>
            <div className="flex flex-col items-center w-1/3">
              <img src="/ade.png" alt="ADE" className="h-16 w-auto object-contain mb-1" />
            </div>
            <div className="text-[10px] font-bold text-right leading-tight w-1/3" dir="rtl">
              وزارة المــــوارد المائيــــــة<br />
              الجزائريــــــة للميــــــــــاه
            </div>
          </div>

          {/* Header Bar */}
          <div className="bg-gray-100 border border-gray-400 p-2 mb-6" style={{ borderRadius: '8px' }}>
            <div className="flex justify-between font-bold text-[11px] mb-1">
              <span>Zone d'Alger</span>
              <span>Unité de {activeUnit?.name || '................'}</span>
            </div>
            <div className="text-[10px] text-center leading-relaxed font-medium">
              Siège social : {activeUnit?.address || activeCentre?.address || '...........................'} . Tél: {activeUnit?.phone || activeCentre?.phone || '.............'} Fax: {activeUnit?.fax || activeCentre?.fax || '.............'}<br />
              R.C: {activeUnit?.rc || '..................'} &nbsp;&nbsp;&nbsp; I.F (NIF): {activeUnit?.nif || '..................'} &nbsp;&nbsp;&nbsp; A.I: {activeUnit?.ai || '..................'}
            </div>
          </div>

          {/* Title & Ref Section - Using grid to prevent overlaps */}
          <div className="grid grid-cols-2 gap-6 mb-8 items-start">
            <div className="space-y-6">
              <div>
                <span className="font-bold text-[11px] border-b border-black inline-block pb-0.5">Centre de {activeCentre?.name || '................'}</span>
              </div>
              <div>
                <h1 className="font-black text-[13px] border-b-[2px] border-black inline-block pb-1 uppercase tracking-tight leading-tight">
                  DEVIS QUANTITATIF ET ESTIMATIF
                </h1>
                <div className="text-[11px] font-bold mt-3">
                  N°: {initialData?.id && !initialData.id.startsWith('TEMP-') && !initialData.id.startsWith('AEP-')
                    ? initialData.id
                    : getNextQuoteNumber()} du: {new Date().toLocaleDateString('fr-DZ')}
                </div>
              </div>
            </div>

            <div className="w-fit min-w-[85mm] max-w-full ml-auto border border-gray-400 p-4 min-h-[45mm] shadow-sm bg-white" style={{ borderRadius: '8px' }}>
              <div className="text-[11px] leading-relaxed text-gray-900">
                <div className="mb-3"><span className="font-bold uppercase pr-2">Doit A :</span> <span className="font-black uppercase">{isLegal ? formData.businessName : `${formData.civility || ''} ${formData.clientName}`.trim()}</span></div>
                <div className="mb-1.5"><span className="font-bold pr-2">Adresse :</span> <span className="uppercase">{formData.installationAddress ? formData.installationAddress : '...........................................'}</span></div>
                <div className="mb-1.5"><span className="font-bold pr-2">Commune :</span> <span className="uppercase">{formData.installationCommune ? formData.installationCommune : '...................................'}</span></div>
                <div className="mb-1.5"><span className="font-bold pr-2">Tél :</span> <span className="uppercase">{formData.clientPhone ? formData.clientPhone : '...........................................'}</span></div>
                <div className="mb-1.5"><span className="font-bold pr-2">Fax :</span> <span className="uppercase">.........................................</span></div>
              </div>
            </div>
          </div>

          {/* Title Section - Dynamic based on work type */}
          <div className="mb-6 pt-4 space-y-2">
            <div>
              <span className="font-black text-[11px] uppercase border-b border-black pb-0.5">OBJET :</span>
              <span className="text-[11px] ml-2 leading-relaxed">{formData.serviceType}</span>
            </div>
            {formData.projectTitle && (
              <div>
                <span className="font-bold text-[11px] lowercase italic">Désignation :</span>
                <span className="font-medium text-[11px] ml-2 uppercase leading-relaxed">{formData.projectTitle}</span>
              </div>
            )}
            {formData.description && (
              <div>
                <span className="font-bold text-[11px] lowercase italic">Description :</span>
                <span className="font-medium text-[11px] ml-2 leading-relaxed">{formData.description}</span>
              </div>
            )}
            {/* Technical details for specific work types */}
            {workTypeConfig.showBranchementType && formData.branchementType && (
              <div>
                <span className="font-bold text-[11px] lowercase italic">Type de branchement :</span>
                <span className="font-medium text-[11px] ml-2 uppercase leading-relaxed">{formData.branchementType}</span>
              </div>
            )}
            {workTypeConfig.showDiameter && formData.diameter && (
              <div>
                <span className="font-bold text-[11px] lowercase italic">Diamètre :</span>
                <span className="font-medium text-[11px] ml-2 uppercase leading-relaxed">{formData.diameter}</span>
              </div>
            )}
            {workTypeConfig.showFlowRate && formData.flowRate && (
              <div>
                <span className="font-bold text-[11px] lowercase italic">Débit :</span>
                <span className="font-medium text-[11px] ml-2 uppercase leading-relaxed">{formData.flowRate}</span>
              </div>
            )}
          </div>

          {/* Table */}
          {/* Table Wrap for Border Radius */}
          <div className="mb-6 overflow-hidden border border-gray-400" style={{ borderRadius: '8px' }}>
            <table className="w-full border-collapse font-sans text-[11px]">
              <thead>
                <tr className="bg-gray-100 font-bold uppercase text-[10px]">
                  <th className="border-b border-r border-gray-400 p-2 text-left">Désignation des travaux</th>
                  <th className="border-b border-r border-gray-400 p-2 text-center w-16">Unité</th>
                  <th className="border-b border-r border-gray-400 p-2 text-center w-16">Qtité</th>
                  <th className="border-b border-r border-gray-400 p-2 text-right w-24">P.U (HT)</th>
                  <th className="border-b border-gray-400 p-2 text-right w-28">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const unit = item.unit || 'U';

                  return (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="border-b border-r border-gray-400 px-2 py-1.5 font-medium">
                        {item.priceTypeIndicator && (
                          <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                            {item.priceTypeIndicator}
                          </span>
                        )}
                        {item.description}
                      </td>
                      <td className="border-b border-r border-gray-400 px-2 py-1.5 text-center">{unit}</td>
                      <td className="border-b border-r border-gray-400 px-2 py-1.5 text-center font-bold">{item.quantity}</td>
                      <td className="border-b border-r border-gray-400 px-2 py-1.5 text-right whitespace-nowrap">{item.unitPrice.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                      <td className="border-b border-gray-400 px-2 py-1.5 text-right font-bold whitespace-nowrap">{(item.totalHT || 0).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td rowSpan={2 + Math.max(1, tvaSummaries.length)} className="border-r border-gray-400 p-1.5 text-left align-top leading-tight space-y-0.5">
                    <p>Compte CCP N°: <span className="font-bold">{activeCentre?.comptePostale || activeUnit?.comptePostale || '...........................'}</span></p>
                    <p>Compte <span className="font-bold">{activeCentre?.bankName || activeUnit?.bankName || '..........'}</span> N°: <span className="font-bold">{activeCentre?.bankAccount || activeUnit?.bankAccount || '...........................'}</span></p>
                    <p>Mode de paiement : Chèque,Espece,versement</p>
                  </td>
                  <td colSpan={3} className="border-b border-r border-gray-400 font-bold p-2 text-left uppercase text-gray-600">Total HT</td>
                  <td colSpan={1} className="border-b border-gray-400 p-2 text-right font-black text-[12px]">
                    {subtotal.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                {(tvaSummaries.length > 0 ? tvaSummaries : [[defaultTva, tax]]).map(([rate, amount], idx) => (
                  <tr key={idx}>
                    <td colSpan={3} className="border-b border-r border-gray-400 font-bold p-2 text-left uppercase text-gray-600">
                      TVA {rate}%
                    </td>
                    <td colSpan={1} className="border-b border-gray-400 p-2 text-right font-bold">
                      {amount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 text-gray-900">
                  <td colSpan={3} className="font-black p-2 text-left uppercase text-[12px] border-r border-gray-400">NET A PAYER (TTC)</td>
                  <td colSpan={1} className="p-2 text-right font-black text-[11px] tracking-tight">
                    {total.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Validity Note - Dynamic based on work type */}
          <div className="mt-8 text-[11px] space-y-3">
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="font-black text-[11px] tracking-tight capitalize leading-relaxed">
                {numberToFrenchLetters(total).toLowerCase()}.
              </p>
            </div>
            <p className="italic text-[9px] text-gray-500">
              {workTypeConfig.isAudit
                ? 'Nb: Ce devis est valable pour une durée de 03 mois à compter de sa date d\'établissement.'
                : workTypeConfig.isReparation
                  ? 'Nb: Ce devis est valable pour une durée de 02 mois à compter de sa date d\'établissement.'
                  : 'Nb: Ce devis est valable pour une durée de 01 mois à compter de sa date d\'établissement.'}
            </p>
          </div>

          {/* Dynamic Signatures Section - Based on work type and validation roles */}
          <div className="mt-12 space-y-8">
            {/* Show Chef Agence signature for most work types */}
            {(workTypeConfig.isBranchement || workTypeConfig.isReparation || workTypeConfig.isChangement || workTypeConfig.isDeménagement) && (
              <div className="flex justify-end">
                <div className="text-center w-64">
                  <p className="font-black text-[11px] border-b-2 border-black inline-block pb-1 uppercase tracking-widest mb-16">
                    LE CHEF D'AGENCE COMMERCIALE
                  </p>
                  <div className="text-[9px] text-gray-400 italic">(Nom, Signature et Cachet)</div>
                </div>
              </div>
            )}

            {/* Show Chef Centre signature for audit and complex works */}
            {(workTypeConfig.isAudit || workTypeConfig.isRésiliation || workTypeConfig.isFermeture) && (
              <div className="flex justify-end">
                <div className="text-center w-64">
                  <p className="font-black text-[11px] border-b-2 border-black inline-block pb-1 uppercase tracking-widest mb-16">
                    LE CHEF DE CENTRE
                  </p>
                  <div className="text-[9px] text-gray-400 italic">(Nom, Signature et Cachet)</div>
                </div>
              </div>
            )}

            {/* Show Technico-Commercial for technical works */}
            {workTypeConfig.isAudit && (
              <div className="flex justify-end">
                <div className="text-center w-64">
                  <p className="font-black text-[11px] border-b-2 border-black inline-block pb-1 uppercase tracking-widest mb-16">
                    LE RESPONSABLE TECHNIQUE
                  </p>
                  <div className="text-[9px] text-gray-400 italic">(Nom, Signature et Cachet)</div>
                </div>
              </div>
            )}

            {/* Default signature if no specific type matched */}
            {!workTypeConfig.isBranchement &&
              !workTypeConfig.isReparation &&
              !workTypeConfig.isChangement &&
              !workTypeConfig.isDeménagement &&
              !workTypeConfig.isAudit &&
              !workTypeConfig.isRésiliation &&
              !workTypeConfig.isFermeture && (
                <div className="flex justify-end">
                  <div className="text-center w-64">
                    <p className="font-black text-[11px] border-b-2 border-black inline-block pb-1 uppercase tracking-widest mb-16">
                      LE RESPONSABLE
                    </p>
                    <div className="text-[9px] text-gray-400 italic">(Nom, Signature et Cachet)</div>
                  </div>
                </div>
              )}
          </div>

          {/* Final footer watermark for screen only */}
          <div className="mt-auto pt-10 text-[8px] text-gray-300 italic flex justify-between print:hidden">
            <span>Généré par ADE-MANAGER — Document Officiel</span>
            <span>Date système : {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 mb-10 max-w-4xl mx-auto print:hidden">
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

        {/* Floating return button to keep preview clean */}
        <button
          onClick={() => setActiveTab('form')}
          className="fixed bottom-8 right-8 z-[110] bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5L6 10L11 15M6 10H18" /></svg>
          Retour à l'édition
        </button>
      </div>
    </div>
  );
};
