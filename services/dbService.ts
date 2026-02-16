
import { Quote, QuoteStatus, Client, WorkType, User, UserRole, WorkRequest, RequestStatus, Centre, CommercialAgency } from '../types';
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
  WORK_TYPES: 'work_types'
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
  }
};
