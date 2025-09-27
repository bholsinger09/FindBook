export const environment = {
    production: false,
    googleBooksApiUrl: 'https://www.googleapis.com/books/v1',
    authApiUrl: 'http://localhost:8000/api',
    enablePerformanceLogging: true,
    version: '1.0.0',
    apiTimeout: 10000,
    features: {
        enableAuth: true,
        enableSocialAuth: true,
        enableOfflineSync: true,
        enableAnalytics: false
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