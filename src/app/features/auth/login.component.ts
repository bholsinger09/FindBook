import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { LoggerService } from '../../core/services/logger.service';
import { LoginRequest } from '../../core/models/auth.model';
import { TIMING } from '../../core/constants/app.constants';

@Component({
  selector: 'app-login',
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
    MatSnackBarModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>book</mat-icon>
            Sign in to FindBook
          </mat-card-title>
          <mat-card-subtitle> Discover your next great read </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <!-- Email Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="Enter your email"
                [class.error]="isFieldInvalid('email')"
              />
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="isFieldInvalid('email')">
                <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="loginForm.get('email')?.errors?.['email']"
                  >Please enter a valid email</span
                >
              </mat-error>
            </mat-form-field>

            <!-- Password Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                placeholder="Enter your password"
                [class.error]="isFieldInvalid('password')"
              />
              <button
                type="button"
                matSuffix
                mat-icon-button
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="'Hide password'"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="isFieldInvalid('password')">
                <span *ngIf="loginForm.get('password')?.errors?.['required']"
                  >Password is required</span
                >
                <span *ngIf="loginForm.get('password')?.errors?.['minlength']"
                  >Password must be at least 6 characters</span
                >
              </mat-error>
            </mat-form-field>

            <!-- Remember Me -->
            <mat-checkbox formControlName="rememberMe" class="remember-me">
              Remember me
            </mat-checkbox>

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
              [disabled]="loginForm.invalid || authService.isLoading()"
            >
              <mat-spinner *ngIf="authService.isLoading()" diameter="20"></mat-spinner>
              <span *ngIf="!authService.isLoading()">Sign In</span>
            </button>

            <!-- Social Login -->
            <div class="social-login">
              <div class="divider">
                <span>Or continue with</span>
              </div>

              <button
                type="button"
                mat-stroked-button
                class="social-button google-button full-width"
                (click)="onGoogleSignIn()"
                [disabled]="authService.isLoading()"
              >
                <mat-icon>account_circle</mat-icon>
                Sign in with Google
              </button>
            </div>

            <!-- Links -->
            <div class="auth-links">
              <a routerLink="/auth/forgot-password" class="forgot-password-link">
                Forgot your password?
              </a>

              <div class="register-link">
                Don't have an account?
                <a routerLink="/auth/register">Sign up</a>
              </div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .login-card {
        max-width: 400px;
        width: 100%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border-radius: 16px;
      }

      .login-card mat-card-header {
        text-align: center;
        margin-bottom: 20px;
      }

      .login-card mat-card-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 24px;
        font-weight: 600;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .full-width {
        width: 100%;
      }

      .remember-me {
        margin: 8px 0;
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

      .forgot-password-link {
        color: #1976d2;
        text-decoration: none;
        font-size: 14px;
      }

      .forgot-password-link:hover {
        text-decoration: underline;
      }

      .register-link {
        margin-top: 16px;
        font-size: 14px;
        color: #666;
      }

      .register-link a {
        color: #1976d2;
        text-decoration: none;
        font-weight: 500;
      }

      .register-link a:hover {
        text-decoration: underline;
      }

      .error {
        border-color: #f44336 !important;
      }

      @media (max-width: 480px) {
        .login-container {
          padding: 16px;
        }

        .login-card {
          margin: 0;
        }
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly logger = inject(LoggerService);

  protected readonly hidePassword = signal(true);

  protected loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    // Auto-focus email field
    setTimeout(() => {
      const emailInput = document.querySelector(
        'input[formControlName="email"]',
      ) as HTMLInputElement;
      emailInput?.focus();
    }, 100);
  }

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Login successful!', 'Close', { duration: TIMING.SNACKBAR_DURATION });

          // Redirect to stored URL or dashboard
          const redirectUrl = sessionStorage.getItem('findbook_redirect_url') || '/dashboard';
          sessionStorage.removeItem('findbook_redirect_url');
          this.router.navigate([redirectUrl]);
        }
      },
      error: (error) => {
        this.logger.auth('Login failed', error);
        this.snackBar.open(error.message || 'Login failed', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  onGoogleSignIn(): void {
    // Google OAuth implementation would go here
    // For now, show a message that it's coming soon
    this.snackBar.open('Google Sign-In coming soon!', 'Close', {
      duration: TIMING.SNACKBAR_DURATION,
    });
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
