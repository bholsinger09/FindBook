export const environment = {
  production: false,
  staging: true,
  apiUrl: 'https://staging-api.findbook.app',
  googleBooksApiUrl: 'https://www.googleapis.com/books/v1',
  enableExternalApiCalls: true,
  enableLogging: true,
  enablePerformanceTracking: true,
  enableServiceWorker: true,
  appVersion: '1.0.0-staging',
  firebase: {
    // Staging Firebase config would go here
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  analytics: {
    googleAnalyticsId: 'GA-STAGING-ID'
  },
  features: {
    enableAccessibilityTools: true,
    enablePerformanceDashboard: true,
    enableOfflineMode: true,
    enablePushNotifications: false
  }
};