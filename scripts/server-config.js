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
