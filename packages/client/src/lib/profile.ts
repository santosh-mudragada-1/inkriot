import { create } from "zustand";
import { encodeAvatar, loadAvatar, saveAvatar, type AvatarConfig } from "./avatar";
import { loadNickname, saveNickname } from "./session";

interface ProfileStore {
  nickname: string;
  avatar: AvatarConfig;
  setNickname: (n: string) => void;
  setAvatar: (a: AvatarConfig) => void;
  /** Encoded avatar for sending to the server. */
  encoded: () => string;
}

export const useProfile = create<ProfileStore>((set, get) => ({
  nickname: loadNickname(),
  avatar: loadAvatar(),
  setNickname: (nickname) => {
    set({ nickname });
    saveNickname(nickname.trim());
  },
  setAvatar: (avatar) => {
    set({ avatar });
    saveAvatar(avatar);
  },
  encoded: () => encodeAvatar(get().avatar),
}));
