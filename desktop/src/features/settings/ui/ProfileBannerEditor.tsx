import { ImagePlus, Trash2 } from "lucide-react";

import { normalizeProfileWebsite } from "@/features/profile/lib/profileWebsite";
import { useAvatarUpload } from "@/features/profile/useAvatarUpload";
import { rewriteRelayUrl } from "@/shared/lib/mediaUrl";
import { Spinner } from "@/shared/ui/spinner";

export function ProfileBannerEditor({
  bannerUrl,
  disabled,
  onChange,
  onUploadingChange,
}: {
  bannerUrl: string;
  disabled: boolean;
  onChange: (url: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const upload = useAvatarUpload({
    fallbackErrorMessage: "Could not upload that banner.",
    onUploadStart: () => onUploadingChange(true),
    onUploadSettled: () => onUploadingChange(false),
    onUploadSuccess: onChange,
  });
  const normalizedUrl = normalizeProfileWebsite(bannerUrl);

  return (
    <div className="w-full max-w-[576px] space-y-2">
      <div
        className="group relative h-48 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/25 via-muted to-sidebar-active/40"
        data-testid="profile-banner-editor"
      >
        {normalizedUrl ? (
          <img
            alt="Profile banner"
            className="h-full w-full object-cover"
            src={rewriteRelayUrl(normalizedUrl)}
          />
        ) : null}
        <div className="absolute inset-0 flex items-start justify-end gap-2 bg-black/0 p-3 transition-colors group-hover:bg-black/15">
          <button
            className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur hover:bg-background"
            data-testid="profile-banner-upload"
            disabled={disabled || upload.isUploading}
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
              disabled={disabled || upload.isUploading}
              onClick={() => onChange("")}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
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
