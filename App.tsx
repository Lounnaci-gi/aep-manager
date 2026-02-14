
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { QuoteList } from './components/QuoteList';
import { QuoteForm } from './components/QuoteForm';
import { ClientList } from './components/ClientList';
import { ClientForm } from './components/ClientForm';
import { WorkRequestList } from './components/WorkRequestList';
import { WorkRequestForm } from './components/WorkRequestForm';
import { StructureManager } from './components/StructureManager';
import { AgencyManager } from './components/AgencyManager';
import { WorkTypeManager } from './components/WorkTypeManager';
import { Login } from './components/Login';
import { UserList } from './components/UserList';
import { UserForm } from './components/UserForm';

import { DbService } from './services/dbService';
import { Quote, QuoteStatus, WorkType, Client, User, UserRole, WorkRequest, RequestStatus, Centre, CommercialAgency } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('aep_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [view, setView] = useState<'dashboard' | 'requests' | 'request-form' | 'list' | 'create' | 'edit-quote' | 'clients' | 'client-form' | 'settings' | 'users' | 'user-form' | 'structure' | 'agencies'>('dashboard');
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>(undefined);
  const [editingRequest, setEditingRequest] = useState<WorkRequest | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [requests, setRequests] = useState<WorkRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [agencies, setAgencies] = useState<CommercialAgency[]>([]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('aep_session', JSON.stringify(currentUser));
      loadData();
    } else {
      sessionStorage.removeItem('aep_session');
    }
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [q, r, c, w, u, ctr, agc] = await Promise.all([
        DbService.getQuotes(),
        DbService.getRequests(),
        DbService.getClients(),
        DbService.getWorkTypes(),
        DbService.getUsers(),
        DbService.getCentres(),
        DbService.getAgencies()
      ]);
      
      setQuotes(q);
      setRequests(r);
      setClients(c);
      setWorkTypes(w);
      setUsers(u);
      setCentres(ctr);
      setAgencies(agc);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('dashboard');
    Swal.fire({
      title: 'Accès Autorisé',
      text: `Session active.`,
      icon: 'success',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    Swal.fire({
      title: 'Déconnexion',
      text: 'Session terminée.',
      icon: 'info',
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const newRequestsCount = requests.filter(r => r.status === RequestStatus.RECEIVED).length;

  const handleSaveCentre = async (centre: Centre) => {
    await DbService.saveCentre(centre);
    await loadData();
    Swal.fire({ title: 'Centre Enregistré', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleDeleteCentre = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer ce centre ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      await DbService.deleteCentre(id);
      await loadData();
      Swal.fire('Supprimé !', '', 'success');
    }
  };

  const handleSaveAgency = async (agency: CommercialAgency) => {
    await DbService.saveAgency(agency);
    await loadData();
    Swal.fire({ title: 'Agence Mise à jour', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleDeleteAgency = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer cette agence ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      await DbService.deleteAgency(id);
      await loadData();
      Swal.fire('Supprimée', '', 'success');
    }
  };

  const handleSaveQuote = async (quote: Quote) => {
    await DbService.saveQuote(quote);
    if (quote.requestId) await DbService.updateRequestStatus(quote.requestId, RequestStatus.QUOTED);
    await loadData();
    setView('list');
    setEditingQuote(undefined);
    Swal.fire({ title: 'Devis Archivé', icon: 'success' });
  };

  const handleDeleteQuote = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer ce devis ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      await DbService.deleteQuote(id);
      await loadData();
      if (view === 'edit-quote') setView('list');
      Swal.fire('Supprimé', '', 'success');
    }
  };

  const handleUpdateStatus = async (id: string, status: QuoteStatus) => {
    await DbService.updateQuoteStatus(id, status);
    await loadData();
    Swal.fire({ title: 'Statut Mis à jour', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
  };

  const handleSaveRequest = async (request: WorkRequest) => {
    await DbService.saveRequest(request);
    await loadData();
    setView('requests');
    setEditingRequest(undefined);
    Swal.fire({ title: 'Demande Enregistrée', icon: 'success', timer: 2000, showConfirmButton: false });
  };

  const handleDeleteRequest = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer cette demande ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      await DbService.deleteRequest(id);
      await loadData();
      Swal.fire('Supprimée', '', 'success');
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: RequestStatus) => {
    await DbService.updateRequestStatus(id, status);
    await loadData();
    Swal.fire({ title: 'Statut Mis à jour', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
  };

  const handleCreateQuoteFromRequest = (request: WorkRequest) => {
    const partialQuote: Partial<Quote> = {
      id: `AEP-${Date.now().toString().slice(-6)}`,
      requestId: request.id,
      agencyId: request.agencyId,
      category: request.category,
      civility: request.civility,
      clientName: request.clientName,
      businessName: request.businessName,
      idDocumentType: request.idDocumentType,
      idDocumentNumber: request.idDocumentNumber,
      idDocumentIssueDate: request.idDocumentIssueDate,
      idDocumentIssuer: request.idDocumentIssuer,
      clientEmail: request.clientEmail,
      clientPhone: request.clientPhone,
      address: request.address,
      commune: request.commune,
      installationAddress: request.installationAddress,
      installationCommune: request.installationCommune,
      serviceType: request.serviceType,
      description: request.description,
      type: request.type,
      status: QuoteStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    setEditingQuote(partialQuote as Quote);
    setView('create');
  };

  const handleSaveClient = async (client: Client) => {
    await DbService.saveClient(client);
    await loadData();
    setView('clients');
    setEditingClient(undefined);
    Swal.fire({ title: 'Abonné Enregistré', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleDeleteClient = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer cet abonné ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      await DbService.deleteClient(id);
      await loadData();
      Swal.fire('Supprimé', '', 'success');
    }
  };

  const handleSaveUser = async (user: User) => {
    await DbService.saveUser(user);
    await loadData();
    setView('users');
    setEditingUser(undefined);
    Swal.fire({ title: 'Collaborateur Mis à jour', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleDeleteUser = async (id: string) => {
    const result = await Swal.fire({ title: 'Révoquer l\'accès ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      await DbService.deleteUser(id);
      await loadData();
      Swal.fire('Supprimé', '', 'success');
    }
  };

  const handleAddWorkType = async (label: string) => {
    const currentTypes = await DbService.getWorkTypes();
    const newTypes = [...currentTypes, { id: Date.now().toString(), label }];
    await DbService.saveWorkTypes(newTypes);
    await loadData();
  };

  const handleUpdateWorkType = async (id: string, label: string) => {
    const currentTypes = await DbService.getWorkTypes();
    const newTypes = currentTypes.map(t => t.id === id ? { ...t, label } : t);
    await DbService.saveWorkTypes(newTypes);
    await loadData();
  };

  const handleDeleteWorkType = async (id: string) => {
    const currentTypes = await DbService.getWorkTypes();
    const newTypes = currentTypes.filter(t => t.id !== id);
    await DbService.saveWorkTypes(newTypes);
    await loadData();
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 font-black uppercase tracking-widest text-[10px] text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Chargement des données...
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentView={view as any} 
      setView={setView as any} 
      user={currentUser} 
      onLogout={handleLogout}
      onEditProfile={() => { setEditingUser(currentUser || undefined); setView('user-form'); }}
      requestsBadgeCount={newRequestsCount}
    >
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {view === 'dashboard' && <Dashboard quotes={quotes} requests={requests} workTypes={workTypes} />}

        {view === 'structure' && (
          <StructureManager 
            centres={centres}
            agencies={agencies}
            onSaveCentre={handleSaveCentre}
            onDeleteCentre={handleDeleteCentre}
            onSaveAgency={handleSaveAgency}
            onDeleteAgency={handleDeleteAgency}
          />
        )}
        {view === 'agencies' && (
          <AgencyManager 
            agencies={agencies}
            centres={centres}
            onSaveAgency={handleSaveAgency}
            onDeleteAgency={handleDeleteAgency}
          />
        )}
        {view === 'requests' && (
          <WorkRequestList 
            requests={requests} 
            agencies={agencies}
            centres={centres}
            onDelete={handleDeleteRequest} 
            onEdit={(r) => { setEditingRequest(r); setView('request-form'); }}
            onCreateQuote={handleCreateQuoteFromRequest}
            onUpdateStatus={handleUpdateRequestStatus}
          />
        )}
        {view === 'request-form' && (
          <WorkRequestForm 
            clients={clients} 
            workTypes={workTypes} 
            agencies={agencies}
            centres={centres}
            initialData={editingRequest}
            currentUserAgencyId={currentUser.agencyId}
            onSave={handleSaveRequest}
            onCancel={() => { setView('requests'); setEditingRequest(undefined); }}
          />
        )}
        {view === 'list' && (
          <QuoteList 
            quotes={quotes} 
            centres={centres}
            agencies={agencies}
            workTypes={workTypes}
            onDelete={handleDeleteQuote} 
            onUpdateStatus={handleUpdateStatus} 
            onEdit={(q) => { setEditingQuote(q); setView('edit-quote'); }} 
          />
        )}
        {(view === 'create' || view === 'edit-quote') && (
          <QuoteForm 
            clients={clients} 
            workTypes={workTypes} 
            agencies={agencies}
            centres={centres}
            initialData={editingQuote}
            currentUserAgencyId={currentUser.agencyId}
            onSave={handleSaveQuote} 
            onDelete={handleDeleteQuote}
            onCancel={() => { setView('list'); setEditingQuote(undefined); }} 
          />
        )}
        {view === 'clients' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setEditingClient(undefined); setView('client-form'); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700">
                Nouvel Abonné
              </button>
            </div>
            <ClientList clients={clients} onDelete={handleDeleteClient} onEdit={(c) => { setEditingClient(c); setView('client-form'); }} />
          </div>
        )}
        {view === 'client-form' && <ClientForm initialData={editingClient} onSave={handleSaveClient} onCancel={() => setView('clients')} />}
        {view === 'settings' && <WorkTypeManager workTypes={workTypes} onAdd={handleAddWorkType} onUpdate={handleUpdateWorkType} onDelete={handleDeleteWorkType} />}
        {view === 'users' && (
          <div className="space-y-4">
            {currentUser?.role === UserRole.ADMIN && (
            <div className="flex justify-end">
              <button onClick={() => { setEditingUser(undefined); setView('user-form'); }} className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700">
                Ajouter un Membre
              </button>
            </div>
            )}
            <UserList 
              users={users} 
              centres={centres}
              agencies={agencies}
              currentUser={currentUser}
              onDelete={handleDeleteUser} 
              onEdit={(u) => { setEditingUser(u); setView('user-form'); }} 
            />
          </div>
        )}
        {(view === 'user-form') && (
          <UserForm 
            initialData={editingUser} 
            centres={centres}
            agencies={agencies}
            onSave={handleSaveUser} 
            onCancel={() => setView('users')} 
          />
        )}
      </main>
    </Layout>
  );
};

export default App;
