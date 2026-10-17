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

// The i18n keys (src/locales/<lang>.json) of the legal links' default labels, so a link reads in
// the visitor's language (German "Impressum" and "Datenschutz", English "Legal notice" and
// "Privacy") unless FOOTER_LEGAL_NOTICE_LABEL or FOOTER_PRIVACY_LABEL sets fixed text.
export const LEGAL_NOTICE_LABEL_KEY = 'footerLegalNotice';
export const PRIVACY_LABEL_KEY = 'footerPrivacy';

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
// `legalLinks` are the legal notice and privacy links that have a valid URL, in that order. Each
// has the i18n key of its default label (`labelKey`) and the label set in the environment
// (`label`, null when unset or blank), which wins over the translated one.
export function resolveFooterConfig(env = {}) {
    const title = text(env.TITLE) || null;
    const holder = text(env.FOOTER_COPYRIGHT_HOLDER) || null;
    const year = text(env.FOOTER_COPYRIGHT_YEAR) || null;
    const copyright = holder || year
        ? { title, year, holder, holderUrl: holder ? httpUrl(env.FOOTER_COPYRIGHT_URL) : null }
        : null;
    const legalLinks = [
        { labelKey: LEGAL_NOTICE_LABEL_KEY, label: text(env.FOOTER_LEGAL_NOTICE_LABEL) || null, url: httpUrl(env.FOOTER_LEGAL_NOTICE_URL) },
        { labelKey: PRIVACY_LABEL_KEY, label: text(env.FOOTER_PRIVACY_LABEL) || null, url: httpUrl(env.FOOTER_PRIVACY_URL) },
    ].filter(link => link.url);
    return { copyright, legalLinks };
}
