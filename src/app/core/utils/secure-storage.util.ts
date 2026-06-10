import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { ENCRYPTION_CONFIG } from './encryption.config';

// ─── Internal Helpers ────────────────────────────────────────────────────────

/** Encrypts any serialisable value to a Base64-AES ciphertext string. */
function encrypt(value: unknown): string {
    return AES.encrypt(JSON.stringify(value), ENCRYPTION_CONFIG.SECRET_KEY).toString();
}

/**
 * Decrypts a ciphertext string and parses it back to `T`.
 * Returns `null` on any decryption / parse failure to prevent
 * cascading runtime errors from stale or tampered ciphertext.
 */
function decrypt<T>(ciphertext: string): T | null {
    try {
        const bytes = AES.decrypt(ciphertext, ENCRYPTION_CONFIG.SECRET_KEY);
        const json = bytes.toString(Utf8);
        return json ? (JSON.parse(json) as T) : null;
    } catch {
        return null;
    }
}

// ─── Local Storage ───────────────────────────────────────────────────────────

export const SecureLocalStorage = {
    /** Encrypts `value` and stores it under `key`. */
    set(key: string, value: unknown): void {
        localStorage.setItem(key, encrypt(value));
    },

    /** Retrieves and decrypts the value stored under `key`. */
    get<T>(key: string): T | null {
        const raw = localStorage.getItem(key);
        return raw ? decrypt<T>(raw) : null;
    },

    /** Removes a single key from localStorage. */
    remove(key: string): void {
        localStorage.removeItem(key);
    },

    /** Clears all keys from localStorage. */
    clear(): void {
        localStorage.clear();
    },
};

// ─── Session Storage ─────────────────────────────────────────────────────────

export const SecureSessionStorage = {
    /** Encrypts `value` and stores it under `key`. */
    set(key: string, value: unknown): void {
        sessionStorage.setItem(key, encrypt(value));
    },

    /** Retrieves and decrypts the value stored under `key`. */
    get<T>(key: string): T | null {
        const raw = sessionStorage.getItem(key);
        return raw ? decrypt<T>(raw) : null;
    },

    /** Removes a single key from sessionStorage. */
    remove(key: string): void {
        sessionStorage.removeItem(key);
    },

    /** Clears all keys from sessionStorage. */
    clear(): void {
        sessionStorage.clear();
    },
};

// ─── Cookies ─────────────────────────────────────────────────────────────────

export interface CookieOptions {
    /** Max-age in seconds. Defaults to `ENCRYPTION_CONFIG.COOKIE_MAX_AGE_SECONDS`. */
    maxAge?: number;
    /** Restricts the cookie to a URL path. Defaults to `/`. */
    path?: string;
    /** Marks the cookie as Secure (HTTPS only). Defaults to `true`. */
    secure?: boolean;
    /**
     * SameSite policy.
     * - `Strict`: never sent cross-site (safest, may break OAuth redirects).
     * - `Lax` (default): sent on top-level navigations.
     * - `None`: requires `Secure: true`.
     */
    sameSite?: 'Strict' | 'Lax' | 'None';
}

export const SecureCookies = {
    /**
     * Encrypts `value` and writes it as a cookie.
     * `Secure` and `SameSite=Lax` are applied by default.
     */
    set(key: string, value: unknown, options: CookieOptions = {}): void {
        const {
            maxAge = ENCRYPTION_CONFIG.COOKIE_MAX_AGE_SECONDS,
            path = '/',
            secure = true,
            sameSite = 'Lax',
        } = options;

        const encoded = encodeURIComponent(encrypt(value));
        let cookie = `${encodeURIComponent(key)}=${encoded}; Max-Age=${maxAge}; Path=${path}; SameSite=${sameSite}`;

        if (secure) {
            cookie += '; Secure';
        }

        document.cookie = cookie;
    },

    /** Retrieves and decrypts the cookie stored under `key`. */
    get<T>(key: string): T | null {
        const encodedKey = encodeURIComponent(key);
        const match = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${encodedKey}=`));

        if (!match) return null;

        const raw = decodeURIComponent(match.split('=').slice(1).join('='));
        return decrypt<T>(raw);
    },

    /** Expires the cookie immediately by setting Max-Age to 0. */
    remove(key: string, path = '/'): void {
        document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; Path=${path}`;
    },
};
