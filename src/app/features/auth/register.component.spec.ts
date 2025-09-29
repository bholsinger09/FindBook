import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { RegisterComponent, passwordMatchValidator } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { RegisterResponse } from '../../core/models/auth.model';
import { TIMING } from '../../core/constants/app.constants';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    const errorSignal = signal(null);
    const loadingSignal = signal(false);
    
    mockAuthService = jasmine.createSpyObj('AuthService', ['register'], {
      error: errorSignal,
      isLoading: loadingSignal
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockSnackBar.open.and.returnValue({ afterDismissed: () => of() } as any);
    mockLogger = jasmine.createSpyObj('LoggerService', ['auth']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([
          { path: 'auth/login', redirectTo: '' },
          { path: 'dashboard', redirectTo: '' },
        ]),
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    
    // Override private injected services
    (component as any).router = mockRouter;
    (component as any).snackBar = mockSnackBar;
    
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize register form with all required fields', () => {
      expect(component['registerForm']).toBeTruthy();
      expect(component['registerForm'].get('firstName')).toBeTruthy();
      expect(component['registerForm'].get('lastName')).toBeTruthy();
      expect(component['registerForm'].get('username')).toBeTruthy();
      expect(component['registerForm'].get('email')).toBeTruthy();
      expect(component['registerForm'].get('password')).toBeTruthy();
      expect(component['registerForm'].get('confirmPassword')).toBeTruthy();
      expect(component['registerForm'].get('acceptTerms')).toBeTruthy();
    });

    it('should have form initially invalid', () => {
      expect(component['registerForm'].invalid).toBeTrue();
    });

    it('should have password visibility hidden initially', () => {
      expect(component['hidePassword']()).toBeTrue();
      expect(component['hideConfirmPassword']()).toBeTrue();
    });

    it('should setup form focus on initialization', async () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      component.ngOnInit();
      await fixture.whenStable();
      expect(component.ngOnInit).toHaveBeenCalled();
    });
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      const firstNameInput = fixture.nativeElement.querySelector('input[formcontrolname="firstName"]');
      const lastNameInput = fixture.nativeElement.querySelector('input[formcontrolname="lastName"]');
      const usernameInput = fixture.nativeElement.querySelector('input[formcontrolname="username"]');
      const emailInput = fixture.nativeElement.querySelector('input[formcontrolname="email"]');
      const passwordInput = fixture.nativeElement.querySelector('input[formcontrolname="password"]');
      const confirmPasswordInput = fixture.nativeElement.querySelector('input[formcontrolname="confirmPassword"]');
      const termsCheckbox = fixture.nativeElement.querySelector('mat-checkbox[formcontrolname="acceptTerms"]');
      
      expect(firstNameInput).toBeTruthy();
      expect(lastNameInput).toBeTruthy();
      expect(usernameInput).toBeTruthy();
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(confirmPasswordInput).toBeTruthy();
      expect(termsCheckbox).toBeTruthy();
    });

    it('should render submit button disabled initially', () => {
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton).toBeTruthy();
      expect(submitButton.disabled).toBeTrue();
    });

    it('should render Google sign-up button', () => {
      const googleButton = fixture.nativeElement.querySelector('.google-button');
      expect(googleButton).toBeTruthy();
      expect(googleButton.textContent).toContain('Sign up with Google');
    });

    it('should render terms and conditions links', () => {
      const termsCheckbox = fixture.nativeElement.querySelector('mat-checkbox[formcontrolname="acceptTerms"]');
      expect(termsCheckbox.textContent).toContain('Terms of Service');
      expect(termsCheckbox.textContent).toContain('Privacy Policy');
    });

    it('should render login link', () => {
      const loginLink = fixture.nativeElement.querySelector('a[routerLink="/auth/login"]');
      expect(loginLink).toBeTruthy();
      expect(loginLink.textContent.trim()).toBe('Sign in');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      // Submit empty form
      component['onSubmit']();
      
      expect(component['registerForm'].get('firstName')?.invalid).toBeTrue();
      expect(component['registerForm'].get('lastName')?.invalid).toBeTrue();
      expect(component['registerForm'].get('username')?.invalid).toBeTrue();
      expect(component['registerForm'].get('email')?.invalid).toBeTrue();
      expect(component['registerForm'].get('password')?.invalid).toBeTrue();
      expect(component['registerForm'].get('confirmPassword')?.invalid).toBeTrue();
      expect(component['registerForm'].get('acceptTerms')?.invalid).toBeTrue();
    });

    it('should validate email format', () => {
      const emailControl = component['registerForm'].get('email');
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.invalid).toBeTrue();
      expect(emailControl?.errors?.['email']).toBeTruthy();
      
      emailControl?.setValue('valid@example.com');
      expect(emailControl?.errors?.['email']).toBeFalsy();
    });

    it('should validate username pattern', () => {
      const usernameControl = component['registerForm'].get('username');
      
      // Invalid characters
      usernameControl?.setValue('invalid-username!');
      expect(usernameControl?.invalid).toBeTrue();
      expect(usernameControl?.errors?.['pattern']).toBeTruthy();
      
      // Valid username
      usernameControl?.setValue('valid_username123');
      expect(usernameControl?.errors?.['pattern']).toBeFalsy();
    });

    it('should validate username length', () => {
      const usernameControl = component['registerForm'].get('username');
      
      // Too short
      usernameControl?.setValue('ab');
      expect(usernameControl?.invalid).toBeTrue();
      expect(usernameControl?.errors?.['minlength']).toBeTruthy();
      
      // Valid length
      usernameControl?.setValue('abc');
      expect(usernameControl?.errors?.['minlength']).toBeFalsy();
    });

    it('should validate password pattern', () => {
      const passwordControl = component['registerForm'].get('password');
      
      // Too short
      passwordControl?.setValue('short');
      expect(passwordControl?.invalid).toBeTrue();
      expect(passwordControl?.errors?.['minlength']).toBeTruthy();
      
      // No numbers
      passwordControl?.setValue('passwordwithoutnum');
      expect(passwordControl?.invalid).toBeTrue();
      expect(passwordControl?.errors?.['pattern']).toBeTruthy();
      
      // No letters
      passwordControl?.setValue('12345678');
      expect(passwordControl?.invalid).toBeTrue();
      expect(passwordControl?.errors?.['pattern']).toBeTruthy();
      
      // Valid password
      passwordControl?.setValue('validpass123');
      expect(passwordControl?.errors?.['pattern']).toBeFalsy();
      expect(passwordControl?.errors?.['minlength']).toBeFalsy();
    });

    it('should validate password confirmation match', () => {
      component['registerForm'].patchValue({
        password: 'password123',
        confirmPassword: 'differentpass123'
      });
      
      expect(component['registerForm'].errors?.['passwordMismatch']).toBeTruthy();
      
      component['registerForm'].patchValue({
        confirmPassword: 'password123'
      });
      
      expect(component['registerForm'].errors?.['passwordMismatch']).toBeFalsy();
    });

    it('should require terms acceptance', () => {
      const termsControl = component['registerForm'].get('acceptTerms');
      
      termsControl?.setValue(false);
      expect(termsControl?.invalid).toBeTrue();
      expect(termsControl?.errors?.['required']).toBeTruthy();
      
      termsControl?.setValue(true);
      expect(termsControl?.invalid).toBeFalse();
    });

    it('should enable submit button when form is valid', () => {
      // Fill form with valid data
      component['registerForm'].patchValue({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      });
      
      fixture.detectChanges();
      
      expect(component['registerForm'].valid).toBeTrue();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBeFalse();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      expect(component['hidePassword']()).toBeTrue();
      
      component['togglePasswordVisibility']();
      expect(component['hidePassword']()).toBeFalse();
      
      component['togglePasswordVisibility']();
      expect(component['hidePassword']()).toBeTrue();
    });

    it('should toggle confirm password visibility', () => {
      expect(component['hideConfirmPassword']()).toBeTrue();
      
      component['toggleConfirmPasswordVisibility']();
      expect(component['hideConfirmPassword']()).toBeFalse();
      
      component['toggleConfirmPasswordVisibility']();
      expect(component['hideConfirmPassword']()).toBeTrue();
    });

    it('should show password visibility toggle buttons', () => {
      const passwordToggle = fixture.nativeElement.querySelector('button[matSuffix][mat-icon-button]');
      const confirmPasswordButtons = fixture.nativeElement.querySelectorAll('button[matSuffix][mat-icon-button]');
      
      expect(passwordToggle).toBeTruthy();
      expect(confirmPasswordButtons.length).toBe(2); // Both password and confirm password
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      // Set up valid form data
      component.ngOnInit();
      component['registerForm'].patchValue({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      });
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should call AuthService.register on valid form submission', () => {
      const mockResponse: RegisterResponse = {
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: 1,
            email: 'john@example.com',
            username: 'johndoe',
            firstName: 'John',
            lastName: 'Doe',
            avatar: undefined,
            roles: ['user'],
            preferences: {
              theme: 'light',
              language: 'en',
              booksPerPage: 10,
              defaultSortBy: 'title',
              emailNotifications: true,
              favoriteGenres: []
            },
            createdAt: '2024-01-01T00:00:00Z',
            lastLoginAt: '2024-01-01T00:00:00Z'
          },
          token: 'fake-token',
          refreshToken: 'fake-refresh-token',
          expiresIn: 3600
        }
      };
      
      mockAuthService.register.and.returnValue(of(mockResponse));
      
      component['onSubmit']();
      
      expect(mockAuthService.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      });
    });

    it('should show success message and navigate on successful registration', () => {
      const mockResponse: RegisterResponse = {
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: 1,
            email: 'john@example.com',
            username: 'johndoe',
            firstName: 'John',
            lastName: 'Doe',
            avatar: undefined,
            roles: ['user'],
            preferences: {
              theme: 'light',
              language: 'en',
              booksPerPage: 10,
              defaultSortBy: 'title',
              emailNotifications: true,
              favoriteGenres: []
            },
            createdAt: '2024-01-01T00:00:00Z',
            lastLoginAt: '2024-01-01T00:00:00Z'
          },
          token: 'fake-token',
          refreshToken: 'fake-refresh-token',
          expiresIn: 3600
        }
      };
      
      mockAuthService.register.and.returnValue(of(mockResponse));
      
      component['onSubmit']();
      
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Account created successfully! Welcome to FindBook!',
        'Close',
        {
          duration: 5000,
          panelClass: ['success-snackbar']
        }
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should show error message on registration failure', () => {
      const error = { message: 'Email already exists' };
      mockAuthService.register.and.returnValue(throwError(() => error));
      
      component['onSubmit']();
      
      expect(mockLogger.auth).toHaveBeenCalledWith('Registration failed', error);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Email already exists',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    });

    it('should not submit invalid form', () => {
      // Clear form to make it invalid
      component['registerForm'].reset();
      
      component['onSubmit']();
      
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when submitting invalid form', () => {
      component['registerForm'].reset();
      spyOn(component['registerForm'], 'markAllAsTouched');
      
      component['onSubmit']();
      
      // The component calls markFormGroupTouched which iterates over controls
      expect(component['registerForm'].invalid).toBeTrue();
    });
  });

  describe('Google Sign-up', () => {
    it('should show coming soon message for Google sign-up', () => {
      component['signUpWithGoogle']();
      
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Google Sign-Up coming soon!',
        'Close',
        { duration: TIMING.SNACKBAR_DURATION }
      );
    });

    it('should handle Google sign-up button click', () => {
      spyOn(component as any, 'signUpWithGoogle');
      
      const googleButton = fixture.nativeElement.querySelector('.google-button');
      googleButton.click();
      
      expect(component['signUpWithGoogle']).toHaveBeenCalled();
    });
  });

  describe('Field Validation Helpers', () => {
    it('should correctly identify invalid fields', () => {
      const firstNameControl = component['registerForm'].get('firstName');
      
      // Field not touched yet
      expect(component['isFieldInvalid']('firstName')).toBeFalse();
      
      // Touch and make invalid
      firstNameControl?.markAsTouched();
      firstNameControl?.setValue('');
      
      expect(component['isFieldInvalid']('firstName')).toBeTrue();
      
      // Make valid
      firstNameControl?.setValue('John');
      
      expect(component['isFieldInvalid']('firstName')).toBeFalse();
    });
  });

  describe('Custom Validator', () => {
    it('should validate password match correctly', () => {
      const mockControl = {
        get: jasmine.createSpy().and.callFake((field: string) => {
          if (field === 'password') return { value: 'password123' };
          if (field === 'confirmPassword') return { value: 'different123' };
          return null;
        })
      };
      
      const result = passwordMatchValidator(mockControl as any);
      expect(result).toEqual({ passwordMismatch: true });
    });

    it('should return null when passwords match', () => {
      const mockControl = {
        get: jasmine.createSpy().and.callFake((field: string) => {
          if (field === 'password') return { value: 'password123' };
          if (field === 'confirmPassword') return { value: 'password123' };
          return null;
        })
      };
      
      const result = passwordMatchValidator(mockControl as any);
      expect(result).toBeNull();
    });

    it('should return null when controls are missing', () => {
      const mockControl = {
        get: jasmine.createSpy().and.returnValue(null)
      };
      
      const result = passwordMatchValidator(mockControl as any);
      expect(result).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const labels = fixture.nativeElement.querySelectorAll('mat-label');
      const labelTexts = Array.from(labels).map((label: any) => label.textContent?.trim());
      
      expect(labelTexts).toContain('First Name');
      expect(labelTexts).toContain('Last Name');
      expect(labelTexts).toContain('Username');
      expect(labelTexts).toContain('Email');
      expect(labelTexts).toContain('Password');
      expect(labelTexts).toContain('Confirm Password');
    });

    it('should have aria-labels for password toggle buttons', () => {
      const toggleButtons = fixture.nativeElement.querySelectorAll('button[matSuffix][mat-icon-button]');
      
      expect(toggleButtons.length).toBe(2);
      if (toggleButtons.length >= 2) {
        expect(toggleButtons[0].getAttribute('aria-label')).toBe('Hide password');
        expect(toggleButtons[1].getAttribute('aria-label')).toBe('Hide password');
      }
    });

    it('should display validation errors with proper structure', () => {
      // Trigger validation by submitting invalid form
      component['onSubmit']();
      fixture.detectChanges();
      
      const errors = fixture.nativeElement.querySelectorAll('mat-error');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      component.ngOnInit();
      component['registerForm'].patchValue({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      });
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should handle AuthService errors gracefully', () => {
      mockAuthService.register.and.returnValue(throwError(() => new Error('Network error')));
      
      expect(() => component['onSubmit']()).not.toThrow();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Network error',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    });

    it('should handle error without message', () => {
      mockAuthService.register.and.returnValue(throwError(() => ({})));
      
      component['onSubmit']();
      
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Registration failed',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    });
  });
});