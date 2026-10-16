// A value as it must be written into a .env file to read back unchanged. dotenv (which Vite
// and the server use) ends an unquoted value at "#", so a URL with a fragment
// (https://example.com/privacy#blog) is double-quoted; everything else is written as is.
export function envValue(value) {
    const text = String(value ?? '');
    return text.includes('#') ? `"${text}"` : text;
}
