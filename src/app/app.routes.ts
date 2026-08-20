import { Routes } from '@angular/router';
import { wikiAdminGuard } from './core/guards/wiki-admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'wiki', pathMatch: 'full' },
  {
    path: 'wiki',
    loadComponent: () => import('./features/wiki-home/wiki-home').then(m => m.WikiHome)
  },
  {
    path: 'wiki/:allianceId',
    loadComponent: () => import('./features/wiki-list/wiki-list').then(m => m.WikiList)
  },
  {
    path: 'wiki/:allianceId/new',
    loadComponent: () => import('./features/wiki-editor/wiki-editor').then(m => m.WikiEditor),
    canActivate: [wikiAdminGuard]
  },
  {
    path: 'wiki/:allianceId/edit/:articleId',
    loadComponent: () => import('./features/wiki-editor/wiki-editor').then(m => m.WikiEditor),
    canActivate: [wikiAdminGuard]
  },
  {
    path: 'wiki/:allianceId/article/:articleId',
    loadComponent: () => import('./features/wiki-article/wiki-article').then(m => m.WikiArticle)
  },
];
