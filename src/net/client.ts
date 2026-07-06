// Thin wrapper over colyseus.js: connect to the authoritative room and expose
// the three things the client needs — receive authoritative state, receive
// presence (other players), and send intents.
import { Client } from 'colyseus.js';
import type { Action } from '../game/engine';
import type { GameState } from '../game/types';
import type { PresenceView } from './types';

export interface NetClient {
  onState(cb: (s: GameState) => void): void;
  onPresence(cb: (views: PresenceView[]) => void): void;
  sendIntent(action: Action): void;
  leave(): void;
}

export async function connect(
  url: string,
  opts: { playerId: string; name: string },
): Promise<NetClient> {
  const client = new Client(url);
  const room = await client.joinOrCreate('roonscep', opts);
  return {
    onState: (cb) => room.onMessage('state', cb),
    onPresence: (cb) => room.onMessage('presence', cb),
    sendIntent: (action) => room.send('intent', action),
    leave: () => {
      room.leave();
    },
  };
}
