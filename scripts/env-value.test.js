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

test('a value with a quote is quoted with the other kind, and reads back unchanged in dotenv and Vite', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const { loadEnv } = await import('vite');
    const values = { FOOTER_A: 'The "Blog" Team', FOOTER_B: "Jane's Blog", FOOTER_C: "Jane's #1" };
    assert.equal(envValue(values.FOOTER_A), `'The "Blog" Team'`);
    assert.equal(envValue(values.FOOTER_B), `"Jane's Blog"`);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-value-'));
    try {
        const text = Object.entries(values).map(([key, value]) => `${key}=${envValue(value, key)}`).join('\n');
        fs.writeFileSync(path.join(dir, '.env'), text);
        assert.deepEqual(dotenv.parse(text), values);
        assert.deepEqual(loadEnv('test', dir, 'FOOTER_'), values);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test('values no .env spelling reads back alike are refused, naming the key', () => {
    assert.throws(() => envValue('https://example.com/$price', 'FOOTER_PRIVACY_URL'), /FOOTER_PRIVACY_URL cannot contain "\$"/);
    assert.throws(() => envValue(`Jane's "Blog"`, 'FOOTER_COPYRIGHT_HOLDER'), /FOOTER_COPYRIGHT_HOLDER cannot contain both kinds of quote/);
    assert.throws(() => envValue('two\nlines', 'TITLE'), /TITLE must be a single line/);
});
