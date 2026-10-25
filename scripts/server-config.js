// Docker Compose may use $$ to escape $, so values written by setup are unescaped here.
const unescapeDollars = (value) => value.replace(/\$\$/g, '$');

/**
 * The secret that signs session cookies. Null when authentication is off, since no session is
 * kept then. With authentication on, a missing secret is an error: the server must not start
 * with a guessable fallback. `npm run setup` generates one.
 */
export function sessionSecret(env) {
    if (env.AUTH_ENABLED !== 'true') return null;
    const secret = unescapeDollars(env.SESSION_SECRET ?? '').trim();
    if (!secret) {
        throw new Error('SESSION_SECRET is not set, and authentication is on. Run "npm run setup" to generate one, or set it in .env.');
    }
    return secret;
}

/**
 * The origins allowed to call the API from another site, from CORS_ORIGINS (comma-separated,
 * each an http(s) origin such as https://cms.example.com, with no path). Empty by default:
 * the editor reaches the API through its own origin and needs none. Throws on an entry that
 * is not an origin, so a typo cannot silently open or close access.
 */
export function corsOrigins(value) {
    const entries = (value ?? '').split(',').map(entry => entry.trim()).filter(Boolean);
    return entries.map(entry => {
        let url;
        try {
            url = new URL(entry);
        } catch {
            throw new Error(`CORS_ORIGINS: "${entry}" is not a URL.`);
        }
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== entry) {
            throw new Error(`CORS_ORIGINS: "${entry}" is not an origin such as https://cms.example.com (scheme and host, no path or trailing slash).`);
        }
        return entry;
    });
}

/** Whether the editor may push to the remote. Off unless ALLOW_PUSH is exactly "true". */
export function pushAllowed(env) {
    return env.ALLOW_PUSH === 'true';
}

// How long a sign-in lasts. Hours, as that is how a person thinks of it; the cookie takes
// milliseconds.
export const DEFAULT_SESSION_MAX_AGE_HOURS = 24;
// Under a quarter of an hour a sign-in would end while a post is being written; over a year is a
// credential nobody has to renew. A year is as long as a sign-in may last.
export const MIN_SESSION_MAX_AGE_HOURS = 0.25;
export const MAX_SESSION_MAX_AGE_HOURS = 8760;
const MS_PER_HOUR = 60 * 60 * 1000;
// Plain decimal numbers only: no signs, exponents, hex, units or thousands separators.
const HOURS_PATTERN = /^\d+(\.\d+)?$/;

/**
 * How long a sign-in lasts, in milliseconds, from SESSION_MAX_AGE_HOURS (a number of hours such
 * as 12 or 0.5). 24 hours when it is unset or blank. Throws on anything else, or a value outside
 * 0.25 to 8760 hours (a year), so a typo stops the server instead of quietly keeping or shortening every
 * sign-in. Checked even when authentication is off, so a mistake shows up before it is turned on.
 */
export function sessionMaxAgeMs(env) {
    const text = (env.SESSION_MAX_AGE_HOURS ?? '').trim();
    if (text === '') return DEFAULT_SESSION_MAX_AGE_HOURS * MS_PER_HOUR;
    const hours = HOURS_PATTERN.test(text) ? Number(text) : NaN;
    if (!Number.isFinite(hours) || hours < MIN_SESSION_MAX_AGE_HOURS || hours > MAX_SESSION_MAX_AGE_HOURS) {
        throw new Error(`SESSION_MAX_AGE_HOURS: "${text}" is not a number of hours from ${MIN_SESSION_MAX_AGE_HOURS} to ${MAX_SESSION_MAX_AGE_HOURS} (for example 12, or 0.5 for half an hour).`);
    }
    return Math.round(hours * MS_PER_HOUR);
}
