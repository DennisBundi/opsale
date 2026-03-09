/**
 * Validates redirect URLs to prevent open redirect attacks.
 * Only allows relative paths starting with "/".
 * Rejects absolute URLs, protocol-relative URLs, and other schemes.
 */
export function validateRedirect(url: string | null | undefined, fallback: string = '/'): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();

  // Must start with a single forward slash
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  // Reject protocol-relative URLs (e.g., //evil.com)
  if (trimmed.startsWith('//')) {
    return fallback;
  }

  // Reject URLs with backslash (some browsers normalize \\ to //)
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Reject URLs containing protocol schemes (e.g., /javascript:, /data:)
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
