const DEFAULT_APP_NAME = "Buzz";
const DEFAULT_DEEP_LINK_SCHEME = "buzz";
const DEFAULT_RELEASES_URL = "https://github.com/block/buzz/releases";
const DEFAULT_RELEASES_API_URL =
  "https://api.github.com/repos/block/buzz/releases?per_page=10";
const DEEP_LINK_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*$/;

function configuredString(value: string | undefined, fallback: string): string {
  const configured = value?.trim();
  return configured || fallback;
}

function configuredDeepLinkScheme(value: string | undefined): string {
  const configured = value?.trim().toLowerCase();
  return configured && DEEP_LINK_SCHEME_PATTERN.test(configured)
    ? configured
    : DEFAULT_DEEP_LINK_SCHEME;
}

function configuredHttpsUrl(
  value: string | undefined,
  fallback: string,
): string {
  const configured = value?.trim();
  if (!configured) return fallback;
  try {
    const parsed = new URL(configured);
    return parsed.protocol === "https:" ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

export const BUZZ_APP_NAME = configuredString(
  import.meta.env.VITE_BUZZ_APP_NAME,
  DEFAULT_APP_NAME,
);

export const BUZZ_DEEP_LINK_SCHEME = configuredDeepLinkScheme(
  import.meta.env.VITE_BUZZ_DEEP_LINK_SCHEME,
);

export const BUZZ_RELEASES_URL = configuredHttpsUrl(
  import.meta.env.VITE_BUZZ_RELEASES_URL,
  DEFAULT_RELEASES_URL,
);

export const BUZZ_RELEASES_API_URL = configuredHttpsUrl(
  import.meta.env.VITE_BUZZ_RELEASES_API_URL,
  DEFAULT_RELEASES_API_URL,
);

export function buzzAppDeepLink(destination: string): string {
  return `${BUZZ_DEEP_LINK_SCHEME}://${destination}`;
}
