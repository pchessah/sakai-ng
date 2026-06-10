import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { SecureLocalStorage } from '../utils/secure-storage.util';

const TOKEN_KEY = 'access_token';

interface AuthState {
    token: string | null;
}

/**
 * Signal store equivalent of AuthService.
 * Provided at root so it behaves as a singleton.
 *
 * Usage in a component or service:
 *   private readonly auth = inject(AuthStore);
 *   this.auth.isAuthenticated() // Signal<boolean>
 *   this.auth.setToken('...')
 *   this.auth.clearToken()
 */
export const AuthStore = signalStore(
    { providedIn: 'root' },
    withState<AuthState>({
        token: SecureLocalStorage.get<string>(TOKEN_KEY),
    }),
    withComputed(({ token }) => ({
        isAuthenticated: computed(() => !!token()),
    })),
    withMethods((store) => ({
        setToken(token: string): void {
            SecureLocalStorage.set(TOKEN_KEY, token);
            patchState(store, { token });
        },
        clearToken(): void {
            SecureLocalStorage.remove(TOKEN_KEY);
            patchState(store, { token: null });
        },
    }))
);
