import type { ChannelRole } from "@/shared/api/types";

const ROLE_LABELS: Record<ChannelRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  guest: "Guest",
  bot: "Bot",
};

export function formatChannelRole(role: ChannelRole): string {
  return ROLE_LABELS[role];
}
