/**
 * Authentication-related models and interfaces
 */

export interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  roles: string[];
  preferences: UserPreferences;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  booksPerPage: number;
  defaultSortBy: string;
  emailNotifications: boolean;
  favoriteGenres: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface JWTPayload {
  sub: string; // Subject (user ID)
  email: string;
  username: string;
  roles: string[];
  iat: number; // Issued at
  exp: number; // Expiration
  iss: string; // Issuer
  aud: string; // Audience
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface PasswordChangeRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Auth error types for better error handling
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: any;
}

/**
 * Social authentication providers
 */
export interface SocialAuthProvider {
  provider: 'google' | 'facebook' | 'github' | 'twitter';
  clientId: string;
  redirectUri: string;
}

export interface SocialAuthRequest {
  provider: string;
  accessToken: string;
  idToken?: string;
}

export interface SocialAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
    isNewUser: boolean;
  };
  error?: string;
}
