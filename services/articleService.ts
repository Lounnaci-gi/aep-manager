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
        prices: [
          { type: 'fourniture', price: 10000 },
          { type: 'pose', price: 5000 }
        ],
        category: 'Administratif',
        unit: 'U',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'fourniture'
      },
      {
        id: 'ART-002',
        name: 'Compteur eau standard',
        description: 'Compteur eau de diamètre 15mm avec robinet d\'arrêt',
        prices: [
          { type: 'fourniture', price: 20000 },
          { type: 'pose', price: 5000 },
          { type: 'prestation', price: 600 }
        ],
        category: 'Comptage',
        unit: 'U',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'fourniture'
      },
      {
        id: 'ART-003',
        name: 'Compteur eau DN20',
        description: 'Compteur eau de diamètre 20mm pour débits importants',
        prices: [
          { type: 'fourniture', price: 30000 },
          { type: 'pose', price: 5000 },
          { type: 'prestation', price: 600 }
        ],
        category: 'Comptage',
        unit: 'U',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'fourniture'
      },
      {
        id: 'ART-004',
        name: 'Tuyau PEHD diamètre 15mm',
        description: 'Tuyau de canalisation en PEHD diamètre 15mm',
        prices: [
          { type: 'fourniture', price: 8000 },
          { type: 'pose', price: 5000 }
        ],
        category: 'CANALISATIONS (TUBES PEHD)',
        unit: 'ML',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'fourniture'
      },
      {
        id: 'ART-005',
        name: 'Tuyau PEHD diamètre 20mm',
        description: 'Tuyau de canalisation en PEHD diamètre 20mm',
        prices: [
          { type: 'fourniture', price: 12000 },
          { type: 'pose', price: 7000 }
        ],
        category: 'CANALISATIONS (TUBES PEHD)',
        unit: 'ML',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'fourniture'
      },
      {
        id: 'ART-006',
        name: 'Main d\'œuvre raccordement',
        description: 'Intervention technique pour le raccordement au réseau',
        prices: [{ type: 'pose', price: 20000 }],
        category: 'Main d\'œuvre',
        unit: 'U',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'pose'
      },
      {
        id: 'ART-007',
        name: 'Frais de mise en service',
        description: 'Vérification et mise en service du branchement',
        prices: [
          { type: 'fourniture', price: 5000 },
          { type: 'pose', price: 5000 }
        ],
        category: 'Administratif',
        unit: 'U',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'fourniture'
      },
      {
        id: 'ART-008',
        name: 'Robinet d\'arrêt',
        description: 'Robinet d\'arrêt pour branchement',
        prices: [
          { type: 'fourniture', price: 5000 },
          { type: 'pose', price: 3000 }
        ],
        category: 'PIÈCES SPÉCIALES',
        unit: 'U',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'fourniture'
      },
      {
        id: 'ART-009',
        name: 'Travaux terrassement',
        description: 'Travaux de terrassement pour pose de canalisation',
        prices: [{ type: 'pose', price: 30000 }],
        category: 'TRAVAUX DE TERRASSEMENT & VOIRIE',
        unit: 'M3',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'pose'
      },
      {
        id: 'ART-010',
        name: 'Cautionnement pour branchement',
        description: 'Frais de cautionnement pour les travaux de branchement',
        prices: [
          { type: 'fourniture', price: 15000 },
          { type: 'pose', price: 5000 }
        ],
        category: 'Cautionnement pour Branchement',
        unit: 'U',
        createdAt: new Date().toISOString(),
        defaultPriceType: 'fourniture'
      }
    ];
  }
};