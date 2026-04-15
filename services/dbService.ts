
import { Quote, QuoteStatus, Client, WorkType, User, UserRole, WorkRequest, RequestStatus, Unit, Centre, CommercialAgency, Article, ArticlePrice, TaxRate } from '../types';
import { hashPasswordWithSalt, verifyPassword } from './passwordUtils';

// ⚠️ IMPORTANT: URL dynamique pour supporter à la fois localhost et l'accès réseau
// L'API URL est automatiquement déterminée en fonction de l'hôte utilisé pour accéder au frontend
const getApiUrl = () => {
  // En production, utiliser import.meta.env.VITE_API_URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }
  
  // En développement, détecter automatiquement l'hôte
  const hostname = window.location.hostname;
  return `http://${hostname}:5000/api`;
};

const API_URL = getApiUrl();

// Configuration MongoDB - Informations de connexion sécurisées
// ⚠️ IMPORTANT: Ne jamais commiter les vrais identifiants dans le code
// Les variables d'environnement doivent être définies dans le fichier .env
const DB_CONFIG = {
  dbName: 'GestionEau',
  cluster: 'Cluster0',
  host: 'cluster0.l0q2v.mongodb.net',
  note: 'MongoDB Atlas via API'
};

const COLLECTIONS = {
  USERS: 'users',
  UNITS: 'units',
  CENTRES: 'centres',
  AGENCIES: 'agencies',
  CLIENTS: 'clients',
  REQUESTS: 'requests',
  QUOTES: 'quotes',
  WORK_TYPES: 'work_types',
  ARTICLES: 'articles',
  TAX_RATES: 'tax_rates'
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

  // Vérifie la connexion au backend API
  async isConnected(): Promise<boolean> {
    try {
      // Correction: URL correct pour l'endpoint status
      const response = await fetch(`${API_URL}/status`);
      return response.ok;
    } catch {
      return false;
    }
  },

  // Récupère tous les utilisateurs depuis le backend
  async getUsers(): Promise<User[]> {
    try {
      const data = await apiRequest<User[]>('GET', COLLECTIONS.USERS);
      return data.length > 0 ? data : [INITIAL_ADMIN];
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      // En cas d'erreur, retourner l'admin par défaut avec un avertissement
      console.warn('⚠️ Utilisation de l\'utilisateur admin par défaut. Vérifiez la connexion au backend.');
      return [INITIAL_ADMIN];
    }
  },
  
  // Sauvegarde un utilisateur avec hachage sécurisé du mot de passe
  async saveUser(user: User): Promise<void> { 
    // ⚠️ SÉCURITÉ: Le mot de passe est haché avant sauvegarde
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
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.USERS}/${encodedId}`, { method: 'DELETE' });
  },
  
  // Authentifie un utilisateur avec gestion des tentatives échouées
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
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      // Message d'erreur plus informatif pour l'utilisateur
      return { error: 'Impossible de se connecter au serveur. Vérifiez que le backend est en cours d\'exécution.' };
    }
  },

  async getUnits(): Promise<Unit[]> {
    return await apiRequest<Unit[]>('GET', COLLECTIONS.UNITS);
  },

  async saveUnit(unit: Unit): Promise<void> {
    await apiRequest('POST', COLLECTIONS.UNITS, unit);
  },

  async deleteUnit(id: string): Promise<void> {
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.UNITS}/${encodedId}`, { method: 'DELETE' });
  },

  async getCentres(): Promise<Centre[]> { 
    return await apiRequest<Centre[]>('GET', COLLECTIONS.CENTRES); 
  },
  
  async saveCentre(centre: Centre): Promise<void> { 
    await apiRequest('POST', COLLECTIONS.CENTRES, centre); 
  },
  
  async deleteCentre(id: string): Promise<void> {
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.CENTRES}/${encodedId}`, { method: 'DELETE' });
  },

  async getAgencies(): Promise<CommercialAgency[]> {
    return await apiRequest<CommercialAgency[]>('GET', COLLECTIONS.AGENCIES);
  },
  
  async saveAgency(agency: CommercialAgency): Promise<void> {
    await apiRequest('POST', COLLECTIONS.AGENCIES, agency);
  },
  
  async deleteAgency(id: string): Promise<void> {
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.AGENCIES}/${encodedId}`, { method: 'DELETE' });
  },

  async getClients(): Promise<Client[]> {
    return await apiRequest<Client[]>('GET', COLLECTIONS.CLIENTS);
  },
  
  async saveClient(client: Client): Promise<void> { 
    await apiRequest('POST', COLLECTIONS.CLIENTS, client); 
  },
  
  async deleteClient(id: string): Promise<void> {
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.CLIENTS}/${encodedId}`, { method: 'DELETE' });
  },

  async getRequests(): Promise<WorkRequest[]> {
    return await apiRequest<WorkRequest[]>('GET', COLLECTIONS.REQUESTS);
  },
  
  async saveRequest(request: WorkRequest): Promise<WorkRequest> {
    const response = await apiRequest<{ success: boolean; id: string }>('POST', COLLECTIONS.REQUESTS, request);
    return { ...request, id: response.id || request.id };
  },
  
  async deleteRequest(id: string): Promise<void> {
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.REQUESTS}/${encodedId}`, { method: 'DELETE' });
  },
  
  async updateRequestStatus(id: string, status: RequestStatus): Promise<void> {
    const response = await fetch(`${API_URL}/${COLLECTIONS.REQUESTS}/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du statut');
    }
  },

  async getQuotes(): Promise<Quote[]> {
    return await apiRequest<Quote[]>('GET', COLLECTIONS.QUOTES);
  },
  
  async saveQuote(quote: Quote): Promise<Quote> { 
    const response = await apiRequest<{ success: boolean; id: string }>('POST', COLLECTIONS.QUOTES, quote);
    return { ...quote, id: response.id || quote.id };
  },
  
  async deleteQuote(id: string): Promise<void> {
    try {
      const encodedId = encodeURIComponent(id);
      const response = await fetch(`${API_URL}/${COLLECTIONS.QUOTES}/${encodedId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Failed to delete quote: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du devis:', error);
      throw error; // Propager l'erreur pour gestion ultérieure
    }
  },
  
  async updateQuoteStatus(id: string, status: QuoteStatus): Promise<void> {
    const response = await fetch(`${API_URL}/${COLLECTIONS.QUOTES}/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du statut');
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
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.WORK_TYPES}/${encodedId}`, { method: 'DELETE' });
  },

  async getStats() {
    try {
      // Correction: URL correct pour l'endpoint stats
      const response = await fetch(`${API_URL}/stats`);
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
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

  // Helper pour migrer les anciens formats d'unités vers le nouveau format standardisé
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
  
  // Sauvegarde un article avec validation de l'unité
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
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.ARTICLES}/${encodedId}`, { method: 'DELETE' });
  },

  // Tax Rates methods
  async getTaxRates(): Promise<TaxRate[]> {
    return await apiRequest<TaxRate[]>('GET', COLLECTIONS.TAX_RATES);
  },

  async saveTaxRate(taxRate: TaxRate): Promise<void> {
    await apiRequest('POST', COLLECTIONS.TAX_RATES, taxRate);
  },

  async deleteTaxRate(id: string): Promise<void> {
    const encodedId = encodeURIComponent(id);
    await fetch(`${API_URL}/${COLLECTIONS.TAX_RATES}/${encodedId}`, { method: 'DELETE' });
  },

};
