
import { User, UserRole, WorkType, Quote, QuoteStatus } from '../types';

export class PermissionService {
  /**
   * Vérifie si un devis est entièrement validé par tous les rôles requis.
   */
  static isQuoteFullyValidated(quote: Quote | undefined, workType: WorkType | undefined, allUsers: User[]): boolean {
    if (!quote || !workType) return false;

    // 1. Définir les rôles de validation requis
    const quoteValidationRoles = (workType.quoteValidationRoles && workType.quoteValidationRoles.length > 0)
      ? workType.quoteValidationRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE];

    // 2. Identifier les utilisateurs physiques correspondant à ces rôles
    const requiredUsers = allUsers.filter(u => quoteValidationRoles.includes(u.role));
    if (requiredUsers.length === 0) return quote.status === QuoteStatus.APPROVED;

    // 3. Vérifier les validations effectives
    const currentValidations = quote.validations || [];
    const validatedUserIds = currentValidations.filter(v => v.status === 'validated').map(v => v.userId);

    // 4. Est-ce que TOUS les utilisateurs requis ont signé ?
    const allUsersValidated = requiredUsers.every(u => validatedUserIds.includes(u.id));

    return quote.status === QuoteStatus.APPROVED && allUsersValidated;
  }

  /**
   * Vérifie si un utilisateur a le droit d'IMPRIMER un devis.
   * Autorisé pour ADMIN, CHEF_CENTRE, ou toute personne autorisée à créer la demande.
   */
  static canPrintQuote(user: User | null | undefined, workType: WorkType | undefined): boolean {
    if (!user || !workType) return false;
    
    // Un utilisateur peut imprimer s'il peut gérer le devis OU s'il peut gérer la demande source
    const quoteRoles = workType.quoteAllowedRoles && workType.quoteAllowedRoles.length > 0
      ? workType.quoteAllowedRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.TECHICO_COMMERCIAL];

    const requestRoles = workType.allowedRoles && workType.allowedRoles.length > 0
      ? workType.allowedRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.AGENT];

    return quoteRoles.includes(user.role) || requestRoles.includes(user.role);
  }

  /**
   * Vérifie si un utilisateur a le droit de CRÉER ou MODIFIER un devis.
   */
  static canManageQuote(
    user: User | null | undefined, 
    workType: WorkType | undefined,
    quote?: Quote,
    allUsers?: User[]
  ): boolean {
    if (!user || !workType) return false;
    
    const isQuoteRole = (workType.quoteAllowedRoles && workType.quoteAllowedRoles.length > 0
      ? workType.quoteAllowedRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.TECHICO_COMMERCIAL]).includes(user.role);

    const isRequestRole = (workType.allowedRoles && workType.allowedRoles.length > 0
      ? workType.allowedRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.AGENT]).includes(user.role);

    // 1. Si l'utilisateur est dans les rôles spécifiques au devis, il peut gérer (sauf règles métier extra prioritaires)
    if (isQuoteRole) return true;

    // 2. Si l'utilisateur est dans les rôles de demande, il peut modifier TANT QUE ce n'est pas validé par tous
    if (isRequestRole) {
      if (quote && allUsers) {
        const isValidated = this.isQuoteFullyValidated(quote, workType, allUsers);
        if (isValidated) return false; // Bloqué si validé par tous
      }
      return true; // Autorisé si non encore validé par tous
    }
      
    return false;
  }

  /**
   * Vérifie si un utilisateur a le droit de SUPPRIMER un devis.
   */
  static canDeleteQuote(user: User | null | undefined, workType: WorkType | undefined): boolean {
    if (!user || !workType) return false;
    
    const deleteRoles = workType.quoteDeleteAllowedRoles && workType.quoteDeleteAllowedRoles.length > 0
      ? workType.quoteDeleteAllowedRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE];
      
    return deleteRoles.includes(user.role);
  }

  /**
   * Vérifie si un utilisateur a le droit de CRÉER ou MODIFIER une demande (WorkRequest).
   */
  static canManageWorkRequest(user: User | null | undefined, workType: WorkType | undefined): boolean {
    if (!user || !workType) return false;
    
    const allowedRoles = workType.allowedRoles && workType.allowedRoles.length > 0
      ? workType.allowedRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.AGENT, UserRole.TECHICO_COMMERCIAL];
      
    return allowedRoles.includes(user.role);
  }
}
