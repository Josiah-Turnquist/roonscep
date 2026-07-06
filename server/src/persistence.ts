// Durable per-player storage. The game process is disposable (world resets when
// empty), but player saves must survive — so they live here, behind an interface
// that swaps a local-file dev store for Neon/Supabase Postgres in production.
import { promises as fs } from 'fs';
import path from 'path';
import { GameState } from '../../src/game/types.ts';

export interface Persistence {
  load(playerId: string): Promise<GameState | null>;
  save(playerId: string, state: GameState): Promise<void>;
}

/** Dev store: one JSON file per player under ./saves. */
export class FilePersistence implements Persistence {
  constructor(private dir = path.resolve('saves')) {}

  private file(id: string): string {
    // keep ids filesystem-safe
    const safe = id.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.dir, `${safe}.json`);
  }

  async load(playerId: string): Promise<GameState | null> {
    try {
      const raw = await fs.readFile(this.file(playerId), 'utf8');
      return JSON.parse(raw) as GameState;
    } catch {
      return null;
    }
  }

  async save(playerId: string, state: GameState): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.file(playerId), JSON.stringify(state));
  }
}
