import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule],
  template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="error-icon">lock</mat-icon>
            Access Denied
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <p>You don't have permission to access this page.</p>
          <p>Please contact an administrator if you believe this is an error.</p>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-raised-button color="primary" routerLink="/">
            <mat-icon>home</mat-icon>
            Go Home
          </button>
          <button mat-button routerLink="/auth/login">
            <mat-icon>login</mat-icon>
            Sign In
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .unauthorized-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
        background: #f5f5f5;
      }

      .unauthorized-card {
        max-width: 400px;
        text-align: center;
      }

      .error-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #f44336;
      }

      mat-card-actions {
        gap: 12px;
        justify-content: center;
      }
    `,
  ],
})
export class UnauthorizedComponent {}
