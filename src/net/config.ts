// Multiplayer is strictly opt-in so the deployed single-player game is never
// affected: it activates only when the URL carries ?mp. Examples:
//   ?mp=1                      → connect to ws://localhost:2567 (local dev)
//   ?mp=wss://roonscep.fly.dev → connect to a deployed server
//   &name=Josiah               → set your display name
export interface MpConfig {
  url: string;
  playerId: string;
  name: string;
}

const PID_KEY = 'roonscep-player-id';

function getOrCreatePlayerId(): string {
  try {
    let id = localStorage.getItem(PID_KEY);
    if (!id) {
      id = `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
      localStorage.setItem(PID_KEY, id);
    }
    return id;
  } catch {
    return `p_${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** Returns null in single-player, or the multiplayer connection config. */
export function getMpConfig(): MpConfig | null {
  const params = new URLSearchParams(location.search);
  const mp = params.get('mp');
  if (mp === null) return null;
  const url = !mp || mp === '1' ? 'ws://localhost:2567' : mp;
  return { url, playerId: getOrCreatePlayerId(), name: params.get('name') || 'Adventurer' };
}
