export const environment = {
    production: true,
    googleBooksApiUrl: 'https://www.googleapis.com/books/v1',
    authApiUrl: '', // Disabled for GitHub Pages demo
    enablePerformanceLogging: false,
    version: '1.0.0',
    apiTimeout: 10000,
    features: {
        enableAuth: false, // Disabled for GitHub Pages demo
        enableSocialAuth: false, // Disabled for GitHub Pages demo
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