import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadedImageSrc } from './imageUpload.js';

test('a stored file name is shown from the site root, as the media library lists it', () => {
    assert.equal(uploadedImageSrc('1763500000000-42.png'), '/1763500000000-42.png');
    assert.equal(uploadedImageSrc('  1763500000000-42.webp '), '/1763500000000-42.webp');
});

test('an address that is already absolute is kept', () => {
    assert.equal(uploadedImageSrc('/assets/upload-abc.svg'), '/assets/upload-abc.svg');
    assert.equal(uploadedImageSrc('data:image/svg+xml;base64,PHN2Zy8+'), 'data:image/svg+xml;base64,PHN2Zy8+');
    assert.equal(uploadedImageSrc('https://example.com/a.png'), 'https://example.com/a.png');
});

test('no usable name gives no image', () => {
    for (const value of [undefined, null, '', '   ', 42, {}]) assert.equal(uploadedImageSrc(value), null);
});
