// Durable per-player storage. The game process is disposable (world resets when
// empty), but player saves must survive — so they live here, behind an interface
// that swaps a local-file dev store for Neon/Supabase Postgres in production.
import { promises as fs } from 'fs';
import path from 'path';
import pg from 'pg';
import { GameState } from '../../src/game/types.ts';

export interface Persistence {
  load(playerId: string): Promise<GameState | null>;
  save(playerId: string, state: GameState): Promise<void>;
}

/** Pick a store from the environment: Postgres (Neon/Supabase) in prod, files in dev. */
export function createPersistence(): Persistence {
  const url = process.env.DATABASE_URL;
  if (url) {
    console.log('[persistence] Postgres');
    return new PostgresPersistence(url);
  }
  console.log('[persistence] local files (set DATABASE_URL to use Postgres)');
  return new FilePersistence();
}

/** Prod store: a single jsonb column per player. Works with Neon/Supabase. */
export class PostgresPersistence implements Persistence {
  private pool: pg.Pool;
  private ready: Promise<void>;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS player_saves (
        player_id  text PRIMARY KEY,
        state      jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  async load(playerId: string): Promise<GameState | null> {
    await this.ready;
    const r = await this.pool.query('SELECT state FROM player_saves WHERE player_id = $1', [playerId]);
    return (r.rows[0]?.state as GameState) ?? null;
  }

  async save(playerId: string, state: GameState): Promise<void> {
    await this.ready;
    await this.pool.query(
      `INSERT INTO player_saves (player_id, state, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (player_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
      [playerId, JSON.stringify(state)],
    );
  }
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
