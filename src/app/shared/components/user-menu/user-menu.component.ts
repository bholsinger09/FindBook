import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <!-- Only show when user is authenticated (works with both real and mock auth) -->
    @if (authService.isAuthenticated()) {
      <button
        mat-icon-button
        [matMenuTriggerFor]="userMenu"
        aria-label="User menu"
        class="user-menu-button"
      >
        <mat-icon>account_circle</mat-icon>
      </button>

      <mat-menu #userMenu="matMenu" class="user-menu">
        <div class="user-info" mat-menu-item disabled>
          <div class="user-details">
            <div class="user-name">{{ userDisplayName() }}</div>
            <div class="user-email">{{ user()?.email }}</div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Sign Out</span>
        </button>
      </mat-menu>
    }
  `,
  styles: [`
    .user-menu-button {
      margin-left: 8px;
    }

    .user-info {
      padding: 12px 16px;
      min-width: 200px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-name {
      font-weight: 500;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
    }

    .user-email {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    .user-menu .mat-mdc-menu-item {
      height: auto;
    }

    .user-menu .mat-mdc-menu-item[disabled] {
      opacity: 1;
      cursor: default;
    }

    .user-menu .mat-mdc-menu-item .mat-icon {
      margin-right: 8px;
    }
  `],
})
export class UserMenuComponent {
  protected readonly authService = inject(AuthService);

  protected readonly user = computed(() => this.authService.user());
  protected readonly userDisplayName = computed(() => {
    const user = this.user();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || user?.email?.split('@')[0] || 'User';
  });

  protected logout(): void {
    this.authService.logout().subscribe();
  }
}