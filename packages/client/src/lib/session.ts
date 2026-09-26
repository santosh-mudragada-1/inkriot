interface StoredSession {
  code: string;
  sessionId: string;
  playerId: string;
  nickname: string;
}

const KEY = "inkriot:session";

export function saveSession(session: StoredSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* private mode / storage disabled — session just won't survive a refresh */
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function saveNickname(nickname: string) {
  try {
    localStorage.setItem("inkriot:nickname", nickname);
  } catch {
    /* ignore */
  }
}

export function loadNickname(): string {
  try {
    return localStorage.getItem("inkriot:nickname") ?? "";
  } catch {
    return "";
  }
}
