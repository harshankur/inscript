import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FAVICON_FILE, faviconIcons, pngSize, webManifest } from './manifest.js';

const DEFAULT_FAVICON = fs.readFileSync(new URL('../assets/favicon_default.png', import.meta.url));

// The start of a PNG: its signature and an IHDR chunk with the given size.
function pngHeader(width, height, type = 'IHDR') {
    const buffer = Buffer.alloc(33);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
    buffer.writeUInt32BE(13, 8);
    buffer.write(type, 12, 'ascii');
    buffer.writeUInt32BE(width, 16);
    buffer.writeUInt32BE(height, 20);
    return buffer;
}

test('pngSize reads the size of a PNG', () => {
    assert.deepEqual(pngSize(DEFAULT_FAVICON), { width: 128, height: 128 });
    assert.deepEqual(pngSize(pngHeader(512, 256)), { width: 512, height: 256 });
});

test('pngSize is null for anything that is not a readable PNG', () => {
    assert.equal(pngSize(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
    assert.equal(pngSize(Buffer.from([0x00, 0x00, 0x01, 0x00])), null);
    assert.equal(pngSize(pngHeader(512, 512).subarray(0, 20)), null);
    assert.equal(pngSize(pngHeader(512, 512, 'IDAT')), null);
    assert.equal(pngSize(pngHeader(0, 512)), null);
    assert.equal(pngSize(null), null);
    assert.equal(pngSize('favicon.png'), null);
});

test('the icon is the favicon, at the size it really has', () => {
    assert.equal(FAVICON_FILE, 'favicon.png');
    assert.deepEqual(faviconIcons(DEFAULT_FAVICON), [{ src: 'favicon.png', sizes: '128x128', type: 'image/png' }]);
    assert.deepEqual(faviconIcons(pngHeader(1024, 1024)), [{ src: 'favicon.png', sizes: '1024x1024', type: 'image/png' }]);
});

test('a favicon whose size cannot be read claims no size or type', () => {
    assert.deepEqual(faviconIcons(Buffer.from('<svg/>')), [{ src: 'favicon.png' }]);
    assert.deepEqual(faviconIcons(null), [{ src: 'favicon.png' }]);
});

test('the manifest is the template named after the site, with the favicon as its icon', () => {
    const template = JSON.parse(fs.readFileSync(new URL('../assets/manifest.json', import.meta.url), 'utf8'));
    const manifest = webManifest(template, { title: "Harsh's Blog", favicon: DEFAULT_FAVICON });
    assert.equal(manifest.name, "Harsh's Blog");
    assert.equal(manifest.short_name, "Harsh's Blog");
    assert.equal(manifest.start_url, template.start_url);
    assert.equal(manifest.display, template.display);
    assert.deepEqual(manifest.icons, [{ src: 'favicon.png', sizes: '128x128', type: 'image/png' }]);
    // The template itself claims no icon sizes.
    assert.equal(template.icons, undefined);
});
