import { useState, type FormEvent } from "react";
import { socket } from "../../lib/socket";
import { MAX_GUESS_LENGTH } from "@inkriot/shared";
import "./GuessInput.css";

export function GuessInput({ disabled, placeholder }: { disabled: boolean; placeholder: string }) {
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    socket.emit("submit_guess", text);
    setValue("");
  };

  return (
    <form className="guess-input-row" onSubmit={submit}>
      <input
        className="guess-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_GUESS_LENGTH}
        disabled={disabled}
        autoComplete="off"
      />
    </form>
  );
}
