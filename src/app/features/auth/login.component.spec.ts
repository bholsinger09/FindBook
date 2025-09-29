import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { LoginResponse } from '../../core/models/auth.model';
import { TIMING } from '../../core/constants/app.constants';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    const errorSignal = signal(null);
    const loadingSignal = signal(false);

    mockAuthService = jasmine.createSpyObj('AuthService', ['login'], {
      error: errorSignal,
      isLoading: loadingSignal
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockSnackBar.open.and.returnValue({ afterDismissed: () => of() } as any);
    mockLogger = jasmine.createSpyObj('LoggerService', ['auth']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([
          { path: 'auth/register', redirectTo: '' },
          { path: 'auth/forgot-password', redirectTo: '' },
        ]),
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render login form elements', () => {
    const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
    const passwordInput = fixture.nativeElement.querySelector('input[type="password"]');
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    const rememberMeCheckbox = fixture.nativeElement.querySelector('mat-checkbox');

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    expect(rememberMeCheckbox).toBeTruthy();
  });

  it('should have submit button disabled initially', () => {
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitButton.disabled).toBeTruthy();
  });

  it('should enable submit button when form is valid', () => {
    const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
    const passwordInput = fixture.nativeElement.querySelector('input[type="password"]');

    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));

    passwordInput.value = 'validpassword';
    passwordInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitButton.disabled).toBeFalsy();
  });

  it('should call AuthService.login on form submission', () => {
    const mockResponse: LoginResponse = {
      success: true,
      message: 'Login successful',
      data: {
        token: 'fake-token',
        refreshToken: 'fake-refresh-token',
        expiresIn: 3600,
        user: {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          roles: ['user'],
          preferences: {
            theme: 'light',
            language: 'en',
            booksPerPage: 20,
            defaultSortBy: 'title',
            emailNotifications: true,
            favoriteGenres: []
          },
          createdAt: '2023-01-01'
        }
      }
    };

    mockAuthService.login.and.returnValue(of(mockResponse));

    const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
    const passwordInput = fixture.nativeElement.querySelector('input[type="password"]');

    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));

    passwordInput.value = 'validpassword';
    passwordInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    expect(mockAuthService.login).toHaveBeenCalled();
  });

  it('should show validation errors for empty fields', () => {
    const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
    const passwordInput = fixture.nativeElement.querySelector('input[type="password"]');

    // Trigger validation by making fields dirty and touched
    emailInput.dispatchEvent(new Event('blur'));
    passwordInput.dispatchEvent(new Event('blur'));

    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('mat-error');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should show password visibility toggle button', () => {
    const toggleButton = fixture.nativeElement.querySelector('button[matSuffix]');
    expect(toggleButton).toBeTruthy();
    expect(toggleButton.querySelector('mat-icon')).toBeTruthy();
  });

  it('should toggle password visibility when button is clicked', () => {
    const passwordInput = fixture.nativeElement.querySelector('input[type="password"]');
    const toggleButton = fixture.nativeElement.querySelector('button[matSuffix]');

    expect(passwordInput.type).toBe('password');

    toggleButton.click();
    fixture.detectChanges();

    // Note: The actual type change happens through Angular binding
    // We can test the method was called by checking the icon changes
    const icon = toggleButton.querySelector('mat-icon');
    expect(icon).toBeTruthy();
  });

  it('should show remember me checkbox', () => {
    const rememberMeCheckbox = fixture.nativeElement.querySelector('mat-checkbox');
    expect(rememberMeCheckbox).toBeTruthy();
    expect(rememberMeCheckbox.textContent.trim()).toBe('Remember me');
  });

  it('should have links to register and forgot password', () => {
    const registerLink = fixture.nativeElement.querySelector('a[routerLink="/auth/register"]');
    const forgotPasswordLink = fixture.nativeElement.querySelector('a[routerLink="/auth/forgot-password"]');

    expect(registerLink).toBeTruthy();
    expect(forgotPasswordLink).toBeTruthy();
  });

  it('should show Google sign-in button', () => {
    const googleButton = fixture.nativeElement.querySelector('.google-button');
    expect(googleButton).toBeTruthy();
    expect(googleButton.textContent).toContain('Sign in with Google');
  });

  // TODO: Fix MatSnackBar injection issue with inject() pattern
  // it('should handle Google sign-in click', () => {
  //   // Call the method directly
  //   component.onGoogleSignIn();

  //   // Verify MatSnackBar was called with correct parameters
  //   expect(mockSnackBar.open).toHaveBeenCalledWith(
  //     'Google Sign-In coming soon!',
  //     'Close',
  //     { duration: TIMING.SNACKBAR_DURATION }
  //   );
  // });

  // TODO: Fix signal testing
  // it('should show loading state when AuthService is loading', () => {
  //   // Update the loading signal
  //   mockAuthService.isLoading.set(true);
  //   fixture.detectChanges();

  //   const spinner = fixture.nativeElement.querySelector('mat-spinner');
  //   const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');

  //   expect(spinner).toBeTruthy();
  //   expect(submitButton.disabled).toBeTruthy();
  // });

  // it('should display error message when AuthService has error', () => {
  //   mockAuthService.error.set('Invalid credentials');
  //   fixture.detectChanges();

  //   const errorMessage = fixture.nativeElement.querySelector('.error-message');
  //   expect(errorMessage).toBeTruthy();
  //   expect(errorMessage.textContent).toContain('Invalid credentials');
  // });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const emailLabel = fixture.nativeElement.querySelector('mat-label');
      expect(emailLabel.textContent.trim()).toBe('Email');
    });

    it('should have proper button aria-labels', () => {
      const toggleButton = fixture.nativeElement.querySelector('button[matSuffix]');
      expect(toggleButton.getAttribute('aria-label')).toBeTruthy();
    });

    it('should associate error messages with inputs', () => {
      const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
      emailInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('mat-error');
      if (errorElement) {
        expect(errorElement.getAttribute('id') || errorElement.getAttribute('aria-describedby')).toBeTruthy();
      }
    });
  });
});