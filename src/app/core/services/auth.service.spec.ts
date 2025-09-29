import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
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
  SocialAuthRequest,
  SocialAuthResponse,
  AuthError,
  AuthErrorType,
  UserPreferences,
} from '../models/auth.model';

// Note: Using mock environment for testing
const mockEnvironment = {
  authApiUrl: '/api'
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    avatar: 'avatar.jpg',
    roles: ['user'],
    preferences: {
      theme: 'light',
      language: 'en',
      booksPerPage: 20,
      defaultSortBy: 'title',
      emailNotifications: true,
      favoriteGenres: ['fiction', 'mystery'],
    } as UserPreferences,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-02T00:00:00Z',
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsInJvbGVzIjpbInVzZXIiXSwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjk5OTk5OTk5OTksImlzcyI6ImZpbmRib29rIiwiYXVkIjoiZmluZGJvb2stdXNlcnMifQ.placeholder';
  const mockRefreshToken = 'refresh_token_123';

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty auth state when no stored tokens', () => {
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.isLoading()).toBeFalse();
      expect(service.error()).toBeNull();
    });

    it('should initialize with stored valid token and user', () => {
      // Store valid token and user in localStorage
      localStorage.setItem('findbook_token', mockToken);
      localStorage.setItem('findbook_refresh_token', mockRefreshToken);
      localStorage.setItem('findbook_user', JSON.stringify(mockUser));

      // Create new service instance to trigger initialization
      const newService = TestBed.inject(AuthService);

      expect(newService.user()).toEqual(mockUser);
      expect(newService.isAuthenticated()).toBeTrue();
      expect(newService.isLoading()).toBeFalse();
    });

    it('should clear invalid stored tokens on initialization', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxfQ.invalid';
      localStorage.setItem('findbook_token', expiredToken);
      localStorage.setItem('findbook_user', JSON.stringify(mockUser));

      // Create new service instance to trigger initialization
      TestBed.inject(AuthService);

      expect(localStorage.getItem('findbook_token')).toBeNull();
      expect(localStorage.getItem('findbook_user')).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      const loginResponse: LoginResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken,
          expiresIn: 3600,
        },
      };

      service.login(loginRequest).subscribe((response) => {
        expect(response).toEqual(loginResponse);
        expect(service.user()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBeTrue();
        expect(service.isLoading()).toBeFalse();
        expect(localStorage.getItem('findbook_token')).toBe(mockToken);
        expect(localStorage.getItem('findbook_refresh_token')).toBe(mockRefreshToken);
        expect(localStorage.getItem('findbook_user')).toBe(JSON.stringify(mockUser));
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      req.flush(loginResponse);
    });

    it('should handle login failure with invalid credentials', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      service.login(loginRequest).subscribe({
        error: (error: AuthError) => {
          expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
          expect(error.message).toBe('Invalid email or password');
          expect(service.isAuthenticated()).toBeFalse();
          expect(service.isLoading()).toBeFalse();
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/login`);
      req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should set loading state during login', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(loginRequest).subscribe();

      expect(service.isLoading()).toBeTrue();

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/login`);
      req.flush({
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken,
          expiresIn: 3600,
        },
      });

      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('Register', () => {
    it('should register successfully with valid data', () => {
      const registerRequest: RegisterRequest = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'New',
        lastName: 'User',
        acceptTerms: true,
      };

      const registerResponse: RegisterResponse = {
        success: true,
        message: 'Registration successful',
        data: {
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken,
          expiresIn: 3600,
        },
      };

      service.register(registerRequest).subscribe((response) => {
        expect(response).toEqual(registerResponse);
        expect(service.user()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBeTrue();
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(registerResponse);
    });

    it('should handle registration failure with existing email', () => {
      const registerRequest: RegisterRequest = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true,
      };

      service.register(registerRequest).subscribe({
        error: (error: AuthError) => {
          expect(error.type).toBe(AuthErrorType.EMAIL_ALREADY_EXISTS);
          expect(error.message).toBe('Email already exists');
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/register`);
      req.flush({ error: 'Email already exists' }, { status: 409, statusText: 'Conflict' });
    });

    it('should handle validation error during registration', () => {
      const registerRequest: RegisterRequest = {
        email: 'invalid-email',
        username: '',
        password: '123',
        confirmPassword: '456',
        acceptTerms: false,
      };

      service.register(registerRequest).subscribe({
        error: (error: AuthError) => {
          expect(error.type).toBe(AuthErrorType.VALIDATION_ERROR);
          expect(error.message).toBe('Validation failed');
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/register`);
      req.flush({ error: 'Validation failed' }, { status: 422, statusText: 'Unprocessable Entity' });
    });
  });

  describe('Social Authentication', () => {
    it('should authenticate with social provider successfully', () => {
      const socialRequest: SocialAuthRequest = {
        provider: 'google',
        accessToken: 'google_access_token',
        idToken: 'google_id_token',
      };

      const socialResponse: SocialAuthResponse = {
        success: true,
        message: 'Social auth successful',
        data: {
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken,
          expiresIn: 3600,
          isNewUser: false,
        },
      };

      service.socialAuth(socialRequest).subscribe((response) => {
        expect(response).toEqual(socialResponse);
        expect(service.user()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBeTrue();
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/social`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(socialRequest);
      req.flush(socialResponse);
    });

    it('should handle social authentication failure', () => {
      const socialRequest: SocialAuthRequest = {
        provider: 'facebook',
        accessToken: 'invalid_token',
      };

      service.socialAuth(socialRequest).subscribe({
        error: (error: AuthError) => {
          expect(error.type).toBe(AuthErrorType.SERVER_ERROR);
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/social`);
      req.flush({ error: 'Social auth failed' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Set up authenticated state
      localStorage.setItem('findbook_token', mockToken);
      localStorage.setItem('findbook_refresh_token', mockRefreshToken);
      localStorage.setItem('findbook_user', JSON.stringify(mockUser));
    });

    it('should logout successfully and clear auth data', () => {
      service.logout().subscribe();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem('findbook_token')).toBeNull();
      expect(localStorage.getItem('findbook_refresh_token')).toBeNull();
      expect(localStorage.getItem('findbook_user')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: mockRefreshToken });
      req.flush({});
    });

    it('should logout successfully even if server request fails', () => {
      service.logout().subscribe();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/logout`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should logout when no refresh token available', () => {
      localStorage.removeItem('findbook_refresh_token');

      service.logout().subscribe();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      httpMock.expectNone(`${mockEnvironment.authApiUrl}/auth/logout`);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', () => {
      // Set up with existing refresh token
      localStorage.setItem('findbook_refresh_token', mockRefreshToken);

      const refreshResponse: RefreshTokenResponse = {
        success: true,
        data: {
          token: 'new_token',
          refreshToken: 'new_refresh_token',
          expiresIn: 3600,
        },
      };

      service.refreshToken().subscribe((response) => {
        expect(response).toEqual(refreshResponse);
        expect(localStorage.getItem('findbook_token')).toBe('new_token');
        expect(localStorage.getItem('findbook_refresh_token')).toBe('new_refresh_token');
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: mockRefreshToken });
      req.flush(refreshResponse);
    });

    it('should handle refresh token failure and redirect to login', () => {
      localStorage.setItem('findbook_refresh_token', mockRefreshToken);
      localStorage.setItem('findbook_user', JSON.stringify(mockUser));

      service.refreshToken().subscribe({
        error: (error) => {
          expect(service.user()).toBeNull();
          expect(service.isAuthenticated()).toBeFalse();
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/refresh`);
      req.flush({ error: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should throw error when no refresh token available', () => {
      service.refreshToken().subscribe({
        error: (error) => {
          expect(error.message).toBe('No refresh token available');
        },
      });

      httpMock.expectNone(`${mockEnvironment.authApiUrl}/auth/refresh`);
    });
  });

  describe('Password Reset', () => {
    it('should request password reset successfully', () => {
      const email = 'test@example.com';
      const response: PasswordResetResponse = {
        success: true,
        message: 'Password reset email sent',
      };

      service.requestPasswordReset(email).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/password-reset`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email });
      req.flush(response);
    });

    it('should handle password reset request failure', () => {
      const email = 'nonexistent@example.com';

      service.requestPasswordReset(email).subscribe({
        error: (error: AuthError) => {
          expect(error.type).toBe(AuthErrorType.USER_NOT_FOUND);
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/password-reset`);
      req.flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Password Change', () => {
    it('should change password successfully', () => {
      const changeRequest: PasswordChangeRequest = {
        token: 'reset_token_123',
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      const response: PasswordChangeResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      service.changePassword(changeRequest).subscribe((result) => {
        expect(result).toEqual(response);
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/password-change`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(changeRequest);
      req.flush(response);
    });

    it('should handle password change validation error', () => {
      const changeRequest: PasswordChangeRequest = {
        token: 'reset_token_123',
        password: 'newpassword123',
        confirmPassword: 'differentpassword',
      };

      service.changePassword(changeRequest).subscribe({
        error: (error: AuthError) => {
          expect(error.type).toBe(AuthErrorType.VALIDATION_ERROR);
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/password-change`);
      req.flush({ error: 'Passwords do not match' }, { status: 422, statusText: 'Unprocessable Entity' });
    });
  });

  describe('Token Management', () => {
    it('should return current token', () => {
      expect(service.getToken()).toBeNull();

      localStorage.setItem('findbook_token', mockToken);
      // Create new service instance to trigger initialization
      const newService = TestBed.inject(AuthService);

      expect(newService.getToken()).toBe(mockToken);
    });

    it('should validate token correctly', () => {
      // Valid token (not expired)
      localStorage.setItem('findbook_token', mockToken);
      localStorage.setItem('findbook_user', JSON.stringify(mockUser));

      // Create new service instance to trigger initialization
      const newService = TestBed.inject(AuthService);
      expect(newService.isAuthenticated()).toBeTrue();
    });

    it('should handle invalid token format', () => {
      localStorage.setItem('findbook_token', 'invalid.token.format');
      localStorage.setItem('findbook_user', JSON.stringify(mockUser));

      // Create new service instance to trigger initialization
      TestBed.inject(AuthService);

      // Should clear invalid token
      expect(localStorage.getItem('findbook_token')).toBeNull();
    });
  });

  describe('Role Management', () => {
    beforeEach(() => {
      localStorage.setItem('findbook_token', mockToken);
      localStorage.setItem('findbook_user', JSON.stringify({
        ...mockUser,
        roles: ['user', 'admin', 'moderator'],
      }));
    });

    it('should check if user has specific role', () => {
      const newService = TestBed.inject(AuthService);

      expect(newService.hasRole('user')).toBeTrue();
      expect(newService.hasRole('admin')).toBeTrue();
      expect(newService.hasRole('superuser')).toBeFalse();
    });

    it('should check if user has any of specified roles', () => {
      const newService = TestBed.inject(AuthService);

      expect(newService.hasAnyRole(['user', 'guest'])).toBeTrue();
      expect(newService.hasAnyRole(['admin', 'superuser'])).toBeTrue();
      expect(newService.hasAnyRole(['guest', 'visitor'])).toBeFalse();
    });

    it('should return false for role checks when user is not authenticated', () => {
      expect(service.hasRole('user')).toBeFalse();
      expect(service.hasAnyRole(['user', 'admin'])).toBeFalse();
    });
  });

  describe('Profile Update', () => {
    beforeEach(() => {
      localStorage.setItem('findbook_token', mockToken);
      localStorage.setItem('findbook_user', JSON.stringify(mockUser));
    });

    it('should update user profile successfully', () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        preferences: {
          ...mockUser.preferences,
          theme: 'dark' as const,
        },
      };

      const updatedUser = { ...mockUser, ...updates };

      service.updateProfile(updates).subscribe((user) => {
        expect(user).toEqual(updatedUser);
        expect(service.user()).toEqual(updatedUser);
        expect(JSON.parse(localStorage.getItem('findbook_user')!)).toEqual(updatedUser);
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/user/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ success: true, data: updatedUser });
    });

    it('should handle profile update failure', () => {
      const updates = { firstName: 'Updated' };

      service.updateProfile(updates).subscribe({
        error: (error: AuthError) => {
          expect(error.type).toBe(AuthErrorType.SERVER_ERROR);
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/user/profile`);
      req.flush({ error: 'Update failed' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(loginRequest).subscribe({
        error: (error: AuthError) => {
          expect(error.type).toBe(AuthErrorType.NETWORK_ERROR);
          expect(error.message).toBe('Network error occurred');
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/login`);
      req.flush(null, { status: 0, statusText: 'Network Error' });
    });

    it('should handle server errors', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(loginRequest).subscribe({
        error: (error: AuthError) => {
          expect(error.type).toBe(AuthErrorType.SERVER_ERROR);
          expect(error.message).toBe('Server error occurred');
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/login`);
      req.flush({ error: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('State Management', () => {
    it('should update auth state correctly', () => {
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.isLoading()).toBeFalse();
      expect(service.error()).toBeNull();

      // Trigger login to update state
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(loginRequest).subscribe();

      // Check loading state during request
      expect(service.isLoading()).toBeTrue();

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/login`);
      req.flush({
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken,
          expiresIn: 3600,
        },
      });

      // Check final state after successful login
      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.isLoading()).toBeFalse();
      expect(service.error()).toBeNull();
    });

    it('should set error state on authentication failure', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      service.login(loginRequest).subscribe({
        error: () => {
          expect(service.error()).toBe('Invalid email or password');
          expect(service.isLoading()).toBeFalse();
        },
      });

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/login`);
      req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('localStorage Management', () => {
    it('should store and retrieve auth data correctly', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(loginRequest).subscribe();

      const req = httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/login`);
      req.flush({
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken,
          expiresIn: 3600,
        },
      });

      expect(localStorage.getItem('findbook_token')).toBe(mockToken);
      expect(localStorage.getItem('findbook_refresh_token')).toBe(mockRefreshToken);
      expect(localStorage.getItem('findbook_user')).toBe(JSON.stringify(mockUser));
    });

    it('should clear localStorage on logout', () => {
      localStorage.setItem('findbook_token', mockToken);
      localStorage.setItem('findbook_refresh_token', mockRefreshToken);
      localStorage.setItem('findbook_user', JSON.stringify(mockUser));

      service.logout().subscribe();

      expect(localStorage.getItem('findbook_token')).toBeNull();
      expect(localStorage.getItem('findbook_refresh_token')).toBeNull();
      expect(localStorage.getItem('findbook_user')).toBeNull();

      httpMock.expectOne(`${mockEnvironment.authApiUrl}/auth/logout`);
    });
  });
});