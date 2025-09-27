import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/auth.model';

// Custom validator for password confirmation
export function passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
        return null;
    }

    return password.value !== confirmPassword.value ? { passwordMismatch: true } : null;
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>book</mat-icon>
            Join FindBook
          </mat-card-title>
          <mat-card-subtitle>
            Create your account to start discovering great books
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
            <!-- First Name & Last Name -->
            <div class="name-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>First Name</mat-label>
                <input 
                  matInput 
                  type="text" 
                  formControlName="firstName" 
                  placeholder="John"
                  [class.error]="isFieldInvalid('firstName')"
                >
                <mat-error *ngIf="isFieldInvalid('firstName')">
                  First name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Last Name</mat-label>
                <input 
                  matInput 
                  type="text" 
                  formControlName="lastName" 
                  placeholder="Doe"
                  [class.error]="isFieldInvalid('lastName')"
                >
                <mat-error *ngIf="isFieldInvalid('lastName')">
                  Last name is required
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Username -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input 
                matInput 
                type="text" 
                formControlName="username" 
                placeholder="johndoe"
                [class.error]="isFieldInvalid('username')"
              >
              <mat-icon matSuffix>account_circle</mat-icon>
              <mat-error *ngIf="isFieldInvalid('username')">
                <span *ngIf="registerForm.get('username')?.errors?.['required']">Username is required</span>
                <span *ngIf="registerForm.get('username')?.errors?.['minlength']">Username must be at least 3 characters</span>
                <span *ngIf="registerForm.get('username')?.errors?.['pattern']">Username can only contain letters, numbers, and underscores</span>
              </mat-error>
            </mat-form-field>

            <!-- Email -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input 
                matInput 
                type="email" 
                formControlName="email" 
                placeholder="john@example.com"
                [class.error]="isFieldInvalid('email')"
              >
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="isFieldInvalid('email')">
                <span *ngIf="registerForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="registerForm.get('email')?.errors?.['email']">Please enter a valid email</span>
              </mat-error>
            </mat-form-field>

            <!-- Password -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input 
                matInput 
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password" 
                placeholder="Enter your password"
                [class.error]="isFieldInvalid('password')"
              >
              <button 
                type="button" 
                matSuffix 
                mat-icon-button 
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="'Hide password'"
              >
                <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="isFieldInvalid('password')">
                <span *ngIf="registerForm.get('password')?.errors?.['required']">Password is required</span>
                <span *ngIf="registerForm.get('password')?.errors?.['minlength']">Password must be at least 8 characters</span>
                <span *ngIf="registerForm.get('password')?.errors?.['pattern']">Password must contain at least one uppercase, lowercase, number, and special character</span>
              </mat-error>
            </mat-form-field>

            <!-- Confirm Password -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input 
                matInput 
                [type]="hideConfirmPassword() ? 'password' : 'text'"
                formControlName="confirmPassword" 
                placeholder="Confirm your password"
                [class.error]="isFieldInvalid('confirmPassword') || registerForm.errors?.['passwordMismatch']"
              >
              <button 
                type="button" 
                matSuffix 
                mat-icon-button 
                (click)="toggleConfirmPasswordVisibility()"
                [attr.aria-label]="'Hide password'"
              >
                <mat-icon>{{hideConfirmPassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="isFieldInvalid('confirmPassword')">
                Confirm password is required
              </mat-error>
              <mat-error *ngIf="registerForm.errors?.['passwordMismatch'] && !isFieldInvalid('confirmPassword')">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <!-- Terms & Conditions -->
            <mat-checkbox formControlName="acceptTerms" class="terms-checkbox" required>
              I agree to the 
              <a href="/terms" target="_blank">Terms of Service</a> 
              and 
              <a href="/privacy" target="_blank">Privacy Policy</a>
            </mat-checkbox>
            <mat-error *ngIf="isFieldInvalid('acceptTerms')" class="checkbox-error">
              You must accept the terms and conditions
            </mat-error>

            <!-- Error Display -->
            <div *ngIf="authService.error()" class="error-message">
              <mat-icon>error</mat-icon>
              {{ authService.error() }}
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              mat-raised-button 
              color="primary" 
              class="submit-button full-width"
              [disabled]="registerForm.invalid || authService.isLoading()"
            >
              <mat-spinner *ngIf="authService.isLoading()" diameter="20"></mat-spinner>
              <span *ngIf="!authService.isLoading()">Create Account</span>
            </button>

            <!-- Social Registration -->
            <div class="social-login">
              <div class="divider">
                <span>Or sign up with</span>
              </div>
              
              <button 
                type="button" 
                mat-stroked-button 
                class="social-button google-button full-width"
                (click)="signUpWithGoogle()"
                [disabled]="authService.isLoading()"
              >
                <mat-icon svgIcon="google"></mat-icon>
                Sign up with Google
              </button>
            </div>

            <!-- Links -->
            <div class="auth-links">
              <div class="login-link">
                Already have an account? 
                <a routerLink="/auth/login">Sign in</a>
              </div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .register-card {
      max-width: 500px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border-radius: 16px;
    }

    .register-card mat-card-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .register-card mat-card-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 24px;
      font-weight: 600;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .name-row {
      display: flex;
      gap: 12px;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      flex: 1;
    }

    .terms-checkbox {
      margin: 16px 0 8px 0;
    }

    .terms-checkbox a {
      color: #1976d2;
      text-decoration: none;
    }

    .terms-checkbox a:hover {
      text-decoration: underline;
    }

    .checkbox-error {
      color: #f44336;
      font-size: 12px;
      margin-top: -8px;
      margin-bottom: 16px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background: rgba(244, 67, 54, 0.1);
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
    }

    .submit-button {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      margin: 16px 0 8px 0;
    }

    .social-login {
      margin: 20px 0;
    }

    .divider {
      position: relative;
      text-align: center;
      margin: 20px 0;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e0e0e0;
    }

    .divider span {
      background: white;
      padding: 0 16px;
      color: #666;
      font-size: 14px;
    }

    .social-button {
      height: 48px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .google-button {
      border-color: #4285f4;
      color: #4285f4;
    }

    .google-button:hover {
      background-color: rgba(66, 133, 244, 0.04);
    }

    .auth-links {
      text-align: center;
      margin-top: 20px;
    }

    .login-link {
      font-size: 14px;
      color: #666;
    }

    .login-link a {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .login-link a:hover {
      text-decoration: underline;
    }

    .error {
      border-color: #f44336 !important;
    }

    @media (max-width: 600px) {
      .register-container {
        padding: 16px;
      }

      .register-card {
        margin: 0;
      }

      .name-row {
        flex-direction: column;
        gap: 16px;
      }

      .half-width {
        width: 100%;
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
    protected readonly authService = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);

    protected readonly hidePassword = signal(true);
    protected readonly hideConfirmPassword = signal(true);

    protected registerForm: FormGroup;

    constructor() {
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        const usernamePattern = /^[a-zA-Z0-9_]+$/;

        this.registerForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            username: ['', [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(20),
                Validators.pattern(usernamePattern)
            ]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(passwordPattern)
            ]],
            confirmPassword: ['', [Validators.required]],
            acceptTerms: [false, [Validators.requiredTrue]]
        }, { validators: passwordMatchValidator });
    }

    ngOnInit(): void {
        // Auto-focus first name field
        setTimeout(() => {
            const firstNameInput = document.querySelector('input[formControlName="firstName"]') as HTMLInputElement;
            firstNameInput?.focus();
        }, 100);
    }

    protected onSubmit(): void {
        if (this.registerForm.invalid) {
            this.markFormGroupTouched();
            return;
        }

        const userData: RegisterRequest = {
            email: this.registerForm.value.email,
            username: this.registerForm.value.username,
            password: this.registerForm.value.password,
            confirmPassword: this.registerForm.value.confirmPassword,
            firstName: this.registerForm.value.firstName,
            lastName: this.registerForm.value.lastName,
            acceptTerms: this.registerForm.value.acceptTerms
        };

        this.authService.register(userData).subscribe({
            next: (response) => {
                if (response.success) {
                    this.snackBar.open('Account created successfully! Welcome to FindBook!', 'Close', {
                        duration: 5000,
                        panelClass: ['success-snackbar']
                    });

                    // Redirect to dashboard or onboarding
                    this.router.navigate(['/dashboard']);
                }
            },
            error: (error) => {
                console.error('Registration error:', error);
                this.snackBar.open(error.message || 'Registration failed', 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                });
            }
        });
    }

    protected togglePasswordVisibility(): void {
        this.hidePassword.set(!this.hidePassword());
    }

    protected toggleConfirmPasswordVisibility(): void {
        this.hideConfirmPassword.set(!this.hideConfirmPassword());
    }

    protected signUpWithGoogle(): void {
        // TODO: Implement Google OAuth
        this.snackBar.open('Google Sign-Up coming soon!', 'Close', { duration: 3000 });
    }

    protected isFieldInvalid(fieldName: string): boolean {
        const field = this.registerForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    private markFormGroupTouched(): void {
        Object.keys(this.registerForm.controls).forEach(key => {
            const control = this.registerForm.get(key);
            control?.markAsTouched();
        });
    }
}