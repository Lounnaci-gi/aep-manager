
import { Quote, QuoteStatus, Client, WorkType, User, UserRole, WorkRequest, RequestStatus, Centre, CommercialAgency, Article, ArticlePrice } from '../types';
import { hashPasswordWithSalt, verifyPassword } from './passwordUtils';

const API_URL = 'http://localhost:5000/api';

const DB_CONFIG = {
  dbName: 'GestionEau',
  cluster: 'Cluster0',
  host: 'cluster0.l0q2v.mongodb.net',
  note: 'MongoDB Atlas via API'
};

export const COLLECTIONS = {
  USERS: 'users',
  CENTRES: 'centres',
  AGENCIES: 'agencies',
  CLIENTS: 'clients',
  REQUESTS: 'requests',
  QUOTES: 'quotes',
  WORK_TYPES: 'work_types',
  ARTICLES: 'articles'
};

async function apiRequest<T>(method: string, collection: string, data?: any): Promise<T> {
  const response = await fetch(`${API_URL}/${collection}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

const INITIAL_ADMIN: User = {
  id: 'USR-ADMIN-001',
  username: 'admin',
  fullName: 'Administrateur',
  phone: '0661 00 00 00',
  email: 'admin@gestioneau.dz',
  password: 'USR-ADMIN-001:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // admin
  role: UserRole.ADMIN,
  centreId: 'CTR-001',
  createdAt: new Date().toISOString()
};

export const DbService = {
  getDbInfo() {
    return DB_CONFIG;
  },

  async isConnected(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/../status`);
      return response.ok;
    } catch {
      return false;
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const data = await apiRequest<User[]>('GET', COLLECTIONS.USERS);
      return data.length > 0 ? data : [INITIAL_ADMIN];
    } catch {
      return [INITIAL_ADMIN];
    }
  },
  
  async saveUser(user: User): Promise<void> { 
    // Vérifier s'il y a déjà un administrateur
    const existingUsers = await this.getUsers();
    const existingAdmin = existingUsers.some(u => u.role === UserRole.ADMIN && u.id !== user.id);
    
    if (user.role === UserRole.ADMIN && existingAdmin) {
      throw new Error('Un administrateur existe déjà dans le système. Vous ne pouvez pas créer un second administrateur.');
    }
    
    // Hash password before saving
    const hashedPassword = await hashPasswordWithSalt(user.password || '', user.id);
    const userWithHashedPassword = { ...user, password: hashedPassword };
    await apiRequest('POST', COLLECTIONS.USERS, userWithHashedPassword); 
  },
  
  async deleteUser(id: string): Promise<void> {
    await fetch(`${API_URL}/${COLLECTIONS.USERS}/${id}`, { method: 'DELETE' });
  },
  
  async authenticate(username: string, password: string): Promise<{ user?: User; error?: string; blocked?: boolean; remainingTime?: number; remainingAttempts?: number; blockedUntil?: number }> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return { user: data.user };
      } else {
        return { 
          error: data.error, 
          blocked: data.blocked,
          remainingTime: data.remainingTime,
          remainingAttempts: data.remainingAttempts,
          blockedUntil: data.blockedUntil
        };
      }
    } catch (err) {
      console.error('Erreur authentification:', err);
      return { error: 'Erreur de connexion au serveur' };
    }
  },

  async getCentres(): Promise<Centre[]> { 
    return await apiRequest<Centre[]>('GET', COLLECTIONS.CENTRES); 
  },
  
  async saveCentre(centre: Centre): Promise<void> { 
    await apiRequest('POST', COLLECTIONS.CENTRES, centre); 
  },
  
  async deleteCentre(id: string): Promise<void> {
    await fetch(`${API_URL}/${COLLECTIONS.CENTRES}/${id}`, { method: 'DELETE' });
  },

  async getAgencies(): Promise<CommercialAgency[]> {
    return await apiRequest<CommercialAgency[]>('GET', COLLECTIONS.AGENCIES);
  },
  
  async saveAgency(agency: CommercialAgency): Promise<void> {
    await apiRequest('POST', COLLECTIONS.AGENCIES, agency);
  },
  
  async deleteAgency(id: string): Promise<void> {
    await fetch(`${API_URL}/${COLLECTIONS.AGENCIES}/${id}`, { method: 'DELETE' });
  },

  async getClients(): Promise<Client[]> {
    return await apiRequest<Client[]>('GET', COLLECTIONS.CLIENTS);
  },
  
  async saveClient(client: Client): Promise<void> { 
    await apiRequest('POST', COLLECTIONS.CLIENTS, client); 
  },
  
  async deleteClient(id: string): Promise<void> {
    await fetch(`${API_URL}/${COLLECTIONS.CLIENTS}/${id}`, { method: 'DELETE' });
  },

  async getRequests(): Promise<WorkRequest[]> {
    return await apiRequest<WorkRequest[]>('GET', COLLECTIONS.REQUESTS);
  },
  
  async saveRequest(request: WorkRequest): Promise<void> {
    await apiRequest('POST', COLLECTIONS.REQUESTS, request);
  },
  
  async deleteRequest(id: string): Promise<void> {
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.REQUESTS}/${encodedId}`, { method: 'DELETE' });
  },
  
  async updateRequestStatus(id: string, status: RequestStatus): Promise<void> {
    const requests = await this.getRequests();
    const request = requests.find(r => r.id === id);
    if (request) {
      request.status = status;
      await this.saveRequest(request);
    }
  },

  async getQuotes(): Promise<Quote[]> {
    return await apiRequest<Quote[]>('GET', COLLECTIONS.QUOTES);
  },
  
  async saveQuote(quote: Quote): Promise<void> { 
    await apiRequest('POST', COLLECTIONS.QUOTES, quote); 
  },
  
  async deleteQuote(id: string): Promise<void> {
    await fetch(`${API_URL}/${COLLECTIONS.QUOTES}/${id}`, { method: 'DELETE' });
  },
  
  async updateQuoteStatus(id: string, status: QuoteStatus): Promise<void> {
    const quotes = await this.getQuotes();
    const quote = quotes.find(q => q.id === id);
    if (quote) {
      quote.status = status;
      await this.saveQuote(quote);
    }
  },

  async getWorkTypes(): Promise<WorkType[]> {
    return await apiRequest<WorkType[]>('GET', COLLECTIONS.WORK_TYPES);
  },
  
  async saveWorkTypes(workTypes: WorkType[]): Promise<void> { 
    // Supprimer tous les types existants et les recréer
    const existing = await this.getWorkTypes();
    for (const wt of existing) {
      await this.deleteWorkType(wt.id);
    }
    for (const wt of workTypes) {
      await this.saveWorkType(wt);
    }
  },
  
  async saveWorkType(workType: WorkType): Promise<void> {
    await apiRequest('POST', COLLECTIONS.WORK_TYPES, workType);
  },
  
  async deleteWorkType(id: string): Promise<void> {
    await fetch(`${API_URL}/${COLLECTIONS.WORK_TYPES}/${id}`, { method: 'DELETE' });
  },

  async getStats() {
    try {
      const response = await fetch(`${API_URL}/../stats`);
      return await response.json();
    } catch {
      return {};
    }
  },

  // Articles methods
  async getArticles(): Promise<Article[]> {
    const articles = await apiRequest<any[]>('GET', COLLECTIONS.ARTICLES);
    // Migration: convert old articles with unitPrice to new format
    return articles.map(article => {
      if ('unitPrice' in article && !('prices' in article)) {
        // Split the unit price into fourniture (70%) and pose (30%)
        const totalPrice = article.unitPrice;
        const fourniturePrice = Math.round(totalPrice * 0.7);
        const posePrice = totalPrice - fourniturePrice;
        return {
          ...article,
          prices: [
            { type: 'fourniture', price: fourniturePrice },
            { type: 'pose', price: posePrice }
          ],
          unit: this.migrateUnit(article.unit) || 'U',
          defaultPriceType: 'fourniture'
        } as Article;
      }
      // Migration: ensure all articles have the three price types and unit field
      if (article.prices) {
        const fourniturePrice = article.prices.find((p: any) => p.type === 'fourniture')?.price || 0;
        const posePrice = article.prices.find((p: any) => p.type === 'pose')?.price || 0;
        const prestationPrice = article.prices.find((p: any) => p.type === 'prestation')?.price || 0;
        
        const newPrices: ArticlePrice[] = [
          { type: 'fourniture', price: fourniturePrice },
          { type: 'pose', price: posePrice }
        ];
        
        // Add prestation price only if it exists and is > 0
        if (prestationPrice > 0) {
          newPrices.push({ type: 'prestation', price: prestationPrice });
        }
        
        // Corriger la gestion de l'unité pour préserver la valeur originale
        const originalUnit = article.unit;
        const migratedUnit = this.migrateUnit(originalUnit);
        
        return {
          ...article,
          prices: newPrices,
          unit: originalUnit !== undefined && originalUnit !== null && originalUnit !== '' && originalUnit !== 'NULL' ? originalUnit : (migratedUnit || 'U'),
          defaultPriceType: article.defaultPriceType === 'fourniture_et_pose' ? 'fourniture' : article.defaultPriceType,
          // Assurer que les nouveaux champs existent, même si ils sont undefined
          class: article.class,
          nominalPressure: article.nominalPressure,
          color: article.color
        } as Article;
      }
      // Pour les articles sans prix, préserver l'unité originale
      const originalUnit = article.unit;
      return {
        ...article,
        unit: originalUnit !== undefined && originalUnit !== null && originalUnit !== '' && originalUnit !== 'NULL' ? originalUnit : 'U',
        class: article.class,
        nominalPressure: article.nominalPressure,
        color: article.color
      } as Article;
    });
  },

  // Helper method to migrate old unit formats to new format
  migrateUnit(oldUnit: string): 'M²' | 'M3' | 'ML' | 'U' | 'NULL' {
    if (!oldUnit || oldUnit === 'NULL' || oldUnit === 'null') {
      return 'NULL';
    }
    
    switch (oldUnit.toLowerCase()) {
      case 'm²':
      case 'm2': 
        return 'M²';
      case 'm³':
      case 'm3':
        return 'M3';
      case 'ml':
        return 'ML';
      case 'u':
      case 'unit':
      case 'unité':
        return 'U';
      default:
        return 'NULL';
    }
  },
  
  async saveArticle(article: Article): Promise<void> {
    // Ne pas forcer la migration si l'unité est déjà dans le bon format
    const isValidUnit = article.unit && ['M²', 'M3', 'ML', 'U', 'NULL'].includes(article.unit);
    const articleToSave = isValidUnit 
      ? article 
      : {
          ...article,
          unit: this.migrateUnit(article.unit) || 'U'
        };
    await apiRequest('POST', COLLECTIONS.ARTICLES, articleToSave);
  },
  
  async deleteArticle(id: string): Promise<void> {
    await fetch(`${API_URL}/${COLLECTIONS.ARTICLES}/${id}`, { method: 'DELETE' });
  },

  // Fonction pour extraire la matière d'un article à partir de son nom ou description
  extractMaterialFromArticle(article: Article): string | undefined {
    const textToSearch = `${article.name} ${article.description}`.toLowerCase();
    
    // Liste des matières avec leurs variantes
    const materialsMap = {
      'acier': ['acier', 'steel'],
      'pehd': ['pehd', 'pe', 'polyéthylène haute densité'],
      'tigre': ['tigre'],
      'pvc': ['pvc', 'polyvinyl chloride'],
      'cuivre': ['cuivre', 'copper'],
      'fonte': ['fonte', 'cast iron'],
      'inox': ['inox', 'inoxidable', 'stainless'],
      'aluminium': ['aluminium', 'aluminum']
    };
    
    // Chercher chaque matière dans le texte
    for (const [material, variants] of Object.entries(materialsMap)) {
      for (const variant of variants) {
        if (textToSearch.includes(variant)) {
          return material.charAt(0).toUpperCase() + material.slice(1);
        }
      }
    }
    
    return undefined;
  },
  
  // Migrer tous les articles pour ajouter le champ matière
  async migrateArticlesWithMaterial(): Promise<void> {
    try {
      const articles = await this.getArticles();
      
      for (const article of articles) {
        // Si l'article n'a pas de matière définie
        if (!article.material) {
          const extractedMaterial = this.extractMaterialFromArticle(article);
          if (extractedMaterial) {
            const updatedArticle = {
              ...article,
              material: extractedMaterial
            };
            await this.saveArticle(updatedArticle);
            console.log(`Matière '${extractedMaterial}' ajoutée à l'article: ${article.name}`);
          }
        }
      }
      
      console.log('Migration des matières terminée');
    } catch (error) {
      console.error('Erreur lors de la migration des matières:', error);
    }
  }
};
