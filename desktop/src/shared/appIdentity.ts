const DEFAULT_DEEP_LINK_SCHEME = "buzz";
const DEFAULT_RELEASES_URL = "https://github.com/block/buzz/releases/latest";

export function normalizeDeepLinkScheme(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized &&
    /^[a-z][a-z0-9+.-]*$/.test(normalized) &&
    normalized.length <= 64
  ) {
    return normalized;
  }
  return DEFAULT_DEEP_LINK_SCHEME;
}

export const APP_DEEP_LINK_SCHEME = normalizeDeepLinkScheme(
  import.meta.env?.VITE_BUZZ_DEEP_LINK_SCHEME,
);

export const APP_DEEP_LINK_PROTOCOL = `${APP_DEEP_LINK_SCHEME}:`;

export function normalizeReleasesUrl(value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return DEFAULT_RELEASES_URL;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "https:"
      ? parsed.toString()
      : DEFAULT_RELEASES_URL;
  } catch {
    return DEFAULT_RELEASES_URL;
  }
}

export const APP_RELEASES_URL = normalizeReleasesUrl(
  import.meta.env?.VITE_BUZZ_RELEASES_URL,
);

export function isSupportedAppDeepLinkProtocol(protocol: string): boolean {
  return (
    protocol === APP_DEEP_LINK_PROTOCOL ||
    protocol === `${DEFAULT_DEEP_LINK_SCHEME}:`
  );
}
