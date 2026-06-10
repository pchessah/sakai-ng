import { Injectable, computed, signal } from '@angular/core';
import { SecureLocalStorage } from '../utils/secure-storage.util';

const TOKEN_KEY = 'access_token';

/**
 * Minimal, signal-based authentication service.
 * The token is always AES-encrypted at rest via `SecureLocalStorage`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly _token = signal<string | null>(
        SecureLocalStorage.get<string>(TOKEN_KEY)
    );

    /** `true` when a non-null token is present. */
    readonly isAuthenticated = computed(() => !!this._token());

    /** Read-only reference to the raw (decrypted) token value. */
    readonly token = this._token.asReadonly();

    /** Encrypts and persists the token, then updates the reactive signal. */
    setToken(token: string): void {
        SecureLocalStorage.set(TOKEN_KEY, token);
        this._token.set(token);
    }

    /** Removes the encrypted token from storage and clears the signal. */
    clearToken(): void {
        SecureLocalStorage.remove(TOKEN_KEY);
        this._token.set(null);
    }
}
