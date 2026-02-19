import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Article, ArticlePrice, ArticleProperty, PropertyType } from '../types';
import { ArticleService } from '../services/articleService';
import { DbService } from '../services/dbService';

interface ArticleManagerProps {
  onBack: () => void;
}

export const ArticleManager: React.FC<ArticleManagerProps> = ({ onBack }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | undefined>(undefined);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CANALISATIONS (TUBES PEHD)',
    unit: 'U' as 'M²' | 'M3' | 'ML' | 'U' | 'NULL',
    material: '',
    class: '',
    nominalPressure: '',
    color: ''
  });
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  const [articlePrices, setArticlePrices] = useState<ArticlePrice[]>([
    { type: 'fourniture', price: 0 },
    { type: 'pose', price: 0 },
    { type: 'prestation', price: 0 }
  ]);


  const categories = ['TRAVAUX DE TERRASSEMENT & VOIRIE', 'CANALISATIONS (TUBES PEHD)', 'PIÈCES SPÉCIALES', 'DIVERS & PRESTATIONS', 'Comptage', 'Cautionnement pour Branchement'];
  
  // Matériaux prédéfinis + matières personnalisées
  const [customMaterials, setCustomMaterials] = useState<string[]>([]);
  const predefinedMaterials = ['Acier', 'PEHD', 'Tigre', 'PVC', 'Cuivre', 'Fonte', 'Inox', 'Aluminium'];
  const allMaterials = [...predefinedMaterials, ...customMaterials];
  


  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await ArticleService.getArticles();
      setArticles(data);
      
      // Vérifier si des articles ont besoin de migration de matière
      const articlesWithoutMaterial = data.filter(article => !article.material);
      if (articlesWithoutMaterial.length > 0) {
        // Exécuter la migration automatiquement
        await DbService.migrateArticlesWithMaterial();
        // Recharger les articles après migration
        const updatedData = await ArticleService.getArticles();
        setArticles(updatedData);
      }
    } catch (error) {
      console.error('Erreur chargement articles:', error);
      Swal.fire('Erreur', 'Impossible de charger les articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || articlePrices.every(price => price.price <= 0)) {
      Swal.fire('Formulaire incomplet', 'Veuillez remplir le nom et au moins un prix', 'warning');
      return;
    }

    try {
      const validPrices = articlePrices.filter(price => price.price > 0);
      
      // Déterminer le type de prix par défaut : pose si disponible, sinon prestation
      let defaultPriceType: 'fourniture' | 'pose' | 'prestation' | undefined;
      if (validPrices.some(p => p.type === 'pose')) {
        defaultPriceType = 'pose';
      } else if (validPrices.some(p => p.type === 'prestation')) {
        defaultPriceType = 'prestation';
      } else if (validPrices.some(p => p.type === 'fourniture')) {
        defaultPriceType = 'fourniture';
      }
      
      const article: Article = {
        id: editingArticle?.id || `ART-${Date.now()}`,
        ...formData,
        prices: validPrices,
        defaultPriceType,
        createdAt: editingArticle?.createdAt || new Date().toISOString()
      };

      await ArticleService.saveArticle(article);
      await loadArticles();
      
      Swal.fire({
        title: editingArticle ? 'Article mis à jour' : 'Article ajouté',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Swal.fire('Erreur', 'Impossible de sauvegarder l\'article', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Supprimer cet article ?',
      text: 'Cette action est irréversible',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await ArticleService.deleteArticle(id);
        await loadArticles();
        Swal.fire('Supprimé !', 'L\'article a été supprimé', 'success');
      } catch (error) {
        console.error('Erreur suppression:', error);
        Swal.fire('Erreur', 'Impossible de supprimer l\'article', 'error');
      }
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      name: article.name,
      description: article.description,
      category: article.category,
      unit: article.unit || 'U',
      material: article.material || '',
      class: article.class || '',
      nominalPressure: article.nominalPressure || '',
      color: article.color || ''
    });
    
    // Initialiser les prix avec les valeurs existantes
    const initialPrices: ArticlePrice[] = [
      { type: 'fourniture', price: 0 },
      { type: 'pose', price: 0 },
      { type: 'prestation', price: 0 }
    ];
    
    article.prices.forEach(price => {
      const existingPrice = initialPrices.find(p => p.type === price.type);
      if (existingPrice) {
        existingPrice.price = price.price;
      }
    });
    
    setArticlePrices(initialPrices);
    setShowForm(true);
    
    // Faire défiler doucement vers le formulaire
    setTimeout(() => {
      const formElement = document.getElementById('article-form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const resetForm = () => {
    setEditingArticle(undefined);
    setFormData({
      name: '',
      description: '',
      category: 'CANALISATIONS (TUBES PEHD)', // Valeur par défaut pour la liste déroulante catégorie
      unit: 'U', // Valeur par défaut pour la liste déroulante unité
      material: '', // Champ texte vidé mais la liste des matériaux reste accessible
      class: '', // Champ texte vidé mais la liste des classes reste accessible
      nominalPressure: '', // Champ texte vidé mais la liste des pressions reste accessible
      color: '' // Champ texte vidé mais la liste des couleurs reste accessible
    });
    setArticlePrices([
      { type: 'fourniture', price: 0 },
      { type: 'pose', price: 0 },
      { type: 'prestation', price: 0 }
    ]);
    setShowForm(false);
    setShowAddMaterial(false);
    setNewMaterial('');
  };

  const handleAddMaterial = () => {
    if (newMaterial.trim() && !allMaterials.includes(newMaterial.trim())) {
      setCustomMaterials(prev => [...prev, newMaterial.trim()]);
      setFormData({...formData, material: newMaterial.trim()});
      setNewMaterial('');
      setShowAddMaterial(false);
      Swal.fire('Matière ajoutée', `La matière "${newMaterial.trim()}" a été ajoutée avec succès`, 'success');
    }
  };

  const handleMaterialSelect = (material: string) => {
    setFormData({...formData, material});
    setShowAddMaterial(false);
  };

  const getPropertySuggestions = (type: PropertyType) => {
    return [];
  };

  const getPropertyTypeLabel = (type: PropertyType) => {
    return type;
  };

  const getUnitForType = (type: PropertyType) => {
    switch (type) {
      case PropertyType.DIAMETER:
        return 'mm';
      case PropertyType.LENGTH:
        return 'm';
      case PropertyType.WEIGHT:
        return 'kg';
      case PropertyType.PRESSURE:
        return 'bar';
      default:
        return '';
    }
  };

  const handlePriceChange = (index: number, value: string | number) => {
    const newPrices = [...articlePrices];
    newPrices[index] = { ...newPrices[index], price: Number(value) || 0 };
    setArticlePrices(newPrices);
  };

  const priceTypes = [
    { type: 'fourniture', label: 'Fourniture', color: 'blue' },
    { type: 'pose', label: 'Pose', color: 'emerald' },
    { type: 'prestation', label: 'Prestation', color: 'purple' }
  ] as const;

  const loadDefaultArticles = async () => {
    const result = await Swal.fire({
      title: 'Charger les articles par défaut ?',
      text: 'Cela ajoutera les articles standards pour les branchements',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, charger',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        const defaultArticles = ArticleService.getDefaultBranchementArticles();
        for (const article of defaultArticles) {
          await ArticleService.saveArticle(article);
        }
        await loadArticles();
        Swal.fire('Articles chargés !', 'Les articles par défaut ont été ajoutés', 'success');
      } catch (error) {
        console.error('Erreur chargement défaut:', error);
        Swal.fire('Erreur', 'Impossible de charger les articles par défaut', 'error');
      }
    }
  };

  const addTubesPEHD = async () => {
    const result = await Swal.fire({
      title: 'Ajouter les tubes PEHD ?',
      text: 'Ceci ajoutera tous les tubes PEHD de différentes tailles et classes.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, ajouter',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        const tubesPEHD = [
          { designation: 'Tubes PEHD PN10 Ø20', unite: 'ML', diametre: '20', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø25', unite: 'ML', diametre: '25', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø32', unite: 'ML', diametre: '32', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø40', unite: 'ML', diametre: '40', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø50', unite: 'ML', diametre: '50', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø63', unite: 'ML', diametre: '63', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø75', unite: 'ML', diametre: '75', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø90', unite: 'ML', diametre: '90', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø110', unite: 'ML', diametre: '110', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø125', unite: 'ML', diametre: '125', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN10 Ø160', unite: 'ML', diametre: '160', matiere: 'PEHD', classe: 'PN10', pression: '10', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø20', unite: 'ML', diametre: '20', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø25', unite: 'ML', diametre: '25', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø32', unite: 'ML', diametre: '32', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø40', unite: 'ML', diametre: '40', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø50', unite: 'ML', diametre: '50', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø63', unite: 'ML', diametre: '63', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø75', unite: 'ML', diametre: '75', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø90', unite: 'ML', diametre: '90', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø110', unite: 'ML', diametre: '110', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø125', unite: 'ML', diametre: '125', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø160', unite: 'ML', diametre: '160', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø200', unite: 'ML', diametre: '200', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø250', unite: 'ML', diametre: '250', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Tubes PEHD PN16 Ø315', unite: 'ML', diametre: '315', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null }
        ];

        for (const tube of tubesPEHD) {
          const article: Article = {
            id: `ART-TUBE-${tube.designation.replace(/\s+/g, '-').replace(/[Ø]/g, 'D')}-${Date.now()}`,
            name: tube.designation,
            description: `Tube en PEHD diamètre ${tube.diametre}mm, classe ${tube.classe}, pression nominale ${tube.pression}`,
            prices: [
              { type: 'fourniture' as const, price: 0 }, // Prix à définir selon les besoins
              { type: 'pose' as const, price: 0 }        // Prix à définir selon les besoins
            ],
            category: 'TRAVAUX DE TERRASSEMENT & VOIRIE',
            unit: tube.unite as 'M²' | 'M3' | 'ML' | 'U' | 'NULL',
            material: tube.matiere,
            class: tube.classe,
            nominalPressure: tube.pression,
            color: tube.couleur || undefined,
            createdAt: new Date().toISOString(),
            defaultPriceType: 'fourniture' as const
          };

          await ArticleService.saveArticle(article);
        }

        await loadArticles(); // Recharger la liste des articles

        Swal.fire('Succès', 'Les tubes PEHD ont été ajoutés avec succès !', 'success');
      } catch (error) {
        console.error('Erreur lors de l\'ajout des tubes PEHD:', error);
        Swal.fire('Erreur', 'Impossible d\'ajouter les tubes PEHD', 'error');
      }
    }
  };

  const addSpecialPieces = async () => {
    const result = await Swal.fire({
      title: 'Ajouter les pièces spéciales ?',
      text: 'Ceci ajoutera toutes les pièces spéciales de différentes tailles et types.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, ajouter',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        const specialPieces = [
          { designation: 'Collier de Prise en Charge PEHD Ø 32 3/4" (25)', unite: 'U', diametre: '32', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 40 3/4" (25)', unite: 'U', diametre: '40', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 50 3/4" (25)', unite: 'U', diametre: '50', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 63 1.1/2" (50)', unite: 'U', diametre: '63', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 63 3/4" (25)', unite: 'U', diametre: '63', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 75 1/2" (50)', unite: 'U', diametre: '75', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 75 3/4" (25)', unite: 'U', diametre: '75', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 90 1/2" (50)', unite: 'U', diametre: '90', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 90 3/4" (25)', unite: 'U', diametre: '90', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 110 3/4" (25)', unite: 'U', diametre: '110', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 110 1/2" (50)', unite: 'U', diametre: '110', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 110 2" (63)', unite: 'U', diametre: '110', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 125 3/4" (25)', unite: 'U', diametre: '125', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 125 1/4" (40)', unite: 'U', diametre: '125', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 125 1/2" (50)', unite: 'U', diametre: '125', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 160 1.1/2 (50)', unite: 'U', diametre: '160', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 160 2" (63)', unite: 'U', diametre: '160', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 160 3/4" (25)', unite: 'U', diametre: '160', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 200 3/4" (25)', unite: 'U', diametre: '200', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 200 1.1/2" (50)', unite: 'U', diametre: '200', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 200 2" (63)', unite: 'U', diametre: '200', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 250X 3/4" (25)', unite: 'U', diametre: '250', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 250X 1.1/4" (40)', unite: 'U', diametre: '250', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 250X 2" (63)', unite: 'U', diametre: '250', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 250X 1.1/2" (50)', unite: 'U', diametre: '250', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 315X 1/2" (50)', unite: 'U', diametre: '315', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 315X 3/4" (25)', unite: 'U', diametre: '315', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 315X 1.1/4" (40)', unite: 'U', diametre: '315', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 315X 1.1/2" (50)', unite: 'U', diametre: '315', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 315X 2" (63)', unite: 'U', diametre: '315', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 315X 3" (75)', unite: 'U', diametre: '315', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 350X 3/4" (25)', unite: 'U', diametre: '350', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 350X 4" (110)', unite: 'U', diametre: '350', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 350X 1.1/2" (50)', unite: 'U', diametre: '350', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 350X 2" (63)', unite: 'U', diametre: '350', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 350X 3" (75)', unite: 'U', diametre: '350', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 350X 1.1/2" (50)', unite: 'U', diametre: '350', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge PEHD Ø 350X 4" (110)', unite: 'U', diametre: '350', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Collier de Prise en Charge ACIER Ø 40/33', unite: 'U', diametre: '40', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 50/33', unite: 'U', diametre: '50', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 63/33', unite: 'U', diametre: '63', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 80/33', unite: 'U', diametre: '80', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 100/20', unite: 'U', diametre: '100', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 100/33', unite: 'U', diametre: '100', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 125/20', unite: 'U', diametre: '125', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 125/33', unite: 'U', diametre: '125', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 150/40', unite: 'U', diametre: '150', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 200/33', unite: 'U', diametre: '200', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 250/33', unite: 'U', diametre: '250', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 300/33', unite: 'U', diametre: '300', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Collier de Prise en Charge ACIER Ø 350/33', unite: 'U', diametre: '350', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Robinet de Branchement ACIER Ø 70', unite: 'U', diametre: '70', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Robinet de Branchement ACIER Ø 90', unite: 'U', diametre: '90', matiere: 'ACIER', classe: null, pression: null, couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 32/20 PE 100 SDR 11 PN 16', unite: 'U', diametre: '32', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 32/25 PE 100 SDR 11 PN 16', unite: 'U', diametre: '32', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 63/25 PE 100 SDR 11 PN 16', unite: 'U', diametre: '63', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 75/25 PE 100 SDR 11 PN 16', unite: 'U', diametre: '75', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 90/25 PE 100 SDR 11 PN 16', unite: 'U', diametre: '90', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 110/25 PE 100 SDR 11 PN 16', unite: 'U', diametre: '110', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 110/32 PE 100 SDR 11 PN 16', unite: 'U', diametre: '110', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 110/40 PE 100 SDR 11 PN 16', unite: 'U', diametre: '110', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 110/63 PE 100 SDR 11 PN 16', unite: 'U', diametre: '110', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 125/25 PE 100 SDR 11 PN 16', unite: 'U', diametre: '125', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 125/32 PE 100 SDR 11 PN 16', unite: 'U', diametre: '125', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 125/40 PE 100 SDR 11 PN 16', unite: 'U', diametre: '125', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 125/63 PE 100 SDR 11 PN 16', unite: 'U', diametre: '125', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 150/63 PE 100 SDR 11 PN 16', unite: 'U', diametre: '150', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Ø 200/63 PE 100 SDR 11 PN 16', unite: 'U', diametre: '200', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Selle Te PE Ø 250/63 PN 16', unite: 'U', diametre: '250', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Selle Te de Branchement PEHD ÉLECTROFUSION Selle Te PE Ø 350/63 PN 16', unite: 'U', diametre: '350', matiere: 'PEHD', classe: 'PN16', pression: '16', couleur: null },
          { designation: 'Bouchon d\'Extrémité en PEHD Ø 20', unite: 'U', diametre: '20', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Bouchon d\'Extrémité en PEHD Ø 25', unite: 'U', diametre: '25', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Bouchon d\'Extrémité en PEHD Ø 32', unite: 'U', diametre: '32', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Bouchon d\'Extrémité en PEHD Ø 40', unite: 'U', diametre: '40', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Bouchon d\'Extrémité en PEHD Ø 50', unite: 'U', diametre: '50', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Bouchon d\'Extrémité en PEHD Ø 63', unite: 'U', diametre: '63', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Bouchon d\'Extrémité en PEHD Ø 75', unite: 'U', diametre: '75', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Bouchon d\'Extrémité en PEHD Ø 90', unite: 'U', diametre: '90', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Bouchon d\'Extrémité en PEHD Ø 110', unite: 'U', diametre: '110', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø20', unite: 'U', diametre: '20', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø25', unite: 'U', diametre: '25', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø32', unite: 'U', diametre: '32', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø40', unite: 'U', diametre: '40', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø50', unite: 'U', diametre: '50', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø63', unite: 'U', diametre: '63', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø75', unite: 'U', diametre: '75', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø90', unite: 'U', diametre: '90', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø110', unite: 'U', diametre: '110', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques PP 90° (S/R) Ø150', unite: 'U', diametre: '150', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques  Tarraudé Ø20X1/2" 20', unite: 'U', diametre: '20', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques  Tarraudé Ø25X3/4" 25', unite: 'U', diametre: '25', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques  Tarraudé Ø32X1" 32', unite: 'U', diametre: '32', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques  Tarraudé Ø40X1.1/4" 40', unite: 'U', diametre: '40', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques  Tarraudé Ø50X1.1/2" 50', unite: 'U', diametre: '50', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques  Tarraudé Ø63X2.1/2" 63', unite: 'U', diametre: '63', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques  Tarraudé Ø75X2.1/2" 75', unite: 'U', diametre: '75', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques  Tarraudé Ø90X3" 90', unite: 'U', diametre: '90', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes Mécaniques  Tarraudé Ø110X4" 110', unite: 'U', diametre: '110', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Coudes en PE ÉLECTROFUSION Ø 110', unite: 'U', diametre: '110', matiere: 'PE', classe: null, pression: null, couleur: null },
          { designation: 'Coudes en PE ÉLECTROFUSION Ø 125', unite: 'U', diametre: '125', matiere: 'PE', classe: null, pression: null, couleur: null },
          { designation: 'Coudes en PE ÉLECTROFUSION Ø 160', unite: 'U', diametre: '160', matiere: 'PE', classe: null, pression: null, couleur: null },
          { designation: 'Coudes en PE ÉLECTROFUSION Ø 200', unite: 'U', diametre: '200', matiere: 'PE', classe: null, pression: null, couleur: null },
          { designation: 'Coudes en PE ÉLECTROFUSION Ø 250', unite: 'U', diametre: '250', matiere: 'PE', classe: null, pression: null, couleur: null },
          { designation: 'Coudes en PE ÉLECTROFUSION Ø 315', unite: 'U', diametre: '315', matiere: 'PE', classe: null, pression: null, couleur: null },
          { designation: 'Manchon Mécanique en PEHD (S/R) Egal Ø 20', unite: 'U', diametre: '20', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Manchon Mécanique en PEHD (S/R) Egal Ø 25', unite: 'U', diametre: '25', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Manchon Mécanique en PEHD (S/R) Egal Ø 32', unite: 'U', diametre: '32', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Manchon Mécanique en PEHD (S/R) Egal Ø 40', unite: 'U', diametre: '40', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Manchon Mécanique en PEHD (S/R) Egal Ø 50', unite: 'U', diametre: '50', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Manchon Mécanique en PEHD (S/R) Egal Ø 63', unite: 'U', diametre: '63', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Manchon Mécanique en PEHD (S/R) Egal Ø 75', unite: 'U', diametre: '75', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Manchon Mécanique en PEHD (S/R) Egal Ø 90', unite: 'U', diametre: '90', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Manchon Mécanique en PEHD (S/R) Egal Ø 110', unite: 'U', diametre: '110', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Egal Ø 110', unite: 'U', diametre: '110', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Egal Ø 125', unite: 'U', diametre: '125', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Egal Ø 160', unite: 'U', diametre: '160', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Egal Ø 200', unite: 'U', diametre: '200', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Egal Ø 250', unite: 'U', diametre: '250', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Egal Ø 315', unite: 'U', diametre: '315', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Egal Ø 350', unite: 'U', diametre: '350', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø25/20', unite: 'U', diametre: '25', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø32/25', unite: 'U', diametre: '32', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø32/20', unite: 'U', diametre: '32', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø40/32', unite: 'U', diametre: '40', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø50/25', unite: 'U', diametre: '50', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø50/32', unite: 'U', diametre: '50', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø50/40', unite: 'U', diametre: '50', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø63/32', unite: 'U', diametre: '63', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø63/40', unite: 'U', diametre: '63', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø75/63', unite: 'U', diametre: '75', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø75/50', unite: 'U', diametre: '75', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø90/63', unite: 'U', diametre: '90', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø90/75', unite: 'U', diametre: '90', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø110/75', unite: 'U', diametre: '110', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP (S/R) Réduit Ø110/90', unite: 'U', diametre: '110', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Réduit Ø125/110', unite: 'U', diametre: '125', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Réduit Ø160/125', unite: 'U', diametre: '160', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Réduit Ø200/160', unite: 'U', diametre: '200', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Réduit Ø250/200', unite: 'U', diametre: '250', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Réduit Ø315/250', unite: 'U', diametre: '315', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Manchon en PP Électrosoudable Réduit Ø400/315', unite: 'U', diametre: '400', matiere: 'PP', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Fileté en PEHD (S/R) Ø20X1/2" (20)', unite: 'U', diametre: '20', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Fileté en PEHD (S/R) Ø25X3/4" (25)', unite: 'U', diametre: '25', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Fileté en PEHD (S/R) Ø32X1" (32)', unite: 'U', diametre: '32', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Fileté en PEHD (S/R) Ø40X1.1/4" (40)', unite: 'U', diametre: '40', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Fileté en PEHD (S/R) Ø50X1.1/2" (50)', unite: 'U', diametre: '50', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Fileté en PEHD (S/R) Ø63X2.1/2" (63)', unite: 'U', diametre: '63', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Fileté en PEHD (S/R) Ø75X2.1/2" (75)', unite: 'U', diametre: '75', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Fileté en PEHD (S/R) Ø90X3" (90)', unite: 'U', diametre: '90', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Fileté en PEHD (S/R) Ø110X4" (110)', unite: 'U', diametre: '110', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Tarraudé en PEHD Ø20X1/2" (20)', unite: 'U', diametre: '20', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Tarraudé en PEHD Ø25X3/4" (25)', unite: 'U', diametre: '25', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Tarraudé en PEHD Ø32X1" (32)', unite: 'U', diametre: '32', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Tarraudé en PEHD Ø40X1.1/4" (40)', unite: 'U', diametre: '40', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Tarraudé en PEHD Ø50X1.1/2" (50)', unite: 'U', diametre: '50', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Tarraudé en PEHD Ø63X2.1/2" (63)', unite: 'U', diametre: '63', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Tarraudé en PEHD Ø75X2.1/2" (75)', unite: 'U', diametre: '75', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Tarraudé en PEHD Ø90X3" (90)', unite: 'U', diametre: '90', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord Tarraudé en PEHD Ø110X4" (110)', unite: 'U', diametre: '110', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord à Bride en PEHD (S/R) Ø 40', unite: 'U', diametre: '40', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord à Bride en PEHD (S/R) Ø 50', unite: 'U', diametre: '50', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord à Bride en PEHD (S/R) Ø 63', unite: 'U', diametre: '63', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord à Bride en PEHD (S/R) Ø 75', unite: 'U', diametre: '75', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord à Bride en PEHD (S/R) Ø 90', unite: 'U', diametre: '90', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Raccord à Bride en PEHD (S/R) Ø 110', unite: 'U', diametre: '110', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Té en PEHD Électrosoudable Egal Ø 110', unite: 'U', diametre: '110', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Té en PEHD Électrosoudable Egal Ø 125', unite: 'U', diametre: '125', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Té en PEHD Électrosoudable Egal Ø 160', unite: 'U', diametre: '160', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Té en PEHD Électrosoudable Egal Ø 200', unite: 'U', diametre: '200', matiere: 'PEHD', classe: null, pression: null, couleur: null },
          { designation: 'Té en PEHD Électrosoudable Egal Ø 250', unite: 'U', diametre: '250', matiere: 'PEHD', classe: null, pression: null, couleur: null }
        ];

        for (const piece of specialPieces) {
          const article: Article = {
            id: `ART-PIECE-${piece.designation.replace(/\s+/g, '-').replace(/[Ø]/g, 'D')}-${Date.now()}`,
            name: piece.designation,
            description: `Pièce spéciale en ${piece.matiere}${piece.diametre ? `, diamètre ${piece.diametre}mm` : ''}${piece.classe ? `, classe ${piece.classe}` : ''}${piece.pression ? `, pression nominale ${piece.pression}` : ''}`,
            prices: [
              { type: 'fourniture' as const, price: 0 }, // Prix à définir selon les besoins
              { type: 'pose' as const, price: 0 }        // Prix à définir selon les besoins
            ],
            category: 'PIÈCES SPÉCIALES',
            unit: piece.unite as 'M²' | 'M3' | 'ML' | 'U' | 'NULL',
            material: piece.matiere,
            class: piece.classe || undefined,
            nominalPressure: piece.pression || undefined,
            color: piece.couleur || undefined,
            createdAt: new Date().toISOString(),
            defaultPriceType: 'fourniture' as const
          };

          await ArticleService.saveArticle(article);
        }

        await loadArticles(); // Recharger la liste des articles

        Swal.fire('Succès', 'Les pièces spéciales ont été ajoutées avec succès !', 'success');
      } catch (error) {
        console.error('Erreur lors de l\'ajout des pièces spéciales:', error);
        Swal.fire('Erreur', 'Impossible d\'ajouter les pièces spéciales', 'error');
      }
    }
  };

  const addAdditionalPieces = async () => {
    const result = await Swal.fire({
      title: 'Ajouter les pièces spéciales complémentaires ?',
      text: 'Ceci ajoutera les pièces spéciales supplémentaires comme Tabernacle, Bouche à clé, Portes de niche, etc.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, ajouter',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        const additionalPieces = [
          { designation: 'Tabernacle (plaque d\'assise)', unite: 'U', diametre: null, matiere: null, classe: null, pression: null, couleur: null },
          { designation: 'Bouche à clé & socle en béton', unite: 'U', diametre: null, matiere: null, classe: null, pression: null, couleur: null },
          { designation: 'Porte de niche PM (dn 25mm)', unite: 'U', diametre: '25', matiere: null, classe: null, pression: null, couleur: null },
          { designation: 'Porte de niche GM (dn 32-40mm)', unite: 'U', diametre: '32-40', matiere: null, classe: null, pression: null, couleur: null },
          { designation: 'Coffret de comptage A.E.P (P/01 compteur)', unite: 'U', diametre: null, matiere: null, classe: null, pression: null, couleur: null },
          { designation: 'Grillage avertisseur (maille de signalisation)', unite: 'ML', diametre: null, matiere: null, classe: null, pression: null, couleur: null }
        ];

        for (const piece of additionalPieces) {
          const article: Article = {
            id: `ART-ADD-${piece.designation.replace(/\s+/g, '-').replace(/[^\w\s-]/g, '')}-${Date.now()}`,
            name: piece.designation,
            description: piece.designation, // Utilisation de la désignation comme description
            prices: [
              { type: 'fourniture' as const, price: 0 }, // Prix à définir selon les besoins
              { type: 'pose' as const, price: 0 }        // Prix à définir selon les besoins
            ],
            category: 'PIÈCES SPÉCIALES',
            unit: piece.unite as 'M²' | 'M3' | 'ML' | 'U' | 'NULL',
            material: piece.matiere || undefined,
            class: piece.classe || undefined,
            nominalPressure: piece.pression || undefined,
            color: piece.couleur || undefined,
            createdAt: new Date().toISOString(),
            defaultPriceType: 'fourniture' as const
          };

          await ArticleService.saveArticle(article);
        }

        await loadArticles(); // Recharger la liste des articles

        Swal.fire('Succès', 'Les pièces spéciales complémentaires ont été ajoutées avec succès !', 'success');
      } catch (error) {
        console.error('Erreur lors de l\'ajout des pièces spéciales complémentaires:', error);
        Swal.fire('Erreur', 'Impossible d\'ajouter les pièces spéciales complémentaires', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
            Gestion des Articles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les articles utilisables dans les devis
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadDefaultArticles}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
          >
            Charger Articles Défaut
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
          >
            Nouvel Article
          </button>
          <button
            onClick={onBack}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-300 transition-all"
          >
            Retour
          </button>
        </div>
      </div>

      {showForm && (
        <div id="article-form" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">
            {editingArticle ? 'Modifier Article' : 'Nouvel Article'}
          </h2>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full rounded-xl border-gray-200 p-3 text-sm font-black uppercase border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Nom de l'article *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Ex: Compteur eau standard"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Unité
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value as any})}
                  className="w-full rounded-xl border-gray-200 p-3 text-sm font-black uppercase border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="NULL">Aucune</option>
                  <option value="U">Unité (U)</option>
                  <option value="M²">Mètre carré (M²)</option>
                  <option value="M3">Mètre cube (M3)</option>
                  <option value="ML">Mètre linéaire (ML)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Matière
                </label>
                <input
                  type="text"
                  value={formData.material || ''}
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                  className="w-full rounded-xl border-gray-200 p-3 text-sm font-medium border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Ex: Acier, PEHD, Tigre, PVC..."
                  list="materials"
                />
                <datalist id="materials">
                  {allMaterials.map(material => (
                    <option key={material} value={material} />
                  ))}
                </datalist>
                {formData.material && !allMaterials.includes(formData.material) && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs text-amber-600 font-bold">Nouvelle</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Classe
                </label>
                <input
                  type="text"
                  value={formData.class || ''}
                  onChange={(e) => setFormData({...formData, class: e.target.value})}
                  className="w-full rounded-xl border-gray-200 p-3 text-sm font-medium border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Ex: Classe 30, Classe 40..."
                  list="classes"
                />
                <datalist id="classes">
                  <option value="Classe 10" />
                  <option value="Classe 20" />
                  <option value="Classe 30" />
                  <option value="Classe 40" />
                  <option value="Classe 50" />
                  <option value="Classe 60" />
                </datalist>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Pression nominale (PN)
                </label>
                <input
                  type="text"
                  value={formData.nominalPressure || ''}
                  onChange={(e) => setFormData({...formData, nominalPressure: e.target.value})}
                  className="w-full rounded-xl border-gray-200 p-3 text-sm font-medium border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Ex: PN 6, PN 10, PN 16..."
                  list="pressures"
                />
                <datalist id="pressures">
                  <option value="PN 6" />
                  <option value="PN 10" />
                  <option value="PN 16" />
                  <option value="PN 25" />
                  <option value="PN 32" />
                </datalist>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Couleur
                </label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-full rounded-xl border-gray-200 p-3 text-sm font-medium border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Ex: Noire, Bleue, Rouge..."
                  list="colors"
                />
                <datalist id="colors">
                  <option value="Noire" />
                  <option value="Bleue" />
                  <option value="Rouge" />
                  <option value="Verte" />
                  <option value="Jaune" />
                  <option value="Blanche" />
                  <option value="Gris" />
                  <option value="Orange" />
                </datalist>
              </div>
            </div>
            

            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-xl border-gray-200 p-3 text-sm font-medium border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Description détaillée de l'article"
                rows={3}
              />
            </div>
            

            
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">
                Tarifs *
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {priceTypes.map((priceType, index) => (
                  <div key={priceType.type} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full bg-${priceType.color}-500`}></div>
                      <span className="font-black text-gray-900 text-sm uppercase tracking-widest">
                        {priceType.label}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          Prix (DZD)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={articlePrices[index].price}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          className="w-full rounded-lg border-gray-200 p-2 text-sm font-bold border bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                {editingArticle ? 'Mettre à jour' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-300 transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
            Liste des Articles
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {articles.length} article{articles.length > 1 ? 's' : ''} disponible{articles.length > 1 ? 's' : ''}
          </p>
        </div>
        
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Aucun article disponible</p>
            <p className="text-sm text-gray-400 mt-1">Commencez par ajouter des articles ou charger les articles par défaut</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">
                    Article
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">
                    Catégorie
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">
                    Unité
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">
                    Propriétés
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">
                    Prix
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-gray-900">{article.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{article.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-black px-2 py-1 bg-blue-100 text-blue-800 rounded-full uppercase tracking-widest">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-black px-2 py-1 bg-amber-100 text-amber-800 rounded-full uppercase tracking-widest">
                        {article.unit && article.unit !== 'NULL' ? article.unit : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {article.class && (
                          <span className="text-xs font-black px-2 py-1 bg-amber-100 text-amber-800 rounded-full uppercase tracking-widest">
                            {article.class}
                          </span>
                        )}
                        {article.nominalPressure && (
                          <span className="text-xs font-black px-2 py-1 bg-green-100 text-green-800 rounded-full uppercase tracking-widest">
                            {article.nominalPressure}
                          </span>
                        )}
                        {article.color && (
                          <span className="text-xs font-black px-2 py-1 bg-red-100 text-red-800 rounded-full uppercase tracking-widest">
                            {article.color}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {article.prices.filter(price => price.price > 0).length > 0 ? (
                          article.prices.filter(price => price.price > 0).map((price, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <span className="text-xs font-black px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                {price.type === 'fourniture' ? 'F' : 
                                 price.type === 'pose' ? 'P' : 'PS'}
                              </span>
                              <span className="font-bold text-gray-900">{price.price.toLocaleString()} DZD</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs font-black text-gray-400 italic">Aucun prix défini</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(article)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};