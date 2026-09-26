import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Player } from "@inkriot/shared";
import type { GalleryItem } from "../../store/useGameStore";
import { downloadBlob, renderGallerySheet, shareBlob, sheetFileName } from "../../lib/gallerySheet";
import { audio } from "../../lib/audio/AudioManager";
import { Button } from "../common/Button";
import "./MemorySheet.css";

interface Props {
  gallery: GalleryItem[];
  players: Player[];
  roomCode: string;
}

/** "Save the night" — builds one image of every drawing, previews it, and offers download/share. */
export function MemorySheet({ gallery, players, roomCode }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const canShareFiles = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const build = async () => {
    if (blobRef.current) return blobRef.current;
    const blob = await renderGallerySheet(gallery, { roomCode, players, siteUrl: window.location.origin });
    blobRef.current = blob;
    setPreview(URL.createObjectURL(blob));
    return blob;
  };

  const openSheet = async () => {
    setOpen(true);
    setError(null);
    if (blobRef.current) return;
    setBusy(true);
    try {
      await build();
      audio.playPop(1.2);
    } catch {
      setError("Couldn't put the sheet together — try again?");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const blob = await build();
    downloadBlob(blob, sheetFileName(roomCode));
  };

  const share = async () => {
    const blob = await build();
    try {
      const shared = await shareBlob(blob, sheetFileName(roomCode), `Our INKRIOT drawings from tonight 🎨 ${window.location.origin}`);
      if (!shared) downloadBlob(blob, sheetFileName(roomCode));
    } catch {
      /* share sheet dismissed */
    }
  };

  return (
    <>
      <Button variant="grape" onClick={openSheet} className="memory-sheet-btn">
        📸 Save all drawings as one image
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div className="memory-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div
              className="memory-modal"
              role="dialog"
              aria-label="Memory sheet"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 60, rotate: 3, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, rotate: -0.6, scale: 1, opacity: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="memory-head">
                <h2>Tonight's memory sheet</h2>
                <button type="button" className="memory-close" onClick={() => setOpen(false)} aria-label="Close">
                  ✕
                </button>
              </div>
              <div className="memory-preview">
                {busy && (
                  <div className="memory-loading">
                    <motion.span animate={{ rotate: [0, -15, 15, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                      ✂️
                    </motion.span>
                    <span className="hand">taping the drawings down…</span>
                  </div>
                )}
                {error && <p className="memory-error">{error}</p>}
                {preview && <img src={preview} alt={`All ${gallery.length} drawings from room ${roomCode}`} />}
              </div>
              <div className="memory-actions">
                <Button variant="primary" onClick={download} disabled={busy || !!error}>
                  ⬇ Download image
                </Button>
                {canShareFiles && (
                  <Button variant="accent2" onClick={share} disabled={busy || !!error}>
                    Share with friends
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
