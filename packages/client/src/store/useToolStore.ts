import { create } from "zustand";
import type { DrawTool } from "@inkriot/shared";

/** Two rows: brights on top, darks/neutrals/skin tones below. */
export const PALETTE = [
  "#1B1340",
  "#FF5A36",
  "#FF9A3C",
  "#FFC928",
  "#A4E24B",
  "#2FD4A0",
  "#3EA8FF",
  "#7B5CFF",
  "#FF7EC7",
  "#F0364F",
  "#FFFFFF",
  "#8A84AD",
  "#7A4A2B",
  "#C98A5B",
  "#F5C9A4",
  "#1F7A4D",
  "#1C4FA0",
  "#4B2A86",
  "#B8216F",
  "#6B6B6B",
];

/** Brush sizes in reference px (see canvasEngine REFERENCE_WIDTH). */
export const BRUSH_SIZES = [4, 9, 18, 34] as const;

interface ToolState {
  tool: DrawTool;
  color: string;
  size: number;
  setTool: (t: DrawTool) => void;
  setColor: (c: string) => void;
  setSize: (s: number) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  tool: "pencil",
  color: PALETTE[0],
  size: BRUSH_SIZES[1],
  setTool: (tool) => set({ tool }),
  setColor: (color) => set((s) => ({ color, tool: s.tool === "eraser" ? "pencil" : s.tool })),
  setSize: (size) => set({ size }),
}));
