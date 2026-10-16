import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_LEGAL_NOTICE_LABEL,
    DEFAULT_PRIVACY_LABEL,
    FOOTER_KEYS,
    FOOTER_URL_KEYS,
    footerConfigErrors,
    httpUrl,
    resolveFooterConfig,
} from './footerConfig.js';

const FULL = {
    TITLE: 'Inscript',
    FOOTER_COPYRIGHT_HOLDER: 'Harsh Ankur',
    FOOTER_COPYRIGHT_URL: 'https://harshankur.com',
    FOOTER_COPYRIGHT_YEAR: '2026',
    FOOTER_LEGAL_NOTICE_URL: 'https://harshankur.com/impressum',
    FOOTER_PRIVACY_URL: 'https://harshankur.com/datenschutz#inscript',
};

test('httpUrl keeps absolute http and https URLs exactly as written', () => {
    assert.equal(httpUrl('https://harshankur.com'), 'https://harshankur.com');
    assert.equal(httpUrl('  http://example.com/a#b  '), 'http://example.com/a#b');
});

test('httpUrl refuses empty, relative and non-http values', () => {
    for (const value of [undefined, null, '', '   ', '/impressum', 'harshankur.com', 'javascript:alert(1)', 'mailto:a@b.c', 42]) {
        assert.equal(httpUrl(value), null, String(value));
    }
});

test('a fully configured footer has both legal links and the whole copyright line', () => {
    assert.deepEqual(resolveFooterConfig(FULL), {
        copyright: { title: 'Inscript', year: '2026', holder: 'Harsh Ankur', holderUrl: 'https://harshankur.com' },
        legalLinks: [
            { label: 'Impressum', url: 'https://harshankur.com/impressum' },
            { label: 'Datenschutz', url: 'https://harshankur.com/datenschutz#inscript' },
        ],
    });
});

test('with nothing set there is no copyright line and no legal link', () => {
    assert.deepEqual(resolveFooterConfig({}), { copyright: null, legalLinks: [] });
    assert.deepEqual(resolveFooterConfig(), { copyright: null, legalLinks: [] });
    assert.deepEqual(resolveFooterConfig({ TITLE: 'My Blog', FOOTER_COPYRIGHT_URL: 'https://example.com' }), { copyright: null, legalLinks: [] });
});

test('the copyright line is built from what is set', () => {
    assert.deepEqual(resolveFooterConfig({ TITLE: 'My Blog', FOOTER_COPYRIGHT_HOLDER: 'Jane' }).copyright,
        { title: 'My Blog', year: null, holder: 'Jane', holderUrl: null });
    assert.deepEqual(resolveFooterConfig({ TITLE: 'My Blog', FOOTER_COPYRIGHT_YEAR: ' 2024 ' }).copyright,
        { title: 'My Blog', year: '2024', holder: null, holderUrl: null });
    assert.deepEqual(resolveFooterConfig({ FOOTER_COPYRIGHT_HOLDER: 'Jane', FOOTER_COPYRIGHT_YEAR: '2024' }).copyright,
        { title: null, year: '2024', holder: 'Jane', holderUrl: null });
});

test('the holder is only linked to a valid URL', () => {
    assert.equal(resolveFooterConfig({ FOOTER_COPYRIGHT_HOLDER: 'Jane', FOOTER_COPYRIGHT_URL: 'javascript:alert(1)' }).copyright.holderUrl, null);
    assert.equal(resolveFooterConfig({ FOOTER_COPYRIGHT_YEAR: '2024', FOOTER_COPYRIGHT_URL: 'https://example.com' }).copyright.holderUrl, null);
});

test('each legal link appears on its own when only its URL is set', () => {
    assert.deepEqual(resolveFooterConfig({ FOOTER_LEGAL_NOTICE_URL: 'https://example.com/legal' }).legalLinks,
        [{ label: DEFAULT_LEGAL_NOTICE_LABEL, url: 'https://example.com/legal' }]);
    assert.deepEqual(resolveFooterConfig({ FOOTER_PRIVACY_URL: 'https://example.com/privacy' }).legalLinks,
        [{ label: DEFAULT_PRIVACY_LABEL, url: 'https://example.com/privacy' }]);
});

test('custom labels win over the default ones, and a blank label falls back to the default', () => {
    const env = {
        FOOTER_LEGAL_NOTICE_URL: 'https://example.com/legal',
        FOOTER_LEGAL_NOTICE_LABEL: 'Legal notice',
        FOOTER_PRIVACY_URL: 'https://example.com/privacy',
        FOOTER_PRIVACY_LABEL: '  ',
    };
    assert.deepEqual(resolveFooterConfig(env).legalLinks.map(link => link.label), ['Legal notice', 'Datenschutz']);
});

test('a legal link with an invalid URL is left out', () => {
    assert.deepEqual(resolveFooterConfig({ FOOTER_LEGAL_NOTICE_URL: '/impressum', FOOTER_PRIVACY_URL: 'https://example.com/p' }).legalLinks,
        [{ label: 'Datenschutz', url: 'https://example.com/p' }]);
});

test('footerConfigErrors names every URL key set to something that is not an http(s) URL', () => {
    assert.deepEqual(footerConfigErrors(FULL), []);
    assert.deepEqual(footerConfigErrors({}), []);
    assert.deepEqual(footerConfigErrors(), []);
    assert.deepEqual(footerConfigErrors({ FOOTER_PRIVACY_URL: ' harshankur.com/datenschutz ', FOOTER_COPYRIGHT_URL: '' }),
        ['FOOTER_PRIVACY_URL must be an absolute http(s) URL, got "harshankur.com/datenschutz"']);
});

test('the URL keys are footer keys', () => {
    for (const key of FOOTER_URL_KEYS) assert.ok(FOOTER_KEYS.includes(key), key);
    assert.ok(FOOTER_KEYS.every(key => key.startsWith('FOOTER_')));
});
