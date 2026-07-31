import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { BotIdenticon } from "@/features/messages/ui/BotIdenticon";
import { getPresenceLabel } from "@/features/presence/lib/presence";
import { PresenceDot } from "@/features/presence/ui/PresenceBadge";
import { normalizeProfileWebsite } from "@/features/profile/lib/profileWebsite";
import {
  MaskedAvatarBadgeFrame,
  STATUS_DOT_MASK_CURVE,
} from "@/features/profile/ui/MaskedAvatarBadgeFrame";
import { ProfileAvatar } from "@/features/profile/ui/ProfileAvatar";
import { StatusEmoji } from "@/features/user-status/ui/StatusEmoji";
import type { Profile } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";
import { rewriteRelayUrl } from "@/shared/lib/mediaUrl";

const PROFILE_HERO_PRESENCE_BADGE = {
  cutout: { cx: 68, cy: 68, r: 15 },
  shell: { bottom: 0, height: 24, right: 0, width: 24 },
} as const;

export function UserProfileHero({
  displayName,
  isBot,
  presenceStatus,
  profile,
  userStatus,
}: {
  displayName: string;
  isBot: boolean;
  presenceStatus: "online" | "away" | "offline" | undefined;
  profile: Profile | undefined;
  userStatus: { text: string; emoji: string } | null | undefined;
}) {
  const presenceDotClassName = isBot ? "h-4.5 w-4.5" : "h-3.5 w-3.5";
  const bannerUrl = profile?.bannerUrl
    ? normalizeProfileWebsite(profile.bannerUrl)
    : null;
  const avatar = (
    <MaskedAvatarBadgeFrame
      badge={
        presenceStatus ? (
          <span
            aria-label={getPresenceLabel(presenceStatus)}
            className="flex h-6 w-6 items-center justify-center rounded-full"
            data-testid="user-profile-presence-badge"
            role="img"
          >
            <PresenceDot
              className={presenceDotClassName}
              status={presenceStatus}
            />
          </span>
        ) : null
      }
      badgeBox={PROFILE_HERO_PRESENCE_BADGE.shell}
      className="h-20 w-20 rounded-full ring-4 ring-background"
      curve={STATUS_DOT_MASK_CURVE}
      cutout={PROFILE_HERO_PRESENCE_BADGE.cutout}
      size={80}
    >
      <ProfileAvatar
        avatarUrl={profile?.avatarUrl ?? null}
        className="h-full w-full text-xl"
        iconClassName="h-8 w-8"
        label={displayName}
        plain
        testId="user-profile-avatar"
      />
    </MaskedAvatarBadgeFrame>
  );

  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      {bannerUrl ? (
        <div
          className="relative mb-10 h-36 w-full"
          data-testid="user-profile-banner"
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-muted">
            <img
              alt=""
              className="h-full w-full object-cover"
              src={rewriteRelayUrl(bannerUrl)}
            />
          </div>
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            {avatar}
          </div>
        </div>
      ) : (
        avatar
      )}

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-xl font-semibold tracking-tight">
            {displayName}
          </h3>
          {isBot ? (
            <BotIdenticon
              className="shrink-0 rounded"
              data-testid="profile-bot-indicator"
              size={20}
              value={displayName}
            />
          ) : null}
        </div>
        {profile?.about?.trim() ? (
          <ProfileHeroDescription
            about={profile.about.trim()}
            key={profile.about.trim()}
          />
        ) : null}
        {profile?.nip05Handle ? (
          <p className="text-sm text-muted-foreground">{profile.nip05Handle}</p>
        ) : null}
        {userStatus ? (
          <p className="text-sm text-muted-foreground">
            {userStatus.emoji ? (
              <StatusEmoji
                className="mr-1 inline h-3.5 w-3.5"
                value={userStatus.emoji}
              />
            ) : null}
            {userStatus.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ProfileHeroDescription({ about }: { about: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const [isTruncated, setIsTruncated] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);
  const measureTruncation = React.useCallback(() => {
    const element = textRef.current;
    if (element && !expanded)
      setIsTruncated(element.scrollHeight > element.clientHeight + 1);
  }, [expanded]);

  React.useLayoutEffect(measureTruncation, [measureTruncation]);
  React.useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    const observer = new ResizeObserver(measureTruncation);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measureTruncation]);

  const toggleClassName =
    "inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground opacity-60 transition-opacity hover:text-foreground hover:opacity-100";
  return (
    <div className="flex w-full flex-col items-center gap-0.5">
      <div className="w-fit max-w-full px-2">
        <p
          className={cn(
            "text-center whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground",
            !expanded && "line-clamp-3",
          )}
          data-testid="user-profile-description"
          ref={textRef}
        >
          {about}
        </p>
      </div>
      {!expanded && isTruncated ? (
        <button
          className={toggleClassName}
          data-testid="user-profile-description-toggle"
          onClick={() => setExpanded(true)}
          type="button"
        >
          more <ChevronDown className="h-4 w-4" />
        </button>
      ) : null}
      {expanded ? (
        <button
          className={toggleClassName}
          data-testid="user-profile-description-toggle"
          onClick={() => setExpanded(false)}
          type="button"
        >
          less <ChevronUp className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
