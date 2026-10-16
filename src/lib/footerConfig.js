// The site footer's settings, resolved once from the build's environment (Vite exposes the
// FOOTER_* keys and TITLE through `envPrefix`; .env.example documents each one). Plain
// functions without import.meta, so scripts/setup-inscript.js validates with the same rules
// and Node's test runner can test them.

export const FOOTER_KEYS = [
    'FOOTER_COPYRIGHT_HOLDER',
    'FOOTER_COPYRIGHT_URL',
    'FOOTER_COPYRIGHT_YEAR',
    'FOOTER_LEGAL_NOTICE_URL',
    'FOOTER_LEGAL_NOTICE_LABEL',
    'FOOTER_PRIVACY_URL',
    'FOOTER_PRIVACY_LABEL',
];

// The keys holding a link, which must be an absolute http(s) URL.
export const FOOTER_URL_KEYS = ['FOOTER_COPYRIGHT_URL', 'FOOTER_LEGAL_NOTICE_URL', 'FOOTER_PRIVACY_URL'];

// The German legal terms, which visitors look for under these names in every language.
export const DEFAULT_LEGAL_NOTICE_LABEL = 'Impressum';
export const DEFAULT_PRIVACY_LABEL = 'Datenschutz';

const text = (value) => (typeof value === 'string' ? value.trim() : '');

// The value as an absolute http(s) URL, or null when it is empty or anything else (a relative
// path, javascript:, a typo), so a bad value never becomes a link.
export function httpUrl(value) {
    const candidate = text(value);
    if (!candidate) return null;
    try {
        const { protocol } = new URL(candidate);
        return protocol === 'https:' || protocol === 'http:' ? candidate : null;
    } catch {
        return null;
    }
}

// One message per URL key that is set but is not an absolute http(s) URL.
export function footerConfigErrors(env = {}) {
    return FOOTER_URL_KEYS
        .filter(key => text(env[key]) && !httpUrl(env[key]))
        .map(key => `${key} must be an absolute http(s) URL, got "${text(env[key])}"`);
}

// `copyright` is the line `<title> © <year> <holder>` (holder linked to holderUrl when set),
// or null when neither a holder nor a year is set; parts that are unset are left out.
// `legalLinks` are the legal notice and privacy links that have a valid URL, in that order.
export function resolveFooterConfig(env = {}) {
    const title = text(env.TITLE) || null;
    const holder = text(env.FOOTER_COPYRIGHT_HOLDER) || null;
    const year = text(env.FOOTER_COPYRIGHT_YEAR) || null;
    const copyright = holder || year
        ? { title, year, holder, holderUrl: holder ? httpUrl(env.FOOTER_COPYRIGHT_URL) : null }
        : null;
    const legalLinks = [
        { label: text(env.FOOTER_LEGAL_NOTICE_LABEL) || DEFAULT_LEGAL_NOTICE_LABEL, url: httpUrl(env.FOOTER_LEGAL_NOTICE_URL) },
        { label: text(env.FOOTER_PRIVACY_LABEL) || DEFAULT_PRIVACY_LABEL, url: httpUrl(env.FOOTER_PRIVACY_URL) },
    ].filter(link => link.url);
    return { copyright, legalLinks };
}
