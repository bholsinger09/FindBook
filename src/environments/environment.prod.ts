export const environment = {
    production: true,
    googleBooksApiUrl: 'https://www.googleapis.com/books/v1',
    authApiUrl: 'https://findbook-2c2serbs3-ben-holsingers-projects.vercel.app/api',
    enablePerformanceLogging: false,
    version: '1.0.0',
    apiTimeout: 10000,
    features: {
        enableAuth: true, // Re-enabled for full-stack deployment
        enableSocialAuth: false, // Keep disabled for now
        enableOfflineSync: true,
        enableAnalytics: true
    },
    auth: {
        tokenStorageKey: 'findbook_token',
        refreshTokenStorageKey: 'findbook_refresh_token',
        userStorageKey: 'findbook_user',
        tokenRefreshBuffer: 300 // seconds before expiry to refresh
    },
    social: {
        google: {
            clientId: 'your-google-client-id.googleusercontent.com'
        },
        facebook: {
            appId: 'your-facebook-app-id'
        }
    }
};