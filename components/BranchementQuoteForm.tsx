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
    { description: '', quantity: 1, unitPrice: 0 },
    { description: '', quantity: 1, unitPrice: 0 },
    { description: '', quantity: 1, unitPrice: 0 }
  ]);

  const [taxRate, setTaxRate] = useState(19); // 19% TVA

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoadingArticles(true);
    try {
      const data = await ArticleService.getArticles();
      setArticles(data);
      
      // Si aucun article n'existe, charger les articles par défaut
      if (data.length === 0) {
        const defaultArticles = ArticleService.getDefaultBranchementArticles();
        setArticles(defaultArticles);
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
    } finally {
      setLoadingArticles(false);
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

  return (
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
            <div key={index} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl">
              <div className="col-span-5">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  className="w-full rounded-lg border-gray-200 p-2 text-sm font-bold border bg-white"
                  placeholder="Description de l'article"
                  required
                />
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
              
              <div className="col-span-3">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Prix Unitaire (DZD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
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
                <p className="font-black text-emerald-600">
                  {(item.quantity * item.unitPrice).toFixed(2)} DZD
                </p>
              </div>
              
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50"
                  title="Supprimer cet article"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter un article
          </button>
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
  );
};