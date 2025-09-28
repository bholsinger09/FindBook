import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAuth(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.canActivate(route, state);
  }

  private checkAuth(url: string): Observable<boolean> {
    if (this.authService.isAuthenticated()) {
      return of(true);
    }

    // Store the attempted URL for redirecting after login
    sessionStorage.setItem('findbook_redirect_url', url);

    // Redirect to login page
    this.router.navigate(['/auth/login']);
    return of(false);
  }
}

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      return of(true);
    }

    // User is already authenticated, redirect to dashboard
    this.router.navigate(['/dashboard']);
    return of(false);
  }
}

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
      return of(true);
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return of(false);
    }

    const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);

    if (!hasRequiredRole) {
      this.router.navigate(['/unauthorized']);
      return of(false);
    }

    return of(true);
  }
}
