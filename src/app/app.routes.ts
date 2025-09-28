import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard, RoleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/book-search/pages/search-page/search-page').then((m) => m.SearchPage),
    title: 'FindBook - Discover Your Next Great Read',
  },
  {
    path: 'book/:id',
    loadComponent: () =>
      import('./features/book-details/book-details-page').then((m) => m.BookDetailsPage),
    title: 'Book Details - FindBook',
  },
  // Authentication routes
  {
    path: 'auth',
    canActivate: [GuestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component').then((m) => m.LoginComponent),
        title: 'Sign In - FindBook',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register.component').then((m) => m.RegisterComponent),
        title: 'Sign Up - FindBook',
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  // Protected routes
  {
    path: 'reading-center',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/reading-center/reading-center.component').then(
        (m) => m.ReadingCenterComponent,
      ),
    title: 'Reading Center - FindBook',
  },
  // Utility routes
  {
    path: 'performance',
    loadComponent: () =>
      import('./shared/components/performance-dashboard/performance-dashboard').then(
        (m) => m.PerformanceDashboardComponent,
      ),
    title: 'Performance Dashboard - FindBook',
  },
  {
    path: 'accessibility',
    loadComponent: () =>
      import('./components/accessibility-dashboard/accessibility-dashboard.component').then(
        (m) => m.AccessibilityDashboardComponent,
      ),
    title: 'Accessibility Dashboard - FindBook',
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
    title: 'Unauthorized - FindBook',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
