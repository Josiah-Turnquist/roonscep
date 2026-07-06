// Account identity for multiplayer. Locally this is a trust-based username claim
// (no password) — enough to prove "sign up → persistent character → resume
// anywhere" end-to-end without any hosted service. In production this same seam
// is filled by Neon Auth: the client obtains a verified user id/token, the
// server validates it, and that id becomes the persistence key. Only the
// acquisition changes; everything downstream (server keys saves by this id) is
// already in place.
const KEY = 'roonscep-account';

export interface Account {
  /** Stable persistence key — the server saves/loads this player's character by it. */
  username: string;
  /** Display name shown to other players. */
  name: string;
}

export function getAccount(): Account | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

export function signIn(username: string, name: string): Account {
  const uname = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24);
  const account: Account = { username: uname, name: (name.trim() || username.trim()).slice(0, 24) };
  try {
    localStorage.setItem(KEY, JSON.stringify(account));
  } catch {
    /* storage unavailable — session-only */
  }
  return account;
}

export function signOut(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
