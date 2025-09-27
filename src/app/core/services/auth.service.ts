import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, timer, EMPTY } from 'rxjs';
import { map, catchError, switchMap, tap, finalize } from 'rxjs/operators';
import {
    User,
    AuthState,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    PasswordResetRequest,
    PasswordResetResponse,
    PasswordChangeRequest,
    PasswordChangeResponse,
    JWTPayload,
    AuthError,
    AuthErrorType,
    SocialAuthRequest,
    SocialAuthResponse
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly API_BASE_URL = environment.authApiUrl || 'http://localhost:8080/api';
    private readonly TOKEN_KEY = 'findbook_token';
    private readonly REFRESH_TOKEN_KEY = 'findbook_refresh_token';
    private readonly USER_KEY = 'findbook_user';

    // Reactive state management with signals
    private readonly authState = signal<AuthState>({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
    });

    // Public computed signals
    public readonly user = computed(() => this.authState().user);
    public readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
    public readonly isLoading = computed(() => this.authState().isLoading);
    public readonly error = computed(() => this.authState().error);

    // Token refresh timer
    private refreshTimer: any;

    constructor() {
        this.initializeAuth();
    }

    /**
     * Initialize authentication state from stored tokens
     */
    private initializeAuth(): void {
        const token = this.getStoredToken();
        const refreshToken = this.getStoredRefreshToken();
        const user = this.getStoredUser();

        if (token && user && this.isTokenValid(token)) {
            this.updateAuthState({
                user,
                token,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            this.scheduleTokenRefresh(token);
        } else {
            // Clear invalid tokens
            this.clearAuthData();
        }
    }

    /**
     * Login with email and password
     */
    login(credentials: LoginRequest): Observable<LoginResponse> {
        this.setLoading(true);

        return this.http.post<LoginResponse>(`${this.API_BASE_URL}/auth/login`, credentials)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        this.handleAuthSuccess(response.data);
                    }
                }),
                catchError(error => this.handleAuthError(error)),
                finalize(() => this.setLoading(false))
            );
    }

    /**
     * Register new user account
     */
    register(userData: RegisterRequest): Observable<RegisterResponse> {
        this.setLoading(true);

        return this.http.post<RegisterResponse>(`${this.API_BASE_URL}/auth/register`, userData)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        this.handleAuthSuccess(response.data);
                    }
                }),
                catchError(error => this.handleAuthError(error)),
                finalize(() => this.setLoading(false))
            );
    }

    /**
     * Social authentication (Google, Facebook, etc.)
     */
    socialAuth(request: SocialAuthRequest): Observable<SocialAuthResponse> {
        this.setLoading(true);

        return this.http.post<SocialAuthResponse>(`${this.API_BASE_URL}/auth/social`, request)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        this.handleAuthSuccess(response.data);
                    }
                }),
                catchError(error => this.handleAuthError(error)),
                finalize(() => this.setLoading(false))
            );
    }

    /**
     * Logout user and clear authentication data
     */
    logout(): Observable<any> {
        const refreshToken = this.authState().refreshToken;

        // Clear local auth data immediately
        this.clearAuthData();

        // Notify server to invalidate tokens (optional)
        if (refreshToken) {
            return this.http.post(`${this.API_BASE_URL}/auth/logout`, { refreshToken })
                .pipe(
                    catchError(() => EMPTY), // Don't fail logout on server error
                    finalize(() => {
                        this.router.navigate(['/']);
                    })
                );
        }

        this.router.navigate(['/']);
        return EMPTY;
    }

    /**
     * Refresh access token using refresh token
     */
    refreshToken(): Observable<RefreshTokenResponse> {
        const refreshToken = this.authState().refreshToken;

        if (!refreshToken) {
            return throwError(() => new Error('No refresh token available'));
        }

        const request: RefreshTokenRequest = { refreshToken };

        return this.http.post<RefreshTokenResponse>(`${this.API_BASE_URL}/auth/refresh`, request)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        const currentState = this.authState();
                        this.updateAuthState({
                            ...currentState,
                            token: response.data.token,
                            refreshToken: response.data.refreshToken
                        });

                        this.storeToken(response.data.token);
                        this.storeRefreshToken(response.data.refreshToken);
                        this.scheduleTokenRefresh(response.data.token);
                    }
                }),
                catchError(error => {
                    this.clearAuthData();
                    this.router.navigate(['/auth/login']);
                    return throwError(() => error);
                })
            );
    }

    /**
     * Request password reset
     */
    requestPasswordReset(email: string): Observable<PasswordResetResponse> {
        const request: PasswordResetRequest = { email };

        return this.http.post<PasswordResetResponse>(`${this.API_BASE_URL}/auth/password-reset`, request)
            .pipe(
                catchError(error => this.handleAuthError(error))
            );
    }

    /**
     * Change password with reset token
     */
    changePassword(request: PasswordChangeRequest): Observable<PasswordChangeResponse> {
        return this.http.post<PasswordChangeResponse>(`${this.API_BASE_URL}/auth/password-change`, request)
            .pipe(
                catchError(error => this.handleAuthError(error))
            );
    }

    /**
     * Get current access token
     */
    getToken(): string | null {
        return this.authState().token;
    }

    /**
     * Check if user has specific role
     */
    hasRole(role: string): boolean {
        const user = this.user();
        return user?.roles.includes(role) ?? false;
    }

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(roles: string[]): boolean {
        const user = this.user();
        return roles.some(role => user?.roles.includes(role)) ?? false;
    }

    /**
     * Update user profile
     */
    updateProfile(updates: Partial<User>): Observable<User> {
        return this.http.put<{ success: boolean; data: User }>(`${this.API_BASE_URL}/user/profile`, updates)
            .pipe(
                map(response => response.data),
                tap(user => {
                    const currentState = this.authState();
                    this.updateAuthState({
                        ...currentState,
                        user: { ...currentState.user!, ...user }
                    });
                    this.storeUser(user);
                }),
                catchError(error => this.handleAuthError(error))
            );
    }

    /**
     * Handle successful authentication
     */
    private handleAuthSuccess(data: {
        user: User;
        token: string;
        refreshToken: string;
        expiresIn: number;
    }): void {
        this.updateAuthState({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
        });

        // Store auth data
        this.storeToken(data.token);
        this.storeRefreshToken(data.refreshToken);
        this.storeUser(data.user);

        // Schedule token refresh
        this.scheduleTokenRefresh(data.token);
    }

    /**
     * Handle authentication errors
     */
    private handleAuthError(error: HttpErrorResponse): Observable<never> {
        let authError: AuthError;

        if (error.status === 401) {
            authError = {
                type: AuthErrorType.INVALID_CREDENTIALS,
                message: 'Invalid email or password',
                details: error.error
            };
        } else if (error.status === 404) {
            authError = {
                type: AuthErrorType.USER_NOT_FOUND,
                message: 'User not found',
                details: error.error
            };
        } else if (error.status === 409) {
            authError = {
                type: AuthErrorType.EMAIL_ALREADY_EXISTS,
                message: 'Email already exists',
                details: error.error
            };
        } else if (error.status === 422) {
            authError = {
                type: AuthErrorType.VALIDATION_ERROR,
                message: 'Validation failed',
                details: error.error
            };
        } else if (error.status === 0) {
            authError = {
                type: AuthErrorType.NETWORK_ERROR,
                message: 'Network error occurred',
                details: error.error
            };
        } else {
            authError = {
                type: AuthErrorType.SERVER_ERROR,
                message: 'Server error occurred',
                details: error.error
            };
        }

        this.setError(authError.message);
        return throwError(() => authError);
    }

    /**
     * Clear all authentication data
     */
    private clearAuthData(): void {
        this.updateAuthState({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
        });

        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);

        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Schedule automatic token refresh
     */
    private scheduleTokenRefresh(token: string): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const payload = this.decodeJWT(token);
        if (payload) {
            // Refresh 5 minutes before expiration
            const refreshTime = (payload.exp * 1000) - Date.now() - (5 * 60 * 1000);

            if (refreshTime > 0) {
                this.refreshTimer = setTimeout(() => {
                    this.refreshToken().subscribe({
                        error: () => {
                            // Refresh failed, redirect to login
                            this.clearAuthData();
                            this.router.navigate(['/auth/login']);
                        }
                    });
                }, refreshTime);
            }
        }
    }

    /**
     * Check if token is valid (not expired)
     */
    private isTokenValid(token: string): boolean {
        try {
            const payload = this.decodeJWT(token);
            if (!payload) return false;

            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp > currentTime;
        } catch {
            return false;
        }
    }

    /**
     * Decode JWT token
     */
    private decodeJWT(token: string): JWTPayload | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch {
            return null;
        }
    }

    // Storage methods
    private storeToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    private getStoredToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private storeRefreshToken(refreshToken: string): void {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    private getStoredRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    private storeUser(user: User): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    private getStoredUser(): User | null {
        const userData = localStorage.getItem(this.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    // State management helpers
    private updateAuthState(newState: Partial<AuthState>): void {
        this.authState.set({
            ...this.authState(),
            ...newState
        });
    }

    private setLoading(loading: boolean): void {
        this.updateAuthState({ isLoading: loading });
    }

    private setError(error: string | null): void {
        this.updateAuthState({ error });
    }
}