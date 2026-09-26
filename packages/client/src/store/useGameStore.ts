import { create } from "zustand";
import { clearCanvasHistory } from "../lib/canvasHistoryBuffer";
import type { GuessMessage, ReactionEvent, RoomSnapshot, ScorePopup } from "@inkriot/shared";

export interface GalleryItem {
  id: string;
  word: string;
  artistId: string | null;
  image: string;
  guessed: number;
}

interface GameState {
  connected: boolean;
  room: RoomSnapshot | null;
  /** The room this tab is actually in. Snapshots for any other room are stale and dropped. */
  activeCode: string | null;
  selfId: string | null;
  errorMessage: string | null;
  guesses: GuessMessage[];
  scorePopups: ScorePopup[];
  reactions: ReactionEvent[];
  /** This game's finished drawings, captured locally at each round reveal. */
  gallery: GalleryItem[];

  setConnected: (v: boolean) => void;
  setRoom: (room: RoomSnapshot) => void;
  setSelfId: (id: string) => void;
  /** Call when the server confirms a create/join/rejoin; clears anything left from another room. */
  enterRoom: (code: string, playerId: string) => void;
  setError: (message: string | null) => void;
  addGuess: (message: GuessMessage) => void;
  addScorePopup: (popup: ScorePopup) => void;
  removeScorePopup: (id: string) => void;
  addReaction: (reaction: ReactionEvent) => void;
  removeReaction: (id: string) => void;
  addGalleryItem: (item: GalleryItem) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  connected: false,
  room: null,
  activeCode: null,
  selfId: null,
  errorMessage: null,
  guesses: [],
  scorePopups: [],
  reactions: [],
  gallery: [],

  setConnected: (v) => set({ connected: v }),
  setRoom: (room) =>
    set((state) => {
      if (state.activeCode && room.code !== state.activeCode) return state;
      const known = new Set(state.guesses.map((g) => g.id));
      const merged = [...state.guesses, ...room.guesses.filter((g) => !known.has(g.id))];
      if (room.phase === "WORD_SELECTION" && state.room?.phase !== "WORD_SELECTION") {
        // a fresh game (coming from the lobby) also starts a fresh gallery
        return state.room?.phase === "LOBBY" ? { room, guesses: [], gallery: [] } : { room, guesses: [] };
      }
      return { room, guesses: merged.slice(-60) };
    }),
  setSelfId: (id) => set({ selfId: id }),
  enterRoom: (code, playerId) =>
    set((state) => {
      const upper = code.toUpperCase();
      if (state.activeCode === upper && state.room?.code === upper) return { selfId: playerId };
      clearCanvasHistory();
      return { activeCode: upper, selfId: playerId, room: null, guesses: [], scorePopups: [], reactions: [], gallery: [], errorMessage: null };
    }),
  setError: (message) => set({ errorMessage: message }),
  addGuess: (message) =>
    set((state) => (state.guesses.some((g) => g.id === message.id) ? state : { guesses: [...state.guesses, message].slice(-60) })),
  addScorePopup: (popup) => set((state) => ({ scorePopups: [...state.scorePopups, popup] })),
  removeScorePopup: (id) => set((state) => ({ scorePopups: state.scorePopups.filter((p) => p.id !== id) })),
  addReaction: (reaction) => set((state) => ({ reactions: [...state.reactions, reaction] })),
  removeReaction: (id) => set((state) => ({ reactions: state.reactions.filter((r) => r.id !== id) })),
  addGalleryItem: (item) =>
    set((state) => (state.gallery.some((g) => g.id === item.id) ? state : { gallery: [...state.gallery, item].slice(-24) })),
  reset: () => {
    clearCanvasHistory();
    set({ activeCode: null, gallery: [], room: null, guesses: [], scorePopups: [], reactions: [], errorMessage: null });
  },
}));
