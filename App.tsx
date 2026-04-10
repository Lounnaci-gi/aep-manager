
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
import { WorkRequestSuccess } from './components/WorkRequestSuccess';
import { BranchementQuoteForm } from './components/BranchementQuoteForm';
import { ArticleManager } from './components/ArticleManager';
import { StructureManager } from './components/StructureManager';
import { AgencyManager } from './components/AgencyManager';
import { WorkTypeManager } from './components/WorkTypeManager';
import { Login } from './components/Login';
import { UserList } from './components/UserList';
import { UserForm } from './components/UserForm';

import { DbService } from './services/dbService';
import { updateWorkflowRegistryFromWorkTypes } from './services/workflowConfig';
import { Quote, QuoteStatus, WorkType, Client, User, UserRole, WorkRequest, RequestStatus, Unit, Centre, CommercialAgency, ValidationType } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('aep_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [view, setView] = useState<'dashboard' | 'requests' | 'request-form' | 'request-success' | 'list' | 'create' | 'edit-quote' | 'clients' | 'client-form' | 'settings' | 'users' | 'user-form' | 'structure' | 'agencies' | 'branchement-quote' | 'articles'>('dashboard');
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>(undefined);
  const [editingRequest, setEditingRequest] = useState<WorkRequest | undefined>(undefined);
  const [lastSavedRequest, setLastSavedRequest] = useState<WorkRequest | undefined>(undefined);
  const [quoteRequest, setQuoteRequest] = useState<WorkRequest | undefined>(undefined);
  const [existingQuoteForBranchement, setExistingQuoteForBranchement] = useState<Quote | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [requests, setRequests] = useState<WorkRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [agencies, setAgencies] = useState<CommercialAgency[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

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
      const [q, r, c, w, u, ctr, agc, unitsData] = await Promise.all([
        DbService.getQuotes(),
        DbService.getRequests(),
        DbService.getClients(),
        DbService.getWorkTypes(),
        DbService.getUsers(),
        DbService.getCentres(),
        DbService.getAgencies(),
        DbService.getUnits()
      ]);
      
      setQuotes(q);
      setRequests(r);
      setClients(c);
      setWorkTypes(w);
      // Mettre à jour le registre dynamique des workflows avec la nouvelle configuration
      updateWorkflowRegistryFromWorkTypes(w);
      setUsers(u);
      setCentres(ctr);
      setAgencies(agc);
      setUnits(unitsData as Unit[]);
    } catch (error) {
      console.error("Erreur de chargement:", error);
      // Afficher une notification utilisateur en cas d'erreur
      Swal.fire({
        title: 'Erreur de Connexion',
        text: 'Impossible de charger les données. Vérifiez que le backend est en cours d\'exécution.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 5000,
        showConfirmButton: false
      });
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

  // Calcul des notifications pour chaque rôle
  const getPendingValidationsCount = () => {
    if (!currentUser) return 0;
    
    return requests.filter(req => {
      // Vérifier si la demande a des validations assignées
      if (!req.assignedValidations || req.assignedValidations.length === 0) return false;
      
      // Vérifier si l'utilisateur actuel a une validation assignée non validée
      switch (currentUser.role) {
        case UserRole.CHEF_AGENCE:
          return req.assignedValidations.includes(ValidationType.AGENCY) && 
                 !req.validations?.find(v => v.type === ValidationType.AGENCY && v.status === 'validated');
        case UserRole.AGENT:
          return req.assignedValidations.includes(ValidationType.CUSTOMER_SERVICE) && 
                 !req.validations?.find(v => v.type === ValidationType.CUSTOMER_SERVICE && v.status === 'validated');
        case UserRole.JURISTE:
          return req.assignedValidations.includes(ValidationType.LAWYER) && 
                 !req.validations?.find(v => v.type === ValidationType.LAWYER && v.status === 'validated');
        default:
          return false;
      }
    }).length;
  };

  // Calcul des demandes prêtes pour création de devis (dynamique selon les rôles du type de travail)
  const getReadyForQuoteCount = () => {
    if (!currentUser) return 0;
    
    const count = requests.filter(req => {
      // 1. Déterminer si l'utilisateur a le rôle pour établir un devis pour ce type de demande
      const workType = workTypes.find(wt => wt.label?.toLowerCase() === req.serviceType?.toLowerCase());
      const quoteRoles = workType?.quoteAllowedRoles && workType.quoteAllowedRoles.length > 0
        ? workType.quoteAllowedRoles
        : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.TECHICO_COMMERCIAL]; // fallback par défaut
      
      if (!quoteRoles.includes(currentUser.role)) return false;
      
      // 2. Vérifier qu'il n'y a pas encore de devis créé pour cette demande
      const hasQuote = quotes.some(q => q.requestId === req.id);
      if (hasQuote || req.status === RequestStatus.QUOTED || req.status === RequestStatus.REJECTED) return false;
      
      // 3. Vérifier que toutes les validations requises sont faites
      if (req.assignedValidations && req.assignedValidations.length > 0) {
        // La logique exacte du bouton: toutes les validations assignées doivent être terminées
        const allValidated = req.assignedValidations.every(type => 
          req.validations?.find(v => v.type === type && v.status === 'validated')
        );
        if (!allValidated) return false;
      } else if (req.validations && req.validations.length > 0) {
        // Si pas de assignedValidations, mais il y a des validations, on vérifie qu'elles sont toutes validées
        const allValidatedFallback = req.validations.every(v => v.status === 'validated');
        if (!allValidatedFallback) return false;
      } else {
        // Si aucune validation requise et aucune assignée, on se base sur le statut VALIDATED (workflow sans validation ?)
        if (req.status !== RequestStatus.VALIDATED) return false;
      }
      
      return true;
    }).length;
    
    return count;
  };

  const getQuoteEstablishmentCount = () => {
    // Rendue obsolète par la fonction ci-dessus, on retourne simplement 0.
    return 0;
  };

  const pendingValidationsCount = getPendingValidationsCount();
  const newRequestsCount = requests.filter(r => r.status === RequestStatus.RECEIVED).length;
  const readyForQuoteCount = getReadyForQuoteCount();
  const quoteEstablishmentCount = getQuoteEstablishmentCount();

  const handleSaveUnit = async (unit: Unit) => {
    try {
      await DbService.saveUnit(unit);
      await loadData();
      Swal.fire({ title: 'Unité Enregistrée', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'unité:', error);
      Swal.fire({ title: 'Erreur', text: 'Impossible d\'enregistrer l\'unité.', icon: 'error' });
    }
  };

  const handleDeleteUnit = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer cette unité ?', text: 'Tous les centres rattachés seront orphelins.', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      try {
        await DbService.deleteUnit(id);
        await loadData();
        Swal.fire('Supprimée !', '', 'success');
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'unité:', error);
        Swal.fire({ title: 'Erreur', text: 'Impossible de supprimer l\'unité.', icon: 'error' });
      }
    }
  };

  const handleSaveCentre = async (centre: Centre) => {
    try {
      await DbService.saveCentre(centre);
      await loadData();
      Swal.fire({ title: 'Centre Enregistré', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du centre:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible d\'enregistrer le centre. Vérifiez la connexion au serveur.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteCentre = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer ce centre ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      try {
        await DbService.deleteCentre(id);
        await loadData();
        Swal.fire('Supprimé !', '', 'success');
      } catch (error) {
        console.error('Erreur lors de la suppression du centre:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de supprimer le centre. Vérifiez la connexion au serveur.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleSaveAgency = async (agency: CommercialAgency) => {
    try {
      await DbService.saveAgency(agency);
      await loadData();
      Swal.fire({ title: 'Agence Mise à jour', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'agence:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible d\'enregistrer l\'agence. Vérifiez la connexion au serveur.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteAgency = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer cette agence ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      try {
        await DbService.deleteAgency(id);
        await loadData();
        Swal.fire('Supprimée', '', 'success');
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'agence:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de supprimer l\'agence. Vérifiez la connexion au serveur.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleSaveQuote = async (quote: Quote) => {
    try {
      await DbService.saveQuote(quote);
      if (quote.requestId) await DbService.updateRequestStatus(quote.requestId, RequestStatus.QUOTED);
      await loadData();
      setView('list');
      setEditingQuote(undefined);
      Swal.fire({ title: 'Devis Archivé', icon: 'success' });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du devis:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible d\'enregistrer le devis. Vérifiez la connexion au serveur.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteQuote = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer ce devis ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      try {
        const quoteToDelete = quotes.find(q => q.id === id);
        await DbService.deleteQuote(id);
        
        if (quoteToDelete?.requestId) {
          await DbService.updateRequestStatus(quoteToDelete.requestId, RequestStatus.VALIDATED);
        }
        
        await loadData();
        if (view === 'edit-quote') setView('list');
        Swal.fire('Supprimé', '', 'success');
      } catch (error) {
        console.error("Erreur de suppression:", error);
        Swal.fire('Erreur', 'Impossible de supprimer car le serveur est injoignable.', 'error');
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: QuoteStatus) => {
    try {
      if (status === QuoteStatus.APPROVED && currentUser) {
        // Logique de multi-validation
        const quotes = await DbService.getQuotes();
        const quote = quotes.find(q => q.id === id);
        if (!quote) throw new Error('Devis non trouvé');

        const workTypes = await DbService.getWorkTypes();
        const matchedWorkType = workTypes.find(wt => wt.label === quote.serviceType);
        const quoteValidationRoles = matchedWorkType?.quoteValidationRoles || [UserRole.ADMIN, UserRole.CHEF_CENTRE];

        if (!quoteValidationRoles.includes(currentUser.role)) {
          Swal.fire({ title: 'Non autorisé', text: 'Votre rôle ne vous permet pas de valider ce devis.', icon: 'error' });
          return;
        }

        const currentValidations = quote.validations || [];
        if (currentValidations.some(v => v.userId === currentUser.id && v.status === 'validated')) {
          Swal.fire({ title: 'Déjà validé', text: 'Vous avez déjà validé ce devis.', icon: 'info' });
          return;
        }

        const newValidation: any = {
          userId: currentUser.id,
          userName: currentUser.fullName,
          role: currentUser.role,
          status: 'validated',
          date: new Date().toISOString()
        };

        const updatedValidations = [...currentValidations, newValidation];
        
        // Vérifier si tout le monde a validé
        const allUsers = await DbService.getUsers();
        const requiredUsers = allUsers.filter(u => quoteValidationRoles.includes(u.role));
        const validatedUserIds = updatedValidations.filter(v => v.status === 'validated').map(v => v.userId);
        const isComplete = requiredUsers.every(u => validatedUserIds.includes(u.id));

        const updatedQuote = {
          ...quote,
          validations: updatedValidations,
          status: isComplete ? QuoteStatus.APPROVED : QuoteStatus.PENDING
        };

        await DbService.saveQuote(updatedQuote);
        
        if (isComplete) {
          Swal.fire({ title: 'Devis Approuvé', text: 'Toutes les validations ont été effectuées. Le devis peut maintenant être imprimé.', icon: 'success' });
        } else {
          Swal.fire({ 
            title: 'Validation Enregistrée', 
            text: `Votre validation a été prise en compte. (${validatedUserIds.length}/${requiredUsers.length} validations)`, 
            icon: 'info',
            toast: true,
            position: 'top-end',
            timer: 3000
          });
        }
      } else {
        // Comportement standard pour REJECTED ou autres
        await DbService.updateQuoteStatus(id, status);
        Swal.fire({ title: 'Statut Mis à jour', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      }
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de mettre à jour le statut.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleSaveRequest = async (request: WorkRequest) => {
    try {
      const saved = await DbService.saveRequest(request);
      // 'saved' contient maintenant l'ID définitif généré par le serveur
      await loadData();
      
      // Si c'est une nouvelle demande (pas une modification d'archive)
      if (!editingRequest) {
        setLastSavedRequest(saved);
        setEditingRequest(undefined);
        setView('request-success');
      } else {
        setView('requests');
        setEditingRequest(undefined);
        Swal.fire({ title: 'Demande Mise à jour', icon: 'success', timer: 2000, showConfirmButton: false });
      }
    } catch (error) {
      console.error("Erreur d'enregistrement:", error);
      Swal.fire({
        title: 'Erreur d\'Enregistrement',
        text: "Échec de l'enregistrement de la demande. Vérifiez que le backend est connecté.",
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer cette demande ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      try {
        await DbService.deleteRequest(id);
        await loadData();
        Swal.fire('Supprimée', '', 'success');
      } catch (error) {
        console.error('Erreur lors de la suppression de la demande:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de supprimer la demande. Vérifiez la connexion au serveur.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: RequestStatus) => {
    try {
      await DbService.updateRequestStatus(id, status);
      await loadData();
      Swal.fire({ title: 'Statut Mis à jour', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la demande:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de mettre à jour le statut.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
    }
  };

  const handleUpdateRequestWithValidations = async (request: WorkRequest) => {
    try {
      await DbService.saveRequest(request);
      await loadData();
      Swal.fire({ title: 'Validation Enregistrée', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la validation:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible d\'enregistrer la validation.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
    }
  };

  const handleCreateQuoteFromRequest = (request: WorkRequest) => {
    // Notification de création de devis
    Swal.fire({
      title: 'Création de Devis',
      text: 'Toutes les validations sont terminées. Vous pouvez maintenant créer le devis.',
      icon: 'info',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    });
    
    // Vérifier s'il existe déjà un devis pour cette demande
    const existingQuote = quotes.find(q => q.requestId === request.id);
    
    // Pour les branchements, utiliser le formulaire spécifique
    if (request.serviceType.toLowerCase().includes("branchement")) {
      setQuoteRequest(request);
      setExistingQuoteForBranchement(existingQuote);
      setView('branchement-quote');
    } else {
      // Pour les autres types, utiliser le formulaire existant
      const agency = agencies.find(a => a.id === request.agencyId);
      const centre = agency ? centres.find(c => c.id === agency.centreId) : centres[0];
      const prefix = centre?.prefix || 'DV';
      const year = new Date().getFullYear();
      const tempId = `TEMP-QUOTE-${Date.now()}-${prefix}-${year}`;

      const partialQuote: Partial<Quote> = existingQuote || {
        id: tempId,
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
        clientEmail: request.clientEmail || request.correspondenceEmail || '',
        clientPhone: request.clientPhone || request.correspondencePhone || '',
        clientFax: request.clientFax || '',
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
    }
  };

  const handleSaveClient = async (client: Client) => {
    try {
      await DbService.saveClient(client);
      await loadData();
      setView('clients');
      setEditingClient(undefined);
      Swal.fire({ title: 'Abonné Enregistré', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du client:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible d\'enregistrer le client. Vérifiez la connexion au serveur.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    const result = await Swal.fire({ title: 'Supprimer cet abonné ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      try {
        await DbService.deleteClient(id);
        await loadData();
        Swal.fire('Supprimé', '', 'success');
      } catch (error) {
        console.error('Erreur lors de la suppression du client:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de supprimer le client. Vérifiez la connexion au serveur.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleSaveUser = async (user: User) => {
    try {
      // Vérifier les droits du chef de centre
      if (currentUser?.role === UserRole.CHEF_CENTRE) {
        if (user.centreId !== currentUser.centreId) {
          Swal.fire({
            title: 'Action non autorisée',
            text: 'En tant que Chef-Centre, vous ne pouvez créer des utilisateurs que dans votre propre centre.',
            icon: 'error',
            confirmButtonColor: '#dc2626'
          });
          return;
        }
      }
      
      // Vérifier s'il y a déjà un administrateur
      const existingAdmin = users.some(u => u.role === UserRole.ADMIN && u.id !== user.id);
      
      if (user.role === UserRole.ADMIN && existingAdmin) {
        Swal.fire({
          title: 'Action non autorisée',
          text: 'Un administrateur existe déjà dans le système. Vous ne pouvez pas créer un second administrateur.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
        return;
      }
      
      await DbService.saveUser(user);
      await loadData();
      setView('users');
      setEditingUser(undefined);
      Swal.fire({ title: 'Collaborateur Mis à jour', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible d\'enregistrer l\'utilisateur. Vérifiez la connexion au serveur.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    const result = await Swal.fire({ title: 'Révoquer l\'accès ?', icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      try {
        await DbService.deleteUser(id);
        await loadData();
        Swal.fire('Supprimé', '', 'success');
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de supprimer l\'utilisateur. Vérifiez la connexion au serveur.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleAddWorkType = async (label: string, workType?: WorkType) => {
    try {
      const currentTypes = await DbService.getWorkTypes();
      const newType = workType || { id: Date.now().toString(), label };
      const newTypes = [...currentTypes, newType];
      await DbService.saveWorkTypes(newTypes);
      updateWorkflowRegistryFromWorkTypes(newTypes);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du type de travail:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible d\'ajouter le type de travail.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleUpdateWorkType = async (id: string, label: string, workType?: WorkType) => {
    try {
      const currentTypes = await DbService.getWorkTypes();
      const newTypes = currentTypes.map(t => t.id === id ? workType || { ...t, label } : t);
      await DbService.saveWorkTypes(newTypes);
      updateWorkflowRegistryFromWorkTypes(newTypes);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du type de travail:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de mettre à jour le type de travail.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteWorkType = async (id: string) => {
    try {
      const currentTypes = await DbService.getWorkTypes();
      const newTypes = currentTypes.filter(t => t.id !== id);
      await DbService.saveWorkTypes(newTypes);
      updateWorkflowRegistryFromWorkTypes(newTypes);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la suppression du type de travail:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de supprimer le type de travail.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }
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
      validationsBadgeCount={pendingValidationsCount}
      quotesBadgeCount={readyForQuoteCount > 0 ? readyForQuoteCount : quoteEstablishmentCount > 0 ? quoteEstablishmentCount : 0}
      workTypes={workTypes}
    >
      <main className="max-w-[94%] mx-auto py-6 sm:px-6 lg:px-8">
        {view === 'dashboard' && <Dashboard quotes={quotes} requests={requests} workTypes={workTypes} />}

        {view === 'structure' && (
          <StructureManager 
            units={units}
            centres={centres}
            agencies={agencies}
            onSaveUnit={handleSaveUnit}
            onDeleteUnit={handleDeleteUnit}
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
            users={users}
            workTypes={workTypes}
            onDelete={handleDeleteRequest} 
            onEdit={(r) => { setEditingRequest(r); setView('request-form'); }}
            onCreateQuote={handleCreateQuoteFromRequest}
            onUpdateStatus={handleUpdateRequestStatus}
            onUpdateRequestWithValidations={handleUpdateRequestWithValidations}
            currentUser={currentUser}
            quotes={quotes}
            units={units}
          />
        )}
        {view === 'request-form' && (
          <WorkRequestForm 
            clients={clients} 
            requests={requests}
            workTypes={workTypes} 
            agencies={agencies}
            centres={centres}
            initialData={editingRequest}
            currentUserAgencyId={currentUser.agencyId}
            currentUser={currentUser}
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
            requests={requests}
            onDelete={handleDeleteQuote} 
            onUpdateStatus={handleUpdateStatus} 
            onEdit={(q) => { setEditingQuote(q); setView('edit-quote'); }}
            currentUser={currentUser}
            users={users}
          />
        )}
        {view === 'request-success' && lastSavedRequest && (
          <WorkRequestSuccess 
            request={lastSavedRequest}
            agencies={agencies}
            centres={centres}
            onBack={() => { setView('requests'); setLastSavedRequest(undefined); }}
          />
        )}
        {view === 'branchement-quote' && quoteRequest && (
          <BranchementQuoteForm 
            request={quoteRequest}
            clients={clients} 
            agencies={agencies}
            centres={centres}
            units={units}
            quotes={quotes}
            users={users}
            workTypes={workTypes}
            currentUser={currentUser}
            existingQuote={existingQuoteForBranchement}
            onSave={handleSaveQuote}
            onCancel={() => { setView('requests'); setQuoteRequest(undefined); setExistingQuoteForBranchement(undefined); }} 
          />
        )}
        
        {view === 'articles' && (
          <ArticleManager 
            onBack={() => setView('dashboard')} 
          />
        )}
                
        {(view === 'create' || view === 'edit-quote') && (() => {
          const canManageQuotes = currentUser.role === UserRole.CHEF_CENTRE || 
                                  currentUser.role === UserRole.TECHICO_COMMERCIAL ||
                                  currentUser.role === UserRole.AGENT ||
                                  currentUser.role === UserRole.CHEF_AGENCE ||
                                  currentUser.role === UserRole.ADMIN;
          if (!canManageQuotes) {
            return (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5C2.3 17.333 3.262 19 4.803 19z" />
                  </svg>
                </div>
                <h2 className="text-lg font-black text-gray-700 uppercase tracking-widest">Accès Non Autorisé</h2>
                <p className="text-sm text-gray-400 max-w-sm">Seuls le Chef de Centre et le Technico-Commercial sont autorisés à créer ou modifier des devis.</p>
                <button onClick={() => setView('list')} className="mt-2 px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all">
                  Retour à la liste
                </button>
              </div>
            );
          }
          return (
            <QuoteForm 
              clients={clients} 
              requests={requests}
              quotes={quotes}
              workTypes={workTypes} 
              agencies={agencies}
              centres={centres}
              units={units}
              users={users}
              initialData={editingQuote}
              currentUserAgencyId={currentUser.agencyId}
              currentUser={currentUser}
              onSave={handleSaveQuote}
              onDelete={handleDeleteQuote}
              onCancel={() => { setView('list'); setEditingQuote(undefined); }} 
            />
          );
        })()}
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
        {view === 'settings' && <WorkTypeManager workTypes={workTypes} users={users} onAdd={handleAddWorkType} onUpdate={handleUpdateWorkType} onDelete={handleDeleteWorkType} currentUser={currentUser} />}
        {view === 'users' && (
          <div className="space-y-4">
            {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.CHEF_CENTRE) && (
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
            currentUser={currentUser}
            existingAdmin={users.some(u => u.role === UserRole.ADMIN && u.id !== editingUser?.id)}
            onSave={handleSaveUser} 
            onCancel={() => setView('users')} 
          />
        )}
      </main>
    </Layout>
  );
};

export default App;
