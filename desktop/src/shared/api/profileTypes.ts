export type ProfileLinkKind = "github" | "linkedin" | "x" | "custom";

export type ProfileLink = {
  kind: ProfileLinkKind;
  label: string;
  url: string;
};

export type ProfileBannerPosition = {
  x: number;
  y: number;
};

export const DEFAULT_PROFILE_BANNER_POSITION: ProfileBannerPosition = {
  x: 50,
  y: 50,
};

export type Profile = {
  pubkey: string;
  displayName: string | null;
  avatarUrl: string | null;
  about: string | null;
  website: string | null;
  bannerUrl: string | null;
  bannerPosition: ProfileBannerPosition | null;
  socialLinks: ProfileLink[];
  nip05Handle: string | null;
  ownerPubkey: string | null;
  /** True for a real kind:0 event; false for a synthesized fallback. */
  hasProfileEvent: boolean;
};

export type UpdateProfileInput = {
  displayName?: string;
  avatarUrl?: string;
  about?: string;
  website?: string;
  bannerUrl?: string;
  bannerPosition?: ProfileBannerPosition;
  socialLinks?: ProfileLink[];
  nip05Handle?: string;
};
