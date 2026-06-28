import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserForumService {

  /**
   * Extract current user ID from Keycloak JWT token stored in localStorage
   * The token is typically stored by Keycloak Angular library
   */
  getCurrentUserId(): string {
    const token = this.getToken();
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.preferred_username || '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Extract current username from Keycloak JWT token
   */
  getCurrentUsername(): string {
    const token = this.getToken();
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.preferred_username || payload.name || '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Check if current user is the owner of a resource
   */
  isOwner(ownerId: string | undefined): boolean {
    if (!ownerId) return false;
    return this.getCurrentUserId() === ownerId;
  }

  /**
   * Extract user roles from Keycloak JWT token
   * Returns array of roles from realm_access.roles in the JWT payload
   */
  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.realm_access?.roles || [];
    } catch (e) {
      console.warn('Failed to parse JWT roles:', e);
      return [];
    }
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  /**
   * Check if user can create articles
   * Only DIETITIAN and ADMIN roles can create articles
   */
  canCreateArticle(): boolean {
    return this.hasRole('DIETITIAN') || this.hasRole('ADMIN');
  }

  /**
   * Check if user can comment
   * STUDENT, DIETITIAN, and ADMIN can comment
   */
  canComment(): boolean {
    return this.hasRole('STUDENT') || this.hasRole('DIETITIAN') || this.hasRole('ADMIN');
  }

  /**
   * Check if user can reply to comments
   * Same permissions as commenting
   */
  canReply(): boolean {
    return this.canComment();
  }

  /**
   * Check if current user is an admin
   * Used for admin-only operations (override delete, edit all items, etc.)
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Get token from localStorage - try multiple possible keys
   * The app stores the token under 'token' key via AuthService
   * Also check common Keycloak key names as fallback
   */
  private getToken(): string | null {
    return localStorage.getItem('token')
      || localStorage.getItem('kc_token')
      || localStorage.getItem('keycloak_token')
      || localStorage.getItem('access_token')
      || sessionStorage.getItem('kc_token')
      || null;
  }
}