
import { User, UserRole, WorkType } from '../types';

export class PermissionService {
  /**
   * Vérifie si un utilisateur a le droit de CRÉER ou MODIFIER un devis pour un type de travaux donné.
   * @param user L'utilisateur actuel
   * @param workType Le type de travaux concerné
   * @returns true si l'utilisateur est autorisé
   */
  static canManageQuote(user: User | null | undefined, workType: WorkType | undefined): boolean {
    if (!user) return false;
    
    // Les rôles autorisés à créer/modifier un devis pour ce type de travail
    // Si aucun rôle n'est explicitement défini dans quoteAllowedRoles, on utilise un fallback par défaut
    const quoteRoles = workType?.quoteAllowedRoles && workType.quoteAllowedRoles.length > 0
      ? workType.quoteAllowedRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.TECHICO_COMMERCIAL]; // Fallback standard
      
    return quoteRoles.includes(user.role);
  }

  /**
   * Vérifie si un utilisateur a le droit de SUPPRIMER un devis pour un type de travaux donné.
   */
  static canDeleteQuote(user: User | null | undefined, workType: WorkType | undefined): boolean {
    if (!user) return false;
    
    const deleteRoles = workType?.quoteDeleteAllowedRoles && workType.quoteDeleteAllowedRoles.length > 0
      ? workType.quoteDeleteAllowedRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE]; // Fallback standard pour suppression
      
    return deleteRoles.includes(user.role);
  }

  /**
   * Vérifie si un utilisateur a le droit de CRÉER ou MODIFIER une demande (WorkRequest).
   */
  static canManageWorkRequest(user: User | null | undefined, workType: WorkType | undefined): boolean {
    if (!user) return false;
    
    const allowedRoles = workType?.allowedRoles && workType.allowedRoles.length > 0
      ? workType.allowedRoles
      : [UserRole.ADMIN, UserRole.CHEF_CENTRE, UserRole.AGENT, UserRole.TECHICO_COMMERCIAL];
      
    return allowedRoles.includes(user.role);
  }
}
