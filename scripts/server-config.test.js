import test from 'node:test';
import assert from 'node:assert/strict';
import { corsOrigins, pushAllowed, sessionSecret } from './server-config.js';

test('with authentication on, a missing session secret stops the server', () => {
    for (const SESSION_SECRET of [undefined, '', '   ']) {
        assert.throws(() => sessionSecret({ AUTH_ENABLED: 'true', SESSION_SECRET }), /SESSION_SECRET is not set/);
    }
});

test('a set session secret is used, with $$ read as $', () => {
    assert.equal(sessionSecret({ AUTH_ENABLED: 'true', SESSION_SECRET: 'abc$$def' }), 'abc$def');
});

test('with authentication off, no session secret is needed', () => {
    assert.equal(sessionSecret({ AUTH_ENABLED: 'false' }), null);
    assert.equal(sessionSecret({}), null);
});

test('no CORS origins by default', () => {
    assert.deepEqual(corsOrigins(undefined), []);
    assert.deepEqual(corsOrigins(''), []);
    assert.deepEqual(corsOrigins(' , '), []);
});

test('listed origins are allowed', () => {
    assert.deepEqual(corsOrigins('https://cms.example.com, http://localhost:5173'), ['https://cms.example.com', 'http://localhost:5173']);
});

test('anything that is not an exact http(s) origin is refused', () => {
    for (const value of ['*', 'true', 'cms.example.com', 'https://cms.example.com/', 'https://cms.example.com/path', 'ftp://cms.example.com', 'javascript:alert(1)', 'https://CMS.example.com']) {
        assert.throws(() => corsOrigins(value), /CORS_ORIGINS/, value);
    }
});

test('pushing is allowed only when ALLOW_PUSH is exactly "true"', () => {
    assert.equal(pushAllowed({ ALLOW_PUSH: 'true' }), true);
    for (const ALLOW_PUSH of [undefined, '', 'false', 'TRUE', '1', 'yes']) {
        assert.equal(pushAllowed({ ALLOW_PUSH }), false, String(ALLOW_PUSH));
    }
});
