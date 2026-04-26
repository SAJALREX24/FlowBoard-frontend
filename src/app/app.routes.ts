import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'workspaces',
    loadComponent: () => import('./pages/workspaces/workspaces.component').then(m => m.WorkspacesComponent)
  },
  {
    path: 'workspaces/:workspaceId/boards',
    loadComponent: () => import('./pages/boards/boards.component').then(m => m.BoardsComponent)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];