import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    PAGE_QUERY,
    PRIVACY_SETTINGS_LABEL_KEY,
    VIEW_COUNTING_KEYS,
    consentScriptAttributes,
    loadViewCounting,
    resolveViewCounting,
    viewCountingErrors,
    setViewCountingLanguage,
    viewCountingOn,
} from './viewCounting.js';

const LOCALES_DIR = new URL('../locales/', import.meta.url);
const locale = (lang) => JSON.parse(fs.readFileSync(new URL(`${lang}.json`, LOCALES_DIR), 'utf8'));

const ON = {
    VIEWCOUNTER_URL: 'https://views.harshankur.com/',
    VIEWCOUNTER_APP_ID: 'blog',
    VIEWCOUNTER_EDGE: 'true',
    SITE_URL: 'https://blog.harshankur.com',
    FOOTER_PRIVACY_URL: 'https://harshankur.com/datenschutz#blog',
};

// Just enough of a document for loadViewCounting.
function fakeDocument() {
    const head = [];
    return {
        head: { appendChild: (node) => head.push(node) },
        appended: head,
        querySelector: (selector) => (selector === 'script[data-inscript-view-counting]'
            ? head.find(node => 'data-inscript-view-counting' in node.attributes) ?? null
            : null),
        createElement: (tag) => ({ tag, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }),
    };
}

test('with nothing set, counting is off and nothing is wrong', () => {
    assert.equal(resolveViewCounting({}), null);
    assert.deepEqual(viewCountingErrors({}), []);
});

test('with the instance and the app set, the published site asks with consent.js', () => {
    assert.deepEqual(resolveViewCounting(ON), {
        scriptUrl: 'https://views.harshankur.com/consent.js',
        appId: 'blog',
        edge: true,
        hosts: 'blog.harshankur.com',
        privacyUrl: 'https://harshankur.com/datenschutz#blog',
        privacyUrls: {},
    });
});

test('the consent script counts each post as its own page, only on the site, and says whether the edge counts', () => {
    assert.deepEqual(consentScriptAttributes(resolveViewCounting(ON)), {
        src: 'https://views.harshankur.com/consent.js',
        'data-app': 'blog',
        'data-query': 'post',
        'data-edge': 'true',
        'data-hosts': 'blog.harshankur.com',
        'data-privacy-url': 'https://harshankur.com/datenschutz#blog',
    });
    assert.equal(PAGE_QUERY, 'post');
});

test('without an edge Worker, without a site URL or a privacy notice, those parts are left out or off', () => {
    const attributes = consentScriptAttributes(resolveViewCounting({ VIEWCOUNTER_URL: 'https://views.example.com', VIEWCOUNTER_APP_ID: 'blog' }));
    assert.equal(attributes['data-edge'], 'false');
    assert.equal('data-hosts' in attributes, false);
    assert.equal('data-privacy-url' in attributes, false);
});

test('half a configuration, or a bad value, is an error and counts nothing', () => {
    const cases = [
        [{ VIEWCOUNTER_URL: 'https://views.example.com' }, /set together/],
        [{ VIEWCOUNTER_APP_ID: 'blog' }, /set together/],
        [{ ...ON, VIEWCOUNTER_URL: 'views.example.com' }, /VIEWCOUNTER_URL must be an absolute http\(s\) URL/],
        [{ ...ON, VIEWCOUNTER_URL: 'javascript:alert(1)' }, /VIEWCOUNTER_URL must be/],
        [{ ...ON, VIEWCOUNTER_APP_ID: 'my blog' }, /VIEWCOUNTER_APP_ID may hold only/],
        [{ ...ON, VIEWCOUNTER_EDGE: 'yes' }, /VIEWCOUNTER_EDGE must be true or false/],
    ];
    for (const [env, message] of cases) {
        assert.match(viewCountingErrors(env).join('\n'), message);
        assert.equal(resolveViewCounting(env), null);
    }
});

test('loadViewCounting adds the consent script once, deferred, and nothing when counting is off', () => {
    const doc = fakeDocument();
    loadViewCounting(null, 'en', doc);
    assert.equal(doc.appended.length, 0);
    loadViewCounting(resolveViewCounting(ON), 'en', doc);
    loadViewCounting(resolveViewCounting(ON), 'en', doc);
    assert.equal(doc.appended.length, 1);
    const [script] = doc.appended;
    assert.equal(script.tag, 'script');
    assert.equal(script.defer, true);
    assert.equal(script.attributes.src, 'https://views.harshankur.com/consent.js');
    assert.equal(script.attributes['data-query'], 'post');
});

test('counting is on only at SITE_URL\'s host, so a preview or a local build requests nothing from the counter', () => {
    const config = resolveViewCounting(ON);
    assert.equal(viewCountingOn(config, 'blog.harshankur.com'), config);
    assert.equal(viewCountingOn(config, 'BLOG.harshankur.com'), config);
    assert.equal(viewCountingOn(config, 'localhost'), null);
    assert.equal(viewCountingOn(config, 'blog-preview.example.workers.dev'), null);
    assert.equal(viewCountingOn(null, 'blog.harshankur.com'), null);
    // Without a site URL there is no host to hold to.
    const anywhere = resolveViewCounting({ VIEWCOUNTER_URL: 'https://views.example.com', VIEWCOUNTER_APP_ID: 'blog' });
    assert.equal(viewCountingOn(anywhere, 'localhost'), anywhere);
});

test('the Privacy settings link reads in every language', () => {
    assert.equal(locale('en')[PRIVACY_SETTINGS_LABEL_KEY], 'Privacy settings');
    assert.equal(locale('de')[PRIVACY_SETTINGS_LABEL_KEY], 'Datenschutz-Einstellungen');
    const languages = fs.readdirSync(LOCALES_DIR).filter(name => /^[a-z]{2}(-[A-Z]{2})?\.json$/.test(name)).map(name => name.slice(0, -5));
    for (const lang of languages) assert.ok(String(locale(lang)[PRIVACY_SETTINGS_LABEL_KEY] ?? '').trim(), `${lang} has it`);
});

test('the build exposes the VIEWCOUNTER_ settings to the page, and they are all public', () => {
    const vite = fs.readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8');
    assert.match(vite, /envPrefix:[^\n]*'VIEWCOUNTER_'/);
    assert.deepEqual(VIEW_COUNTING_KEYS, ['VIEWCOUNTER_URL', 'VIEWCOUNTER_APP_ID', 'VIEWCOUNTER_EDGE']);
});

test('the consent question links the privacy notice in the visitor\'s language, and follows a change of language', () => {
    const config = resolveViewCounting({
        ...ON,
        FOOTER_PRIVACY_URL: 'https://harshankur.com/datenschutz#en-blog',
        FOOTER_PRIVACY_URLS: 'de=https://harshankur.com/datenschutz#blog',
    });
    assert.equal(consentScriptAttributes(config, 'de')['data-privacy-url'], 'https://harshankur.com/datenschutz#blog');
    assert.equal(consentScriptAttributes(config, 'ja')['data-privacy-url'], 'https://harshankur.com/datenschutz#en-blog');
    const doc = fakeDocument();
    setViewCountingLanguage(config, 'de', doc); // nothing loaded yet: nothing to change
    loadViewCounting(config, 'en', doc);
    const [script] = doc.appended;
    assert.equal(script.attributes['data-privacy-url'], 'https://harshankur.com/datenschutz#en-blog');
    setViewCountingLanguage(config, 'de', doc);
    assert.equal(script.attributes['data-privacy-url'], 'https://harshankur.com/datenschutz#blog');
});
