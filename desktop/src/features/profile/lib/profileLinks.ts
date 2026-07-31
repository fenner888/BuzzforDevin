import type { ProfileLink, ProfileLinkKind } from "@/shared/api/types";

export const PROFILE_LINK_KINDS: Array<{
  kind: Exclude<ProfileLinkKind, "custom">;
  label: string;
  placeholder: string;
}> = [
  { kind: "github", label: "GitHub", placeholder: "github.com/username" },
  {
    kind: "linkedin",
    label: "LinkedIn",
    placeholder: "linkedin.com/in/username",
  },
  { kind: "x", label: "X", placeholder: "x.com/username" },
];

const ALLOWED_HOSTS: Record<Exclude<ProfileLinkKind, "custom">, Set<string>> = {
  github: new Set(["github.com", "www.github.com"]),
  linkedin: new Set(["linkedin.com", "www.linkedin.com"]),
  x: new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]),
};

export function normalizeProfileLinkUrl(
  value: string,
  kind: ProfileLinkKind,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return null;
    }
    if (kind !== "custom" && !ALLOWED_HOSTS[kind].has(url.hostname)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function profileLinkDisplayValue(value: string): string {
  try {
    const url = new URL(value);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return `${url.host}${path === "/" ? "" : path}`;
  } catch {
    return value;
  }
}

export function normalizeProfileLinks(
  links: ProfileLink[],
): ProfileLink[] | null {
  if (links.length > 8) return null;
  const seen = new Set<ProfileLinkKind>();
  const normalized: ProfileLink[] = [];
  for (const link of links) {
    if (link.kind !== "custom" && seen.has(link.kind)) return null;
    seen.add(link.kind);
    const label = link.kind === "custom" ? link.label.trim() : link.label;
    const url = normalizeProfileLinkUrl(link.url, link.kind);
    if (!url || !label || label.length > 40) return null;
    normalized.push({ ...link, label, url });
  }
  return normalized;
}
