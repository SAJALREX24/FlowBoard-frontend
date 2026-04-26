import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

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
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'workspaces',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/workspaces/workspaces.component').then(m => m.WorkspacesComponent)
  },
  {
    path: 'workspaces/:workspaceId/boards',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/boards/boards.component').then(m => m.BoardsComponent)
  },
  {
    path: 'boards/:boardId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/board-view/board-view.component').then(m => m.BoardViewComponent)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];