import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor that:
 *  1. Attaches a Bearer token to every outgoing request (when present).
 *  2. Handles 401 Unauthorized by clearing credentials and redirecting to login.
 *  3. Re-throws all errors so downstream handlers can react.
 *
 * Registration (app.config.ts):
 *   provideHttpClient(withInterceptors([authTokenInterceptor]))
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.token();

    // Clone the request and attach the Authorization header only when a token exists.
    const authorizedReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(authorizedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Token is expired or invalid — clear state and force re-login.
                authService.clearToken();
                router.navigate(['/auth/login']);
            }

            // Propagate the error for feature-level error handling (e.g., toast, dialog).
            return throwError(() => error);
        })
    );
};
