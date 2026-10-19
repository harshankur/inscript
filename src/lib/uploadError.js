import { MAX_IMAGE_UPLOAD_BYTES } from '../../scripts/image-upload.js';

export const HTTP_PAYLOAD_TOO_LARGE = 413;
export const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
const BYTES_PER_MB = 1024 * 1024;

/**
 * What to tell the writer when the server refused an image upload with `status`, in their
 * language through `t`, or null when the status has no specific reason to give.
 */
export function uploadErrorMessage(status, t) {
    switch (status) {
        case HTTP_UNSUPPORTED_MEDIA_TYPE:
            return t('uploadNotAnImage');
        case HTTP_PAYLOAD_TOO_LARGE:
            return t('uploadTooLarge', { size: MAX_IMAGE_UPLOAD_BYTES / BYTES_PER_MB });
        default:
            return null;
    }
}

/**
 * `error` with the reason for the writer attached as `userMessage`, which the editor's media
 * library shows in place of its general "Upload failed" message.
 */
export function withUploadReason(error, t) {
    const userMessage = uploadErrorMessage(error?.response?.status, t);
    if (userMessage && error && typeof error === 'object') error.userMessage = userMessage;
    return error;
}
