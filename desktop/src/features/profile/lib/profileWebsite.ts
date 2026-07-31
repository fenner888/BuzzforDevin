export function normalizeProfileWebsite(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      !url.hostname ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function profileWebsiteDisplayValue(value: string): string {
  try {
    const url = new URL(value);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return `${url.host}${path === "/" ? "" : path}`;
  } catch {
    return value;
  }
}
