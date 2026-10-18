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
    'FOOTER_PRIVACY_URLS',
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

// A language tag as a FOOTER_PRIVACY_URLS entry names it: "de", "pt", "zh-CN".
const LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i;

// FOOTER_PRIVACY_URLS: the privacy notice for visitors of other languages, as comma-separated
// `<language>=<URL>` pairs (de=https://example.com/datenschutz), for a notice written in several
// languages. Languages are kept lower-case. `errors` names each entry that is not such a pair.
export function parseLanguageUrls(value) {
    const urls = {};
    const errors = [];
    for (const entry of text(value).split(',').map(part => part.trim()).filter(Boolean)) {
        const at = entry.indexOf('=');
        const language = at > 0 ? entry.slice(0, at).trim() : '';
        const url = at > 0 ? httpUrl(entry.slice(at + 1)) : null;
        if (!LANGUAGE_TAG.test(language) || !url) {
            errors.push(`FOOTER_PRIVACY_URLS entries must be <language>=<absolute http(s) URL>, got "${entry}"`);
        } else {
            urls[language.toLowerCase()] = url;
        }
    }
    return { urls, errors };
}

// The address of a link for a visitor of a language: the one for that language (or its primary
// subtag, "de" for "de-AT"), else the link's own.
export function urlForLanguage(url, urls, language) {
    const tag = text(language).toLowerCase();
    if (!urls || !tag) return url;
    return urls[tag] ?? urls[tag.split('-')[0]] ?? url;
}

// One message per URL key that is set but is not an absolute http(s) URL, and per bad
// FOOTER_PRIVACY_URLS entry; the per-language addresses need FOOTER_PRIVACY_URL for everyone else.
export function footerConfigErrors(env = {}) {
    const errors = FOOTER_URL_KEYS
        .filter(key => text(env[key]) && !httpUrl(env[key]))
        .map(key => `${key} must be an absolute http(s) URL, got "${text(env[key])}"`);
    errors.push(...parseLanguageUrls(env.FOOTER_PRIVACY_URLS).errors);
    if (text(env.FOOTER_PRIVACY_URLS) && !text(env.FOOTER_PRIVACY_URL)) {
        errors.push('FOOTER_PRIVACY_URLS needs FOOTER_PRIVACY_URL, the address for every other language');
    }
    return errors;
}

// `copyright` is the line `<title> © <year> <holder>` (holder linked to holderUrl when set),
// or null when neither a holder nor a year is set; parts that are unset are left out.
// `legalLinks` are the legal notice and privacy links that have a valid URL, in that order. Each
// has the i18n key of its default label (`labelKey`) and the label set in the environment
// (`label`, null when unset or blank), which wins over the translated one, and `urls`, its
// address by language (FOOTER_PRIVACY_URLS for the privacy link), for urlForLanguage.
export function resolveFooterConfig(env = {}) {
    const title = text(env.TITLE) || null;
    const holder = text(env.FOOTER_COPYRIGHT_HOLDER) || null;
    const year = text(env.FOOTER_COPYRIGHT_YEAR) || null;
    const copyright = holder || year
        ? { title, year, holder, holderUrl: holder ? httpUrl(env.FOOTER_COPYRIGHT_URL) : null }
        : null;
    const legalLinks = [
        { labelKey: LEGAL_NOTICE_LABEL_KEY, label: text(env.FOOTER_LEGAL_NOTICE_LABEL) || null, url: httpUrl(env.FOOTER_LEGAL_NOTICE_URL), urls: {} },
        { labelKey: PRIVACY_LABEL_KEY, label: text(env.FOOTER_PRIVACY_LABEL) || null, url: httpUrl(env.FOOTER_PRIVACY_URL), urls: parseLanguageUrls(env.FOOTER_PRIVACY_URLS).urls },
    ].filter(link => link.url);
    return { copyright, legalLinks };
}
