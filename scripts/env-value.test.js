import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import { envValue } from './env-value.js';

test('a value with "#" is quoted and reads back unchanged', () => {
    const url = 'https://harshankur.com/datenschutz#inscript';
    assert.equal(envValue(url), `"${url}"`);
    assert.equal(dotenv.parse(`KEY=${envValue(url)}`).KEY, url);
});

test('other values are written as they are', () => {
    assert.equal(envValue('Harsh Ankur'), 'Harsh Ankur');
    assert.equal(envValue('https://harshankur.com'), 'https://harshankur.com');
    assert.equal(dotenv.parse(`KEY=${envValue('Harsh Ankur')}`).KEY, 'Harsh Ankur');
});

test('a missing value is written empty', () => {
    assert.equal(envValue(undefined), '');
    assert.equal(envValue(null), '');
    assert.equal(envValue(''), '');
});
