import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional route guard that protects routes requiring authentication.
 * Redirects unauthenticated users to `/auth/login` while preserving
 * the originally requested URL as a `returnUrl` query parameter.
 *
 * Usage:
 *   { path: 'dashboard', canActivate: [authGuard], ... }
 */
export const authGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Preserve the attempted URL for post-login redirection.
    const returnUrl = route.url.map((s) => s.path).join('/');
    return router.createUrlTree(['/auth/login'], {
        queryParams: returnUrl ? { returnUrl } : undefined,
    });
};
