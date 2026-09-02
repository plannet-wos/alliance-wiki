import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { allianceId } from '../models/alliance.model';

/**
 * UX-only guard — NOT a security boundary. Firestore rules allow anyone to write to
 * wiki_articles regardless of session state (see firestore.rules in the plannet-wos repo for
 * why that can't be fixed without abandoning the wiki's public-write model — a deliberate
 * trade-off, not an oversight). This guard only keeps the in-app experience consistent — it
 * stops a non-admin browser from landing on the editor via a typed/guessed URL, nothing more.
 */
export const wikiAdminGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const stateId = route.paramMap.get('stateId')!;
  const allianceSlug = route.paramMap.get('allianceSlug')!;

  return auth.canAdminister(allianceId(stateId, allianceSlug))
    || router.createUrlTree([stateId, 'wiki', allianceSlug]);
};
