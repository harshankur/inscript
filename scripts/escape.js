// Text made safe to place in HTML or XML, as element content or a quoted attribute value. The
// apostrophe is written as a numeric reference, which both HTML and XML read.
const MARKUP_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export function escapeMarkup(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => MARKUP_ENTITIES[char]);
}
