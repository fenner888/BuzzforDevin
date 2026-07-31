import { Check, ImagePlus, Move, RotateCcw, Trash2, X } from "lucide-react";
import * as React from "react";

import { normalizeProfileWebsite } from "@/features/profile/lib/profileWebsite";
import { useAvatarUpload } from "@/features/profile/useAvatarUpload";
import { rewriteRelayUrl } from "@/shared/lib/mediaUrl";
import {
  DEFAULT_PROFILE_BANNER_POSITION,
  type ProfileBannerPosition,
} from "@/shared/api/profileTypes";
import { Spinner } from "@/shared/ui/spinner";

export function ProfileBannerEditor({
  bannerUrl,
  bannerPosition,
  disabled,
  onChange,
  onPositionChange,
  onUploadingChange,
}: {
  bannerUrl: string;
  bannerPosition: ProfileBannerPosition;
  disabled: boolean;
  onChange: (url: string) => void;
  onPositionChange: (position: ProfileBannerPosition) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const upload = useAvatarUpload({
    fallbackErrorMessage: "Could not upload that banner.",
    onUploadStart: () => onUploadingChange(true),
    onUploadSettled: () => onUploadingChange(false),
    onUploadSuccess: onChange,
  });
  const normalizedUrl = normalizeProfileWebsite(bannerUrl);
  const [isAdjusting, setIsAdjusting] = React.useState(false);
  const [draftPosition, setDraftPosition] =
    React.useState<ProfileBannerPosition>(bannerPosition);
  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    position: ProfileBannerPosition;
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    if (!isAdjusting) setDraftPosition(bannerPosition);
  }, [bannerPosition, isAdjusting]);

  const visiblePosition = isAdjusting ? draftPosition : bannerPosition;
  const stopAdjusting = () => {
    dragRef.current = null;
    setDraftPosition(bannerPosition);
    setIsAdjusting(false);
  };
  const clampPercentage = (value: number) =>
    Math.max(0, Math.min(100, Math.round(value)));

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isAdjusting) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      position: draftPosition,
      width: rect.width,
      height: rect.height,
    };
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setDraftPosition({
      x: clampPercentage(
        drag.position.x - ((event.clientX - drag.startX) / drag.width) * 100,
      ),
      y: clampPercentage(
        drag.position.y - ((event.clientY - drag.startY) / drag.height) * 100,
      ),
    });
  };
  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="w-full space-y-2">
      <div
        className={`group relative h-48 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/25 via-muted to-sidebar-active/40 ${isAdjusting ? "cursor-move touch-none" : ""}`}
        data-testid="profile-banner-editor"
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        {normalizedUrl ? (
          <img
            alt="Profile banner"
            className="h-full w-full object-cover"
            draggable={false}
            src={rewriteRelayUrl(normalizedUrl)}
            style={{
              objectPosition: `${visiblePosition.x}% ${visiblePosition.y}%`,
            }}
          />
        ) : null}
        {isAdjusting ? (
          <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur">
            <Move className="h-4 w-4" />
            Drag to reposition
          </div>
        ) : null}
        <div className="absolute inset-0 flex items-start justify-end gap-2 bg-black/0 p-3 transition-colors group-hover:bg-black/15">
          {normalizedUrl && !isAdjusting ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur hover:bg-background"
              data-testid="profile-banner-adjust"
              disabled={disabled || upload.isUploading}
              onClick={() => setIsAdjusting(true)}
              type="button"
            >
              <Move className="h-4 w-4" />
              Adjust
            </button>
          ) : null}
          <button
            className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur hover:bg-background"
            data-testid="profile-banner-upload"
            disabled={disabled || upload.isUploading || isAdjusting}
            onClick={upload.openPicker}
            type="button"
          >
            {upload.isUploading ? (
              <Spinner className="h-4 w-4 border-2" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {normalizedUrl ? "Change banner" : "Add banner"}
          </button>
          {normalizedUrl ? (
            <button
              aria-label="Remove banner"
              className="rounded-full bg-background/90 p-2 text-muted-foreground shadow-sm backdrop-blur hover:bg-background hover:text-foreground"
              data-testid="profile-banner-remove"
              disabled={disabled || upload.isUploading || isAdjusting}
              onClick={() => onChange("")}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      {isAdjusting ? (
        <div
          className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4"
          data-testid="profile-banner-position-controls"
        >
          <BannerPositionSlider
            axis="x"
            label="Horizontal position"
            onChange={setDraftPosition}
            position={draftPosition}
          />
          <BannerPositionSlider
            axis="y"
            label="Vertical position"
            onChange={setDraftPosition}
            position={draftPosition}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              data-testid="profile-banner-position-reset"
              onClick={() => setDraftPosition(DEFAULT_PROFILE_BANNER_POSITION)}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              Center
            </button>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                data-testid="profile-banner-position-cancel"
                onClick={stopAdjusting}
                type="button"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:bg-foreground/90"
                data-testid="profile-banner-position-save"
                disabled={disabled}
                onClick={() => {
                  onPositionChange(draftPosition);
                  setIsAdjusting(false);
                }}
                type="button"
              >
                <Check className="h-4 w-4" />
                Save position
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <input
        accept="image/gif,image/jpeg,image/png,image/webp"
        className="sr-only"
        data-testid="profile-banner-file-input"
        onChange={upload.handleFileChange}
        ref={upload.inputRef}
        type="file"
      />
      {upload.errorMessage ? (
        <p className="text-xs text-destructive">{upload.errorMessage}</p>
      ) : null}
    </div>
  );
}

function BannerPositionSlider({
  axis,
  label,
  onChange,
  position,
}: {
  axis: keyof ProfileBannerPosition;
  label: string;
  onChange: (position: ProfileBannerPosition) => void;
  position: ProfileBannerPosition;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="flex items-center justify-between gap-4">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {position[axis]}%
        </span>
      </span>
      <input
        aria-label={label}
        className="w-full accent-foreground"
        data-testid={`profile-banner-position-${axis}`}
        max="100"
        min="0"
        onChange={(event) =>
          onChange({
            ...position,
            [axis]: Number(event.target.value),
          })
        }
        type="range"
        value={position[axis]}
      />
    </label>
  );
}
