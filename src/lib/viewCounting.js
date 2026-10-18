// Page view counting with viewcounter (https://viewcounter.harshankur.com), off unless the build
// sets VIEWCOUNTER_URL and VIEWCOUNTER_APP_ID. The published site then loads that instance's
// consent.js, which asks each visitor before it loads viewcounter's tracker, and the footer gets a
// "Privacy settings" link that asks again. Plain functions without import.meta, like
// footerConfig.js, so scripts/setup-inscript.js validates with the same rules and Node's test
// runner can test them.

import { httpUrl } from './footerConfig.js';

export const VIEW_COUNTING_KEYS = ['VIEWCOUNTER_URL', 'VIEWCOUNTER_APP_ID', 'VIEWCOUNTER_EDGE'];

// The i18n key (src/locales/<lang>.json) of the footer link that reopens the consent question.
export const PRIVACY_SETTINGS_LABEL_KEY = 'footerPrivacySettings';

// A post's address is /?post=<name>, so `post` is part of the page: each post is counted on its
// own, and every other query parameter stays in the browser.
export const PAGE_QUERY = 'post';

// As viewcounter accepts an app ID.
const APP_ID = /^[A-Za-z0-9_-]{1,64}$/;

const text = (value) => (typeof value === 'string' ? value.trim() : '');

// One message per setting that is set but cannot work, and one when only half is set.
export function viewCountingErrors(env = {}) {
    const errors = [];
    const url = text(env.VIEWCOUNTER_URL);
    const appId = text(env.VIEWCOUNTER_APP_ID);
    const edge = text(env.VIEWCOUNTER_EDGE);
    if (url && !httpUrl(url)) errors.push(`VIEWCOUNTER_URL must be an absolute http(s) URL, got "${url}"`);
    if (appId && !APP_ID.test(appId)) errors.push(`VIEWCOUNTER_APP_ID may hold only letters, digits, _ and - (up to 64), got "${appId}"`);
    if (Boolean(url) !== Boolean(appId)) errors.push('VIEWCOUNTER_URL and VIEWCOUNTER_APP_ID are set together or not at all');
    if (edge && edge !== 'true' && edge !== 'false') errors.push(`VIEWCOUNTER_EDGE must be true or false, got "${edge}"`);
    return errors;
}

// The counting settings, or null when counting is off (or set wrongly, which setup refuses).
// `hosts` is SITE_URL's hostname, so the question is only ever asked on the published site and
// never on a preview or a local build; `privacyUrl` is the footer's privacy notice.
export function resolveViewCounting(env = {}) {
    if (viewCountingErrors(env).length) return null;
    const base = httpUrl(env.VIEWCOUNTER_URL);
    const appId = text(env.VIEWCOUNTER_APP_ID);
    if (!base || !appId) return null;
    let hosts = '';
    try {
        hosts = httpUrl(env.SITE_URL) ? new URL(text(env.SITE_URL)).hostname : '';
    } catch {
        hosts = '';
    }
    return {
        scriptUrl: `${base.replace(/\/+$/, '')}/consent.js`,
        appId,
        edge: text(env.VIEWCOUNTER_EDGE) === 'true',
        hosts,
        privacyUrl: httpUrl(env.FOOTER_PRIVACY_URL),
    };
}

// The consent script's tag attributes for these settings (see viewcounter's consent.js).
export function consentScriptAttributes(config) {
    const attributes = {
        src: config.scriptUrl,
        'data-app': config.appId,
        'data-query': PAGE_QUERY,
        // Without an edge Worker in front of the site nothing counts it before the visitor allows
        // it, and the question says so.
        'data-edge': config.edge ? 'true' : 'false',
    };
    if (config.hosts) attributes['data-hosts'] = config.hosts;
    if (config.privacyUrl) attributes['data-privacy-url'] = config.privacyUrl;
    return attributes;
}

// Add the consent script to the page, once.
export function loadViewCounting(config, doc = document) {
    if (!config || doc.querySelector('script[data-inscript-view-counting]')) return;
    const script = doc.createElement('script');
    script.defer = true;
    for (const [name, value] of Object.entries(consentScriptAttributes(config))) script.setAttribute(name, value);
    script.setAttribute('data-inscript-view-counting', '');
    doc.head.appendChild(script);
}
