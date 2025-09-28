import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth for certain requests
  if (shouldSkipAuth(req)) {
    return next(req);
  }

  // Add auth token to request
  const authReq = addAuthToken(req, authService);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        return handle401Error(authReq, next, authService, router);
      }

      return throwError(() => error);
    }),
  );
};

/**
 * Check if request should skip authentication
 */
function shouldSkipAuth(req: HttpRequest<any>): boolean {
  const skipUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/password-reset',
    '/auth/password-change',
    'googleapis.com',
    'google.com',
  ];

  return skipUrls.some((url) => req.url.includes(url));
}

/**
 * Add authentication token to request headers
 */
function addAuthToken(req: HttpRequest<any>, authService: AuthService): HttpRequest<any> {
  const token = authService.getToken();

  if (token) {
    return req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return req;
}

/**
 * Handle 401 Unauthorized responses
 */
function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
): Observable<HttpEvent<any>> {
  if (isRefreshing) {
    // If already refreshing, wait for new token
    return throwError(() => new Error('Token refresh in progress'));
  }

  isRefreshing = true;

  return authService.refreshToken().pipe(
    switchMap(() => {
      isRefreshing = false;
      // Retry original request with new token
      const newAuthReq = addAuthToken(req, authService);
      return next(newAuthReq);
    }),
    catchError((error) => {
      isRefreshing = false;
      // Refresh failed, redirect to login
      router.navigate(['/auth/login']);
      return throwError(() => error);
    }),
  );
}
