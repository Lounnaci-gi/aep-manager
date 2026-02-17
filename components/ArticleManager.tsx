import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Article } from '../types';
import { ArticleService } from '../services/articleService';

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
    unitPrice: 0,
    category: 'Matériel'
  });

  const categories = ['Matériel', 'Main d\'œuvre', 'Administratif', 'Autre'];

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await ArticleService.getArticles();
      setArticles(data);
    } catch (error) {
      console.error('Erreur chargement articles:', error);
      Swal.fire('Erreur', 'Impossible de charger les articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.unitPrice <= 0) {
      Swal.fire('Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }

    try {
      const article: Article = {
        id: editingArticle?.id || `ART-${Date.now()}`,
        ...formData,
        unitPrice: Number(formData.unitPrice),
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
      unitPrice: article.unitPrice,
      category: article.category
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingArticle(undefined);
    setFormData({
      name: '',
      description: '',
      unitPrice: 0,
      category: 'Matériel'
    });
    setShowForm(false);
  };

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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">
            {editingArticle ? 'Modifier Article' : 'Nouvel Article'}
          </h2>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Prix Unitaire (DZD) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                className="w-full rounded-xl border-gray-200 p-3 text-sm font-bold border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="0.00"
              />
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
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <div key={article.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-black text-gray-900">{article.name}</h4>
                      <span className="text-xs font-black px-2 py-1 bg-blue-100 text-blue-800 rounded-full uppercase tracking-widest">
                        {article.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{article.description}</p>
                    <p className="text-emerald-600 font-black text-lg">
                      {article.unitPrice.toLocaleString()} DZD
                    </p>
                  </div>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};