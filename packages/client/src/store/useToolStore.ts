import { create } from "zustand";
import type { DrawTool } from "@inkriot/shared";

export const PALETTE = [
  "#11100E",
  "#FFFFFF",
  "#FF4D1A",
  "#FFD23E",
  "#FF6FB0",
  "#4FB2FF",
  "#3ECF6B",
  "#D8FF3E",
  "#8A3EFF",
  "#3EFFD8",
  "#E5304A",
  "#FFB23E",
  "#7A5230",
  "#FF8FD8",
];

interface ToolState {
  tool: DrawTool;
  color: string;
  setTool: (t: DrawTool) => void;
  setColor: (c: string) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  tool: "pencil",
  color: PALETTE[0],
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
}));
