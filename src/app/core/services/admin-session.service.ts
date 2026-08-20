import { Injectable } from '@angular/core';

const ADMIN_KEY      = 'fw_admin';
const SUPERADMIN_KEY = 'fw_superadmin';

/**
 * Single source of truth for the app's two session-based auth levels:
 *  - alliance admin  (logged in for one specific alliance)
 *  - superadmin      (logged in globally — can administer every alliance)
 *
 * Kept in one place so "superadmin can do anything" only has to be
 * expressed once, instead of duplicated per-component checks silently
 * drifting out of sync.
 */
@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  isSuperAdmin(): boolean {
    return sessionStorage.getItem(SUPERADMIN_KEY) === 'true';
  }

  isAllianceAdmin(allianceId: string): boolean {
    return sessionStorage.getItem(ADMIN_KEY) === allianceId;
  }

  /** True if the current session can administer this alliance's wiki. */
  canAdminister(allianceId: string): boolean {
    return this.isSuperAdmin() || this.isAllianceAdmin(allianceId);
  }

  loginSuperAdmin(): void {
    sessionStorage.setItem(SUPERADMIN_KEY, 'true');
  }

  logoutSuperAdmin(): void {
    sessionStorage.removeItem(SUPERADMIN_KEY);
  }

  loginAllianceAdmin(allianceId: string): void {
    sessionStorage.setItem(ADMIN_KEY, allianceId);
  }

  logoutAllianceAdmin(): void {
    sessionStorage.removeItem(ADMIN_KEY);
  }
}
