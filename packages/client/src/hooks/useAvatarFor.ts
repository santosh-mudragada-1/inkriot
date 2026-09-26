import { useProfile } from "../lib/profile";
import { encodeAvatar } from "../lib/avatar";
import { useGameStore } from "../store/useGameStore";

/**
 * Returns a function that gives a player's avatar string. For yourself it always
 * reads the live local profile (not the server's last snapshot of you), so your
 * avatar in a lobby/game can never lag behind an edit — the server round-trip is
 * correct today, but this makes it structurally impossible for the two to drift.
 */
export function useAvatarFor() {
  const selfId = useGameStore((s) => s.selfId);
  const myAvatar = useProfile((s) => s.avatar);
  return (player: { id: string; avatar: string }) => (player.id === selfId ? encodeAvatar(myAvatar) : player.avatar);
}
