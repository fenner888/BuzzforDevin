import { Check, Pencil, Plus, Trash2 } from "lucide-react";

import { PROFILE_LINK_KINDS } from "@/features/profile/lib/profileLinks";
import { cn } from "@/shared/lib/cn";
import type { ProfileLink, ProfileLinkKind } from "@/shared/api/types";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

type ProfileMetadataEditorProps = {
  about: string;
  disabled: boolean;
  displayName: string;
  isEditing: boolean;
  onAboutChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onEdit: () => void;
  onSocialLinksChange: (links: ProfileLink[]) => void;
  onWebsiteChange: (value: string) => void;
  socialLinks: ProfileLink[];
  socialLinksError: string | null;
  website: string;
  websiteError: string | null;
};

function EditButton({
  disabled,
  isEditing,
  onClick,
}: Pick<ProfileMetadataEditorProps, "disabled" | "isEditing"> & {
  onClick: () => void;
}) {
  const Icon = isEditing ? Check : Pencil;
  const action = isEditing ? "Done" : "Edit";
  return (
    <button
      aria-label={`${action} editing profile info`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        isEditing
          ? "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/90"
          : "border-transparent bg-muted text-foreground hover:bg-muted/80",
      )}
      data-testid="profile-metadata-edit"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {action}
    </button>
  );
}

function ReadValue({ value, testId }: { value: string; testId: string }) {
  return (
    <p
      className={cn(
        "min-w-0 break-words text-sm",
        value ? "text-muted-foreground" : "text-muted-foreground/55",
      )}
      data-testid={testId}
      title={value || "Not set"}
    >
      {value || "Not set"}
    </p>
  );
}

export function ProfileMetadataEditor({
  about,
  disabled,
  displayName,
  isEditing,
  onAboutChange,
  onDisplayNameChange,
  onEdit,
  onSocialLinksChange,
  onWebsiteChange,
  socialLinks,
  socialLinksError,
  website,
  websiteError,
}: ProfileMetadataEditorProps) {
  const setSocialLink = (
    kind: Exclude<ProfileLinkKind, "custom">,
    label: string,
    url: string,
  ) => {
    const next = socialLinks.filter((link) => link.kind !== kind);
    if (url.trim()) next.push({ kind, label, url });
    onSocialLinksChange(next);
  };
  const customLinks = socialLinks.filter((link) => link.kind === "custom");

  return (
    <div
      className="overflow-hidden rounded-xl border border-border/70 bg-background/70 shadow-xs divide-y divide-border/55"
      data-testid="profile-metadata-card"
    >
      <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
        <h2 className="text-lg font-semibold tracking-tight">Profile info</h2>
        <EditButton
          disabled={disabled}
          isEditing={isEditing}
          onClick={onEdit}
        />
      </div>

      <MetadataRow label="Display name">
        {isEditing ? (
          <Input
            aria-label="Display name"
            autoFocus
            className="h-auto border-0 bg-transparent px-0 py-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
            data-testid="profile-display-name"
            disabled={disabled}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Display name"
            value={displayName}
          />
        ) : (
          <ReadValue testId="profile-display-name-value" value={displayName} />
        )}
      </MetadataRow>

      <MetadataRow label="Profile description">
        {isEditing ? (
          <Textarea
            aria-label="Profile description"
            className="min-h-[72px] resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 text-muted-foreground shadow-none focus-visible:ring-0"
            data-testid="profile-about"
            disabled={disabled}
            onChange={(event) => onAboutChange(event.target.value)}
            placeholder="What should people know about you?"
            value={about}
          />
        ) : (
          <ReadValue testId="profile-about-value" value={about} />
        )}
      </MetadataRow>

      <MetadataRow label="Website">
        {isEditing ? (
          <ProfileUrlInput
            disabled={disabled}
            error={websiteError}
            id="profile-website"
            onChange={onWebsiteChange}
            placeholder="your-site.com"
            value={website}
          />
        ) : (
          <ReadValue testId="profile-website-value" value={website} />
        )}
      </MetadataRow>

      <div className="space-y-3 px-4 py-4">
        <div>
          <p className="text-sm font-medium">Social links</p>
          <p className="text-xs text-muted-foreground">
            Add destinations people can open from your profile.
          </p>
        </div>
        {isEditing ? (
          <div className="space-y-3">
            {PROFILE_LINK_KINDS.map((item) => (
              <ProfileUrlInput
                disabled={disabled}
                error={null}
                id={`profile-social-${item.kind}`}
                key={item.kind}
                label={item.label}
                onChange={(value) =>
                  setSocialLink(item.kind, item.label, value)
                }
                placeholder={item.placeholder}
                value={
                  socialLinks.find((link) => link.kind === item.kind)?.url ?? ""
                }
              />
            ))}
            {customLinks.map((link, index) => (
              <div
                className="grid grid-cols-[1fr_2fr_auto] gap-2"
                // Controlled draft rows only append/remove; the index keeps a
                // newly added blank row stable until it has a URL.
                // biome-ignore lint/suspicious/noArrayIndexKey: no persisted id exists before save
                key={index}
              >
                <Input
                  aria-label={`Custom link ${index + 1} label`}
                  disabled={disabled}
                  onChange={(event) => {
                    const next = [...socialLinks];
                    const target = next.indexOf(link);
                    next[target] = { ...link, label: event.target.value };
                    onSocialLinksChange(next);
                  }}
                  placeholder="Label"
                  value={link.label}
                />
                <Input
                  aria-label={`Custom link ${index + 1} URL`}
                  disabled={disabled}
                  inputMode="url"
                  onChange={(event) => {
                    const next = [...socialLinks];
                    const target = next.indexOf(link);
                    next[target] = { ...link, url: event.target.value };
                    onSocialLinksChange(next);
                  }}
                  placeholder="https://example.com"
                  value={link.url}
                />
                <button
                  aria-label={`Remove custom link ${index + 1}`}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  disabled={disabled}
                  onClick={() =>
                    onSocialLinksChange(
                      socialLinks.filter((candidate) => candidate !== link),
                    )
                  }
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {customLinks.length < 5 ? (
              <button
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                disabled={disabled}
                onClick={() =>
                  onSocialLinksChange([
                    ...socialLinks,
                    { kind: "custom", label: "", url: "" },
                  ])
                }
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add custom link
              </button>
            ) : null}
            {socialLinksError ? (
              <p
                className="text-xs text-destructive"
                data-testid="profile-social-error"
              >
                {socialLinksError}
              </p>
            ) : null}
          </div>
        ) : socialLinks.length > 0 ? (
          <div className="space-y-1">
            {socialLinks.map((link) => (
              <ReadValue
                key={`${link.kind}-${link.url}`}
                testId={`profile-social-${link.kind}-value`}
                value={`${link.label}: ${link.url}`}
              />
            ))}
          </div>
        ) : (
          <ReadValue testId="profile-social-links-value" value="" />
        )}
      </div>
    </div>
  );
}

function MetadataRow({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex min-h-16 items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {children}
      </div>
    </div>
  );
}

function ProfileUrlInput({
  disabled,
  error,
  id,
  label,
  onChange,
  placeholder,
  value,
}: {
  disabled: boolean;
  error: string | null;
  id: string;
  label?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      {label ? (
        <label className="text-xs font-medium" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <Input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        aria-label={label ?? (id === "profile-website" ? "Website" : undefined)}
        data-testid={id}
        disabled={disabled}
        id={id}
        inputMode="url"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {error ? (
        <p className="text-xs text-destructive" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
