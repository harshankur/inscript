import test from 'node:test';
import assert from 'node:assert/strict';
import {
    corsOrigins,
    DEFAULT_SESSION_MAX_AGE_HOURS,
    MAX_SESSION_MAX_AGE_HOURS,
    MIN_SESSION_MAX_AGE_HOURS,
    pushAllowed,
    sessionMaxAgeMs,
    sessionSecret,
} from './server-config.js';

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

const HOUR_MS = 60 * 60 * 1000;

test('a sign-in lasts 24 hours unless SESSION_MAX_AGE_HOURS says otherwise', () => {
    assert.equal(DEFAULT_SESSION_MAX_AGE_HOURS, 24);
    for (const SESSION_MAX_AGE_HOURS of [undefined, '', '   ']) {
        assert.equal(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS }), 24 * HOUR_MS, String(SESSION_MAX_AGE_HOURS));
    }
    assert.equal(sessionMaxAgeMs({}), 24 * HOUR_MS);
});

test('a number of hours, whole or fractional, sets how long a sign-in lasts', () => {
    assert.equal(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: '12' }), 12 * HOUR_MS);
    assert.equal(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: '0.5' }), 0.5 * HOUR_MS);
    assert.equal(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: '1.5' }), 1.5 * HOUR_MS);
    assert.equal(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: '  8  ' }), 8 * HOUR_MS, 'surrounding space is ignored');
    assert.equal(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: '007' }), 7 * HOUR_MS);
});

test('the shortest and the longest sign-in are allowed, and nothing beyond them', () => {
    assert.equal(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: String(MIN_SESSION_MAX_AGE_HOURS) }), MIN_SESSION_MAX_AGE_HOURS * HOUR_MS);
    assert.equal(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: String(MAX_SESSION_MAX_AGE_HOURS) }), MAX_SESSION_MAX_AGE_HOURS * HOUR_MS);
    for (const SESSION_MAX_AGE_HOURS of ['0.24', '0', '0.0', '8761', '8760.01', '100000', '99999999999999999999']) {
        assert.throws(() => sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS }), /SESSION_MAX_AGE_HOURS/, SESSION_MAX_AGE_HOURS);
    }
});

test('anything that is not a plain number of hours is refused, with the setting named', () => {
    const bad = ['abc', '24h', '24 hours', '1e3', '0x10', '-5', '+5', '1,5', '1.', '.5', '5.', 'Infinity', 'NaN', '1 2', '12;', '0b11', '१२', '12\n13'];
    for (const SESSION_MAX_AGE_HOURS of bad) {
        assert.throws(() => sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS }), /SESSION_MAX_AGE_HOURS/, JSON.stringify(SESSION_MAX_AGE_HOURS));
    }
    assert.throws(() => sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: 'soon' }), /"soon" is not a number of hours from 0\.25 to 8760/);
});

test('the sign-in length is a whole number of milliseconds', () => {
    assert.equal(Number.isInteger(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: '0.333333333' })), true);
});

test('the sign-in length does not depend on whether authentication is on', () => {
    assert.equal(sessionMaxAgeMs({ AUTH_ENABLED: 'false', SESSION_MAX_AGE_HOURS: '2' }), 2 * HOUR_MS);
    assert.throws(() => sessionMaxAgeMs({ AUTH_ENABLED: 'false', SESSION_MAX_AGE_HOURS: 'x' }), /SESSION_MAX_AGE_HOURS/);
});

test('a sign-in may last a whole year, and not an hour longer', () => {
    assert.equal(MAX_SESSION_MAX_AGE_HOURS, 365 * 24);
    assert.equal(sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: '8760' }), 365 * 24 * HOUR_MS);
    assert.throws(() => sessionMaxAgeMs({ SESSION_MAX_AGE_HOURS: '8761' }), /SESSION_MAX_AGE_HOURS/);
});
