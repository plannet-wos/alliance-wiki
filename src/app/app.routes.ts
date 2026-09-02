import { Routes } from '@angular/router';
import { wikiAdminGuard } from './core/guards/wiki-admin.guard';

/**
 * :stateId gates the whole app now (see the multi-state rollout plan) — bare `/` redirects to
 * state 3038, the only state that existed before that rollout, same transition-window default
 * used elsewhere in the suite. :allianceId is renamed :allianceSlug: the real Firestore
 * document ID is the composite "{stateId}-{slug}" (see allianceId() in alliance.model.ts),
 * kept out of the URL to stay readable.
 */
export const routes: Routes = [
  { path: '', redirectTo: '3038/wiki', pathMatch: 'full' },
  {
    path: ':stateId/wiki',
    loadComponent: () => import('./features/wiki-home/wiki-home').then(m => m.WikiHome)
  },
  {
    path: ':stateId/wiki/:allianceSlug',
    loadComponent: () => import('./features/wiki-list/wiki-list').then(m => m.WikiList)
  },
  {
    path: ':stateId/wiki/:allianceSlug/new',
    loadComponent: () => import('./features/wiki-editor/wiki-editor').then(m => m.WikiEditor),
    canActivate: [wikiAdminGuard]
  },
  {
    path: ':stateId/wiki/:allianceSlug/edit/:articleId',
    loadComponent: () => import('./features/wiki-editor/wiki-editor').then(m => m.WikiEditor),
    canActivate: [wikiAdminGuard]
  },
  {
    path: ':stateId/wiki/:allianceSlug/article/:articleId',
    loadComponent: () => import('./features/wiki-article/wiki-article').then(m => m.WikiArticle)
  },
];
