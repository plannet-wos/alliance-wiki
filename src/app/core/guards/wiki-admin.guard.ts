import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminSessionService } from '../services/admin-session.service';

/**
 * UX-only guard — NOT a security boundary. Firestore rules allow anyone to
 * write to wiki_articles regardless of session state (see firestore.rules
 * in the foundry-planner repo for why that can't be fixed without a real
 * backend/auth). This guard only keeps the in-app experience consistent —
 * it stops a non-admin browser from landing on the editor via a
 * typed/guessed URL, nothing more.
 */
export const wikiAdminGuard: CanActivateFn = (route) => {
  const adminSession = inject(AdminSessionService);
  const router        = inject(Router);
  const allianceId     = route.paramMap.get('allianceId')!;

  return adminSession.canAdminister(allianceId) || router.createUrlTree(['/wiki', allianceId]);
};
