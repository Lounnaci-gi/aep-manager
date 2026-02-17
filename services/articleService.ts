import { Article } from '../types';
import { DbService } from './dbService';

export const ArticleService = {
  async getArticles(): Promise<Article[]> {
    try {
      return await DbService.getArticles();
    } catch {
      return [];
    }
  },

  async saveArticle(article: Article): Promise<void> {
    await DbService.saveArticle(article);
  },

  async deleteArticle(id: string): Promise<void> {
    await DbService.deleteArticle(id);
  },

  async updateArticle(article: Article): Promise<void> {
    await DbService.saveArticle(article);
  },

  // Articles par défaut pour les branchements
  getDefaultBranchementArticles(): Article[] {
    return [
      {
        id: 'ART-001',
        name: 'Frais de raccordement',
        description: 'Frais administratifs et techniques pour le raccordement',
        unitPrice: 15000,
        category: 'Administratif',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ART-002',
        name: 'Compteur eau standard',
        description: 'Compteur eau de diamètre 15mm avec robinet d\'arrêt',
        unitPrice: 25000,
        category: 'Matériel',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ART-003',
        name: 'Compteur eau DN20',
        description: 'Compteur eau de diamètre 20mm pour débits importants',
        unitPrice: 35000,
        category: 'Matériel',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ART-004',
        name: 'Branchement diamètre 15mm',
        description: 'Tuyau de branchement en PER diamètre 15mm',
        unitPrice: 8000,
        category: 'Matériel',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ART-005',
        name: 'Branchement diamètre 20mm',
        description: 'Tuyau de branchement en PER diamètre 20mm',
        unitPrice: 12000,
        category: 'Matériel',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ART-006',
        name: 'Main d\'œuvre raccordement',
        description: 'Intervention technique pour le raccordement au réseau',
        unitPrice: 20000,
        category: 'Main d\'œuvre',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ART-007',
        name: 'Frais de mise en service',
        description: 'Vérification et mise en service du branchement',
        unitPrice: 10000,
        category: 'Administratif',
        createdAt: new Date().toISOString()
      }
    ];
  }
};