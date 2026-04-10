export enum QuoteStatus {
  PENDING = 'En attente',
  APPROVED = 'Approuve',
  REJECTED = 'Rejete',
  PAID = 'Paye'
}

export enum RequestStatus {
  RECEIVED = 'Recue',
  UNDER_STUDY = 'A letude',
  AWAITING_AGENCY_VALIDATION = 'En attente validation agence',
  AWAITING_CUSTOMER_SERVICE_VALIDATION = 'En attente validation relation clientèle',
  AWAITING_LAWYER_VALIDATION = 'En attente validation juriste',
  VALIDATED = 'Validee',
  REJECTED = 'Rejetee',
  QUOTED = 'Devis etabli'
}

// Types de validation possibles
export enum ValidationType {
  AGENCY = 'agency',
  CUSTOMER_SERVICE = 'customer_service',
  LAWYER = 'lawyer'
}

// Interface pour le suivi des validations
export interface ValidationRecord {
  type: ValidationType;
  userId: string;
  userName: string;
  validatedAt: string;
  status: 'pending' | 'validated' | 'rejected';
  date?: string;
  user?: string;
  reason?: string;
}

export enum UserRole {
  ADMIN = 'Administrateur',
  CHEF_CENTRE = 'Chef-Centre',
  AGENT = 'Relation-Clientele',
  CHEF_AGENCE = 'Chef-Agence',
  JURISTE = 'Juriste',
  TECHICO_COMMERCIAL = 'Technico-Commerciale'
}

export enum ClientCategory {
  PHYSICAL = 'Individu',
  LEGAL = 'Entreprise / Chantier'
}

export enum BranchementType {
  DOMESTIQUE = 'Domestique (Maison individuelle)',
  IMMEUBLE = 'Immeuble collectif',
  COMMERCIAL = 'Commerciaux',
  INDUSTRIEL = 'Industrie ou tourisme',
  CHANTIER = 'Besoins de chantier',
  INCENDIE = 'Borne d\'incendie',
  AUTRE = 'Autres (à préciser)'
}

export interface Unit {
  id: string;
  name: string;
  address: string;
  commune: string;
  phone: string;
  secondaryPhone?: string;
  fax?: string;
  email?: string;
  nif: string;
  nis: string;
  rc: string;
  ai: string;
  bankName: string;
  bankAccount: string;
  comptePostale: string;
  createdAt: string;
}

export interface Centre {
  id: string;
  unitId: string;
  name: string;
  prefix: string;
  address: string;
  commune: string;
  postalCode: string;
  phone: string;
  secondaryPhone?: string;
  fax?: string;
  email?: string;
  bankName?: string;
  bankAccount?: string;
  comptePostale?: string;
  createdAt: string;
}

export interface CommercialAgency {
  id: string;
  centreId: string;
  name: string;
  address: string;
  phone: string;
  secondaryPhone?: string;
  fax?: string;
  email?: string;
  comptePostale?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: ClientCategory;
  nin?: string;
  commune: string;
  installationAddress: string;
  installationCommune: string;
  type: 'Proprietaire' | 'Locataire' | 'Mandataire';
  civility?: string;
  businessName?: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  idDocumentIssueDate?: string;
  idDocumentIssuer?: string;
  fax?: string;
  createdAt: string;
}

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  margin?: number;
  tva?: number;
  totalHT?: number;
  priceTypeIndicator?: string;
}

export interface ArticlePrice {
  type: 'fourniture' | 'pose' | 'prestation';
  price: number;
}

// Types de propriétés pour les articles
export enum PropertyType {
  COLOR = 'Couleur',
  DIAMETER = 'Diamètre',
  PRESSURE = 'Pression',
  LENGTH = 'Longueur',
  WEIGHT = 'Poids',
  BRAND = 'Marque',
  STANDARD = 'Norme',
  CLASS = 'Classe',
  CUSTOM = 'Personnalisé'
}

export interface ArticleProperty {
  id: string;
  name: string;
  value: string;
  type: PropertyType;
  unit?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  name: string;
  description: string;
  prices: ArticlePrice[];
  category: string;
  unit: 'M²' | 'M2' | 'M3' | 'ML' | 'U' | 'NULL';
  material?: string;
  class?: string;
  nominalPressure?: string;
  color?: string;
  properties?: ArticleProperty[];
  createdAt: string;
  defaultPriceType?: 'fourniture' | 'pose' | 'fourniture_et_pose';
}

export interface WorkRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  centreId: string;
  installationAddress: string;
  installationCommune: string;
  serviceType: string;
  description: string;
  type: 'Proprietaire' | 'Locataire' | 'Mandataire';
  status: RequestStatus;
  agencyId: string;
  category?: ClientCategory;
  civility?: string;
  businessName?: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  idDocumentIssueDate?: string;
  idDocumentIssuer?: string;
  address?: string;
  commune?: string;
  branchementType?: BranchementType;
  branchementDetails?: string;
  diameter?: string;
  flowRate?: string;
  correspondencePhone?: string;
  correspondenceEmail?: string;
  installationPhone?: string;
  installationEmail?: string;
  clientFax?: string;
  createdAt: string;
  // Nouveau système de validation
  validations?: ValidationRecord[];
  assignedValidations?: ValidationType[]; // Validations assignées à cette demande
  rejectionReason?: string;
}

export interface Quote {
  id: string;
  requestId: string;
  clientId: string;
  clientName: string;
  centreId: string;
  agencyId?: string;
  address?: string;
  commune?: string;
  installationAddress: string;
  installationCommune: string;
  serviceType: string;
  description: string;
  type: 'Proprietaire' | 'Locataire' | 'Mandataire';
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: QuoteStatus;
  category?: ClientCategory;
  civility?: string;
  businessName?: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  idDocumentIssueDate?: string;
  idDocumentIssuer?: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt: string;
  // Nouveaux champs pour le style devis BTP
  projectTitle?: string;
  validUntil?: string;
  workStartDate?: string;
  estimatedDuration?: string;
  paymentConditions?: string;
  iban?: string;
  bic?: string;
  wasteManagement?: string;
  clientFax?: string;
  validations?: ValidationRecord[];
}

export interface WorkType {
  id: string;
  name?: string;
  description?: string;
  label?: string;
  allowedRoles?: UserRole[]; // Rôles autorisés à créer ce type de travail
  requestValidationRoles?: UserRole[]; // Rôles autorisés à valider la demande
  quoteAllowedRoles?: UserRole[]; // Rôles autorisés à créer des devis pour ce type
  quoteValidationRoles?: UserRole[]; // Rôles autorisés à valider les devis pour ce type
  deleteAllowedRoles?: UserRole[]; // Rôles autorisés à supprimer ce type de travail
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  email: string;
  password?: string;
  role: UserRole;
  centreId: string;
  agencyId?: string;
  createdAt: string;
}

// Permissions par défaut pour les types de travaux
export const WORK_TYPE_PERMISSIONS: Record<string, UserRole[]> = {
  'Branchement eau potable': [UserRole.AGENT, UserRole.CHEF_AGENCE],
  'Branchement assainissement': [UserRole.AGENT, UserRole.CHEF_AGENCE],
  'Réparation fuite': [UserRole.AGENT, UserRole.CHEF_AGENCE, UserRole.TECHICO_COMMERCIAL],
  'Changement compteur': [UserRole.AGENT, UserRole.CHEF_AGENCE],
  'Déménagement branchement': [UserRole.AGENT, UserRole.CHEF_AGENCE],
  'Fermeture compte': [UserRole.AGENT, UserRole.CHEF_AGENCE, UserRole.JURISTE],
  'Résiliation contrat': [UserRole.CHEF_AGENCE, UserRole.JURISTE],
  'Audit technique': [UserRole.TECHICO_COMMERCIAL, UserRole.CHEF_AGENCE],
  // Ajoutez d'autres types selon vos besoins
};

// ============================================================================
// NOUVEAU: Types pour le moteur de workflow dynamique
// ============================================================================

// Étapes possibles dans un workflow
export enum WorkflowStepType {
  VALIDATION = 'validation',
  QUOTATION = 'quotation',
  QUOTE_VALIDATION = 'quote_validation',
  PRINTING = 'printing',
  COMPLETION = 'completion'
}

// Configuration d'une étape de workflow
export interface WorkflowStepConfig {
  step: WorkflowStepType;
  label: string;
  requiredRoles: UserRole[]; // Rôles qui peuvent exécuter cette étape
  validationType?: ValidationType; // Si c'est une étape de validation
  skipCondition?: (request: WorkRequest) => boolean; // Condition pour ignorer l'étape
  nextStep?: WorkflowStepType;
}

// Configuration complète du workflow pour un type de travaux
export interface WorkTypeWorkflow {
  workTypeId: string; // ou workTypeLabel
  workTypeName: string;
  steps: WorkflowStepConfig[];
  requiresQuotation: boolean; // true si le devis est obligatoire
}

// État actuel d'une demande dans le workflow
export interface WorkflowState {
  currentStep: WorkflowStepType;
  completedSteps: WorkflowStepType[];
  isComplete: boolean;
  canProceed: boolean;
}

// Résultat de vérification de permission
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  nextAction?: string;
}
