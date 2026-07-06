// Multiplayer is strictly opt-in so the deployed single-player game is never
// affected: it activates only when the URL carries ?mp. Examples:
//   ?mp=1                      → connect to ws://localhost:2567 (local dev)
//   ?mp=wss://roonscep.fly.dev → connect to a deployed server
// Player identity comes from auth (the signed-in account), not from here.
export interface MpConfig {
  url: string;
  playerId: string;
  name: string;
}

/** The multiplayer server URL if ?mp is present, else null (single-player). */
export function getMpServerUrl(): string | null {
  const params = new URLSearchParams(location.search);
  const mp = params.get('mp');
  if (mp === null) return null;
  return !mp || mp === '1' ? 'ws://localhost:2567' : mp;
}
