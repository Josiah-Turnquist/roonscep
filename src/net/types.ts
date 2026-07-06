import type { GameState } from '../game/types';

/** Lightweight view of another player, broadcast by the server to everyone. */
export interface PresenceView {
  id: string;
  name: string;
  x: number;
  y: number;
  equipment: GameState['equipment'];
  hp: number;
  maxHpApprox: number;
}
