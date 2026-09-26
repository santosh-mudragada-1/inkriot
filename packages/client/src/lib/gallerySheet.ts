import type { Player } from "@inkriot/shared";
import type { GalleryItem } from "../store/useGameStore";

/**
 * Composes every drawing from a game into one "memory sheet" image — graph paper,
 * taped-down polaroids with the word + artist, and the final podium — so the whole
 * night can be saved or shared as a single picture.
 */

const INK = "#1b1340";
const PAPER = "#cfe6ff";
const CARD = "#fffdf7";
const TAPE = ["#ffc928", "#ff7ec7", "#2fd4a0", "#3ea8ff", "#ff5a36", "#7b5cff"];
const DISPLAY = '"Bagel Fat One", "Arial Rounded MT Bold", system-ui, sans-serif';
const HAND = '"Gochi Hand", "Comic Sans MS", cursive';
const UI = '"Nunito", ui-rounded, system-ui, sans-serif';

const WIDTH = 1600;
const PAD = 70;
const GAP = 46;

interface SheetMeta {
  roomCode: string;
  players: Player[];
  siteUrl: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load(`64px ${DISPLAY}`),
      document.fonts.load(`32px ${HAND}`),
      document.fonts.load(`900 24px ${UI}`),
    ]);
  } catch {
    /* fall back to whatever's available */
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

export async function renderGallerySheet(gallery: GalleryItem[], meta: SheetMeta): Promise<Blob> {
  await ensureFonts();
  const images = await Promise.all(gallery.map((g) => loadImage(g.image)));

  const n = gallery.length;
  const cols = n <= 3 ? n : n === 4 ? 2 : n <= 9 ? 3 : 4;
  const cardW = Math.floor((WIDTH - PAD * 2 - GAP * (cols - 1)) / cols);
  const imgW = cardW - 32;
  const aspect = images[0] ? images[0].height / images[0].width : 0.66;
  const imgH = Math.round(imgW * aspect);
  const cardH = imgH + 32 + (cols >= 4 ? 70 : 84);
  const rows = Math.ceil(gallery.length / cols);

  const headerH = 250;
  const footerH = 110;
  const height = headerH + rows * cardH + (rows - 1) * GAP + footerH + PAD;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // graph paper
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.strokeStyle = "rgba(27, 19, 64, 0.08)";
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= WIDTH; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // header: logo sticker + subtitle
  ctx.save();
  ctx.translate(PAD, 60);
  ctx.rotate(-0.03);
  ctx.font = `96px ${DISPLAY}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = 14;
  ctx.strokeStyle = INK;
  ctx.fillStyle = "#ff5a36";
  ctx.textBaseline = "top";
  ctx.strokeText("INKRIOT", 0, 0);
  ctx.fillText("INKRIOT", 0, 0);
  ctx.restore();

  const date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  ctx.fillStyle = INK;
  ctx.font = `38px ${HAND}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`our masterpieces · room ${meta.roomCode} · ${date}`, PAD + 4, 205);

  // podium, top-right
  const medals = ["🥇", "🥈", "🥉"];
  const top = [...meta.players].sort((a, b) => b.score - a.score).slice(0, 3);
  ctx.textAlign = "right";
  top.forEach((p, i) => {
    ctx.font = `900 ${i === 0 ? 34 : 28}px ${UI}`;
    ctx.fillStyle = INK;
    ctx.fillText(fitText(ctx, `${medals[i]} ${p.name} — ${p.score}`, 520), WIDTH - PAD, 88 + i * 44);
  });
  ctx.textAlign = "left";

  // polaroids
  gallery.forEach((g, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PAD + col * (cardW + GAP);
    const y = headerH + row * (cardH + GAP);
    const tilt = [-0.025, 0.018, -0.012, 0.03][i % 4];
    ctx.save();
    ctx.translate(x + cardW / 2, y + cardH / 2);
    ctx.rotate(tilt);
    ctx.translate(-cardW / 2, -cardH / 2);

    // hard sticker shadow + card
    ctx.fillStyle = INK;
    roundRect(ctx, 9, 10, cardW, cardH, 22);
    ctx.fill();
    ctx.fillStyle = CARD;
    roundRect(ctx, 0, 0, cardW, cardH, 22);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // drawing
    ctx.drawImage(images[i], 16, 16, imgW, imgH);
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, imgW, imgH);

    // caption
    const captionY = 16 + imgH + (cols >= 4 ? 40 : 48);
    ctx.fillStyle = INK;
    ctx.font = `${cols >= 4 ? 28 : 34}px ${DISPLAY}`;
    ctx.fillText(fitText(ctx, g.word.toUpperCase(), imgW), 18, captionY);
    const artist = meta.players.find((p) => p.id === g.artistId)?.name ?? "someone";
    ctx.font = `${cols >= 4 ? 22 : 26}px ${HAND}`;
    ctx.fillStyle = "#4a4270";
    ctx.fillText(fitText(ctx, `by ${artist} · ${g.guessed} got it`, imgW), 18, captionY + (cols >= 4 ? 28 : 34));

    // washi tape
    ctx.save();
    ctx.translate(cardW / 2, 0);
    ctx.rotate(i % 2 ? 0.08 : -0.06);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = TAPE[i % TAPE.length];
    ctx.fillRect(-60, -16, 120, 32);
    ctx.restore();

    ctx.restore();
  });

  // footer
  ctx.fillStyle = INK;
  ctx.font = `34px ${HAND}`;
  ctx.textAlign = "center";
  ctx.fillText(`draw with us → ${meta.siteUrl.replace(/^https?:\/\//, "")}`, WIDTH / 2, height - PAD + 10);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create image"))), "image/png"),
  );
}

export function sheetFileName(roomCode: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `inkriot-${roomCode.toLowerCase()}-${stamp}.png`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Uses the native share sheet with the image attached where supported. Returns false if unsupported. */
export async function shareBlob(blob: Blob, filename: string, text: string): Promise<boolean> {
  const file = new File([blob], filename, { type: blob.type });
  if (!navigator.canShare?.({ files: [file] })) return false;
  await navigator.share({ files: [file], title: "INKRIOT memories", text });
  return true;
}
