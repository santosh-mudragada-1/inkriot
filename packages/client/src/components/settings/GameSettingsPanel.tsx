import { motion } from "framer-motion";
import { DRAW_SECONDS_OPTIONS, GAME_MODE_OPTIONS, PLAYERS_OPTIONS, PROMPT_LENGTH_OPTIONS, ROUNDS_OPTIONS } from "@inkriot/shared";
import { useGameStore } from "../../store/useGameStore";
import { socket } from "../../lib/socket";
import { Button } from "../common/Button";
import { IconGameMode, IconPlayers, IconPromptLength, IconRounds, IconStopwatch } from "../icons/DoodleIcons";
import { PlayfulSelect } from "./PlayfulSelect";
import { PaperDoodles } from "./PaperDoodles";
import "./GameSettingsPanel.css";

const PLAYERS_SELECT_OPTIONS = PLAYERS_OPTIONS.map((n) => ({ value: n, label: String(n) }));
const DRAW_SECONDS_SELECT_OPTIONS = DRAW_SECONDS_OPTIONS.map((n) => ({ value: n, label: `${n}s` }));
const ROUNDS_SELECT_OPTIONS = ROUNDS_OPTIONS.map((n) => ({ value: n, label: String(n) }));
const GAME_MODE_SELECT_OPTIONS = GAME_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
const PROMPT_LENGTH_SELECT_OPTIONS = PROMPT_LENGTH_OPTIONS.map((n) => ({ value: n, label: n === 1 ? "1 word" : `up to ${n}` }));

export function GameSettingsPanel() {
  const room = useGameStore((s) => s.room)!;
  const { settings } = room;

  const update = (patch: Partial<typeof settings>) => socket.emit("update_settings", patch);

  return (
    <motion.div
      className="settings-panel"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <PaperDoodles />

      <div className="settings-panel-inner">
        <h2 className="settings-heading">House rules</h2>
        <p className="settings-subheading hand">you're the host — tweak these, then hit start</p>

        <div className="settings-card">
          <PlayfulSelect
            icon={<IconPlayers />}
            accent="var(--color-accent)"
            label="Players"
            value={settings.maxPlayers}
            options={PLAYERS_SELECT_OPTIONS}
            onChange={(v) => update({ maxPlayers: v })}
          />
          <div className="settings-divider" />
          <PlayfulSelect
            icon={<IconStopwatch />}
            accent="var(--color-yellow)"
            label="Draw time"
            value={settings.drawSeconds}
            options={DRAW_SECONDS_SELECT_OPTIONS}
            onChange={(v) => update({ drawSeconds: v })}
          />
          <div className="settings-divider" />
          <PlayfulSelect
            icon={<IconRounds />}
            accent="var(--color-sky)"
            label="Rounds"
            value={settings.totalRounds}
            options={ROUNDS_SELECT_OPTIONS}
            onChange={(v) => update({ totalRounds: v })}
          />
          <div className="settings-divider" />
          <PlayfulSelect
            icon={<IconGameMode />}
            accent="var(--color-pink)"
            label="Difficulty"
            value={settings.gameMode}
            options={GAME_MODE_SELECT_OPTIONS}
            onChange={(v) => update({ gameMode: v })}
          />
          <div className="settings-divider" />
          <PlayfulSelect
            icon={<IconPromptLength />}
            accent="var(--color-mint)"
            label="Prompt length"
            value={settings.maxPromptWords}
            options={PROMPT_LENGTH_SELECT_OPTIONS}
            onChange={(v) => update({ maxPromptWords: v })}
          />
        </div>

        <div className="settings-cta">
          <Button variant="primary" size="lg" display onClick={() => socket.emit("start_game")}>
            {room.players.length < 2 ? "Start solo practice" : "Start the game!"}
          </Button>
          {room.players.length < 2 && <p className="settings-solo hand">it's way more fun with friends — send them the invite link</p>}
        </div>
      </div>
    </motion.div>
  );
}
