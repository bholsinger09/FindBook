import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/book-search/pages/search-page/search-page').then(m => m.SearchPage),
    title: 'FindBook - Discover Your Next Great Read'
  },
  {
    path: 'book/:id',
    loadComponent: () => import('./features/book-details/book-details-page').then(m => m.BookDetailsPage),
    title: 'Book Details - FindBook'
  },
  {
    path: 'reading-center',
    loadComponent: () => import('./features/reading-center/reading-center.component').then(m => m.ReadingCenterComponent),
    title: 'Reading Center - FindBook'
  },
  {
    path: 'performance',
    loadComponent: () => import('./shared/components/performance-dashboard/performance-dashboard').then(m => m.PerformanceDashboardComponent),
    title: 'Performance Dashboard - FindBook'
  },
  {
    path: 'accessibility',
    loadComponent: () => import('./components/accessibility-dashboard/accessibility-dashboard.component').then(m => m.AccessibilityDashboardComponent),
    title: 'Accessibility Dashboard - FindBook'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
