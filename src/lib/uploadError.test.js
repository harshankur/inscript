import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HTTP_PAYLOAD_TOO_LARGE, HTTP_UNSUPPORTED_MEDIA_TYPE, uploadErrorMessage, withUploadReason } from './uploadError.js';
import { MAX_IMAGE_UPLOAD_BYTES } from '../../scripts/image-upload.js';

const en = JSON.parse(fs.readFileSync(new URL('../locales/en.json', import.meta.url), 'utf8'));
const t = (key, values = {}) => en[key].replace(/{{\s*(\w+)\s*}}/g, (_, name) => String(values[name]));

test('a refused file type and a too-large file each get their own reason', () => {
    assert.equal(uploadErrorMessage(HTTP_UNSUPPORTED_MEDIA_TYPE, t), 'Only PNG, JPEG, GIF, WebP and AVIF images can be uploaded.');
    assert.equal(uploadErrorMessage(HTTP_PAYLOAD_TOO_LARGE, t), `This image is too large. Images can be at most ${MAX_IMAGE_UPLOAD_BYTES / 1024 / 1024} MB.`);
});

test('other failures give no reason, so the general message stays', () => {
    for (const status of [undefined, 400, 401, 500, 502]) assert.equal(uploadErrorMessage(status, t), null);
});

test('the reason is attached to the error the media library receives', () => {
    const refused = withUploadReason(Object.assign(new Error('Request failed with status code 415'), { response: { status: 415 } }), t);
    assert.equal(refused.userMessage, en.uploadNotAnImage);
    const offline = withUploadReason(new Error('Network Error'), t);
    assert.equal(offline.userMessage, undefined);
});
