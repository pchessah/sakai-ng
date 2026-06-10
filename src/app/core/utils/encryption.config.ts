/**
 * Encryption configuration.
 *
 * SECURITY NOTICE:
 * - Never hard-code the secret in source control for production.
 * - Inject via `environment.ts` or a server-side bootstrap endpoint.
 * - Rotate this key on any suspected compromise.
 */
export const ENCRYPTION_CONFIG = {
    /** AES-256 secret key — override in `environment.ts`. */
    SECRET_KEY: 'REPLACE_WITH_ENV_SECRET',

    /** Cookie max-age in seconds (default: 7 days). */
    COOKIE_MAX_AGE_SECONDS: 7 * 24 * 60 * 60,
} as const;
