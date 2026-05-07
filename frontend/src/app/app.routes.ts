import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Guest routes ────────────────────────────────────────────────────────
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },

  // ── Protected shell ─────────────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./features/leads/leads-list/leads-list.component').then(m => m.LeadsListComponent),
      },
      {
        path: 'leads/new',
        loadComponent: () =>
          import('./features/leads/lead-form/lead-form.component').then(m => m.LeadFormComponent),
      },
      {
        path: 'leads/:id',
        loadComponent: () =>
          import('./features/leads/lead-detail/lead-detail.component').then(m => m.LeadDetailComponent),
      },
      {
        path: 'leads/:id/edit',
        loadComponent: () =>
          import('./features/leads/lead-form/lead-form.component').then(m => m.LeadFormComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/companies/companies-list/companies-list.component').then(m => m.CompaniesListComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
