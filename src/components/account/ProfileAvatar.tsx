import type { ReactNode } from "react";
import { profileAvatars } from "../../config/profileAvatars";

export function ProfileAvatar({ avatarId, children }: { avatarId?: string | null; children: ReactNode }) {
  const avatar = profileAvatars.find(({ id }) => id === avatarId);
  return avatar ? <img alt="" src={avatar.image} className="h-full w-full rounded-[inherit] object-cover" /> : children;
}
