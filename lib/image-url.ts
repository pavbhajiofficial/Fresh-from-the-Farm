/** Product images must be public HTTPS links, never local file paths or scripts. */
export function validProductImageUrl(value: string): boolean {
  if (!value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}
