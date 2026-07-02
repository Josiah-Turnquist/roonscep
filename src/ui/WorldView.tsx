import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useGame } from '../state/store';
import {
  LAIR_BY_CHAR, MAP_H, MAP_W, NPCS, NpcDef, RESOURCE_BY_CHAR, STATION_BY_CHAR, StationType,
  isWalkable, tileAt, zoneName,
} from '../game/world';
import { MONSTER_MAP } from '../game/monsters';
import { GATHER_MAP } from '../game/actions';
import { GameState } from '../game/types';
import { NpcDialog, StationDialog } from './Dialogs';
import FightView from './FightView';

const TILE = 28;
const VIEW_W = 25;
const VIEW_H = 15;

const TERRAIN_COLOR: Record<string, string> = {
  '.': '#3f6b2e', ',': '#8a7a54', ':': '#6b5f4d', _: '#44503a', '*': '#c6d3d8',
  '%': '#53271e', '!': '#221833', '~': '#2b5d8a', '#': '#3b332a', '=': '#7a5c3e',
};

const RESOURCE_EMOJI: Record<string, string> = {
  T: '🌳', O: '🌳', W: '🌳', P: '🍁', Y: '🌲', G: '🎄',
  '1': '🪨', '2': '🪨', '3': '🪨', '4': '🪨', '5': '🪨', '6': '🪨', '7': '🪨',
  f: '🐟', g: '🐟', j: '🐟', l: '🦞', w: '🐠', x: '🦈',
  b: '🫐', z: '🌾', q: '🌿', d: '☘️', e: '🍀', n: '🥀', o: '🍎', v: '🍄',
  U: '🔥', A: '⚒️', R: '🍲',
  K: '☠️', E: '🌋', F: '🐲', X: '👑', V: '🌑', N: '👁️',
};

const TIER_DOT: Record<string, string> = {
  O: '#e8b64c', W: '#9ad0ff', P: '#e07b39', Y: '#2e7d32', G: '#b48ee0',
  '1': '#e07b39', '2': '#e6e6e6', '3': '#8a5a3b', '4': '#222222', '5': '#5a79d6', '6': '#4f9e3c', '7': '#59d1e0',
};

function camera(s: GameState): [number, number] {
  const camX = Math.max(0, Math.min(s.world.px - Math.floor(VIEW_W / 2), MAP_W - VIEW_W));
  const camY = Math.max(0, Math.min(s.world.py - Math.floor(VIEW_H / 2), MAP_H - VIEW_H));
  return [camX, camY];
}

/** BFS from (sx,sy) to the nearest tile satisfying isGoal; returns step deltas. */
function findPath(
  sx: number,
  sy: number,
  isGoal: (x: number, y: number) => boolean,
): [number, number][] | null {
  if (isGoal(sx, sy)) return [];
  const key = (x: number, y: number) => y * MAP_W + x;
  const prev = new Map<number, number>();
  const seen = new Set([key(sx, sy)]);
  const queue: [number, number][] = [[sx, sy]];
  const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let goal: [number, number] | null = null;
  for (let qi = 0; qi < queue.length && qi < 4000 && !goal; qi++) {
    const [cx, cy] = queue[qi];
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (seen.has(key(nx, ny)) || !isWalkable(nx, ny)) continue;
      seen.add(key(nx, ny));
      prev.set(key(nx, ny), key(cx, cy));
      if (isGoal(nx, ny)) {
        goal = [nx, ny];
        break;
      }
      queue.push([nx, ny]);
    }
  }
  if (!goal) return null;
  // Walk back through prev to build the step list
  const tiles: [number, number][] = [];
  let cur = key(goal[0], goal[1]);
  const start = key(sx, sy);
  while (cur !== start) {
    tiles.unshift([cur % MAP_W, Math.floor(cur / MAP_W)]);
    cur = prev.get(cur)!;
  }
  const steps: [number, number][] = [];
  let [lx, ly] = [sx, sy];
  for (const [tx, ty] of tiles) {
    steps.push([tx - lx, ty - ly]);
    [lx, ly] = [tx, ty];
  }
  return steps;
}

export type DialogState =
  | { kind: 'npc'; npcId: string }
  | { kind: 'station'; station: StationType }
  | null;

export default function WorldView() {
  const s = useGame();
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(s);
  stateRef.current = s;
  const pathRef = useRef<[number, number][]>([]);
  const pendingRef = useRef<(() => void) | null>(null);
  const walkTimer = useRef<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const stopWalking = useCallback(() => {
    pathRef.current = [];
    pendingRef.current = null;
    if (walkTimer.current !== null) {
      window.clearInterval(walkTimer.current);
      walkTimer.current = null;
    }
  }, []);

  const startWalking = useCallback(
    (steps: [number, number][], onArrive: (() => void) | null) => {
      stopWalking();
      pathRef.current = steps;
      pendingRef.current = onArrive;
      if (steps.length === 0) {
        onArrive?.();
        pendingRef.current = null;
        return;
      }
      walkTimer.current = window.setInterval(() => {
        const step = pathRef.current.shift();
        if (step) dispatch({ type: 'MOVE_STEP', dx: step[0], dy: step[1] });
        if (pathRef.current.length === 0) {
          const act = pendingRef.current;
          stopWalking();
          act?.();
        }
      }, 140);
    },
    [dispatch, stopWalking],
  );

  // Click-to-act
  const onCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const st = stateRef.current;
      if (st.activity?.type === 'combat') return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const [camX, camY] = camera(st);
      const tx = camX + Math.floor(((e.clientX - rect.left) / rect.width) * VIEW_W);
      const ty = camY + Math.floor(((e.clientY - rect.top) / rect.height) * VIEW_H);
      const adj = (x: number, y: number) => (gx: number, gy: number) =>
        Math.max(Math.abs(gx - x), Math.abs(gy - y)) <= 1 && isWalkable(gx, gy);
      const goTo = (x: number, y: number, act: (() => void) | null) => {
        const path = findPath(st.world.px, st.world.py, adj(x, y));
        if (path) startWalking(path, act);
      };

      const ent = st.world.entities.find((en) => en.respawn === 0 && en.x === tx && en.y === ty);
      if (ent) {
        goTo(tx, ty, () => dispatch({ type: 'START_COMBAT_ENTITY', uid: ent.uid }));
        return;
      }
      const npc = NPCS.find((n) => n.x === tx && n.y === ty);
      if (npc) {
        goTo(tx, ty, () => setDialog({ kind: 'npc', npcId: npc.id }));
        return;
      }
      const char = tileAt(tx, ty);
      if (RESOURCE_BY_CHAR[char]) {
        goTo(tx, ty, () => dispatch({ type: 'START_GATHER_NODE', x: tx, y: ty }));
        return;
      }
      const station = STATION_BY_CHAR[char];
      if (station) {
        goTo(tx, ty, () => setDialog({ kind: 'station', station }));
        return;
      }
      const bossId = LAIR_BY_CHAR[char];
      if (bossId) {
        goTo(tx, ty, () => dispatch({ type: 'START_COMBAT', id: bossId }));
        return;
      }
      if (isWalkable(tx, ty)) {
        const path = findPath(st.world.px, st.world.py, (gx, gy) => gx === tx && gy === ty);
        if (path) startWalking(path, null);
      }
    },
    [dispatch, startWalking],
  );

  // Keyboard movement
  useEffect(() => {
    const KEYS: Record<string, [number, number]> = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
    };
    const held = { dir: null as [number, number] | null, timer: null as number | null };
    const step = () => {
      if (held.dir) dispatch({ type: 'MOVE_STEP', dx: held.dir[0], dy: held.dir[1] });
    };
    const down = (e: KeyboardEvent) => {
      const dir = KEYS[e.key];
      if (!dir) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      e.preventDefault();
      stopWalking();
      if (held.dir && held.dir[0] === dir[0] && held.dir[1] === dir[1]) return;
      held.dir = dir;
      step();
      if (held.timer === null) held.timer = window.setInterval(step, 150);
    };
    const up = (e: KeyboardEvent) => {
      if (KEYS[e.key]) {
        held.dir = null;
        if (held.timer !== null) {
          window.clearInterval(held.timer);
          held.timer = null;
        }
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      if (held.timer !== null) window.clearInterval(held.timer);
    };
  }, [dispatch, stopWalking]);

  // Render
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const [camX, camY] = camera(s);
    ctx.clearRect(0, 0, VIEW_W * TILE, VIEW_H * TILE);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let vy = 0; vy < VIEW_H; vy++) {
      for (let vx = 0; vx < VIEW_W; vx++) {
        const x = camX + vx;
        const y = camY + vy;
        const char = tileAt(x, y);
        const base = TERRAIN_COLOR[char] ?? TERRAIN_COLOR[terrainUnder(x, y)] ?? '#3f6b2e';
        ctx.fillStyle = base;
        ctx.fillRect(vx * TILE, vy * TILE, TILE, TILE);
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.fillRect(vx * TILE, vy * TILE, TILE, TILE);
        }
        const emoji = RESOURCE_EMOJI[char];
        if (emoji) {
          const nodeKey = `${x},${y}`;
          if (s.world.nodeRespawn[nodeKey]) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.arc(vx * TILE + TILE / 2, vy * TILE + TILE / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            if (LAIR_BY_CHAR[char]) {
              ctx.fillStyle = 'rgba(0,0,0,0.45)';
              ctx.beginPath();
              ctx.arc(vx * TILE + TILE / 2, vy * TILE + TILE / 2, TILE / 2 - 2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.font = '18px serif';
            ctx.fillText(emoji, vx * TILE + TILE / 2, vy * TILE + TILE / 2 + 1);
            const dot = TIER_DOT[char];
            if (dot) {
              ctx.fillStyle = dot;
              ctx.beginPath();
              ctx.arc(vx * TILE + TILE - 5, vy * TILE + 5, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }
    // NPCs
    ctx.font = '18px serif';
    for (const n of NPCS) {
      if (n.x < camX || n.x >= camX + VIEW_W || n.y < camY || n.y >= camY + VIEW_H) continue;
      ctx.fillText(n.icon, (n.x - camX) * TILE + TILE / 2, (n.y - camY) * TILE + TILE / 2 + 1);
      if (n.kind === 'quest') {
        ctx.fillStyle = '#e8b64c';
        ctx.font = 'bold 11px serif';
        ctx.fillText('!', (n.x - camX) * TILE + TILE - 5, (n.y - camY) * TILE + 6);
        ctx.font = '18px serif';
      }
    }
    // Monsters
    const fightingUid = s.activity?.type === 'combat' ? s.activity.entityUid : undefined;
    for (const en of s.world.entities) {
      if (en.respawn > 0) continue;
      if (en.x < camX || en.x >= camX + VIEW_W || en.y < camY || en.y >= camY + VIEW_H) continue;
      const def = MONSTER_MAP[en.defId];
      const cx = (en.x - camX) * TILE + TILE / 2;
      const cy = (en.y - camY) * TILE + TILE / 2;
      if (en.uid === fightingUid || s.slayerTask?.monsterId === en.defId) {
        ctx.strokeStyle = en.uid === fightingUid ? '#d9534f' : '#b48ee0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, TILE / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillText(def.icon, cx, cy + 1);
    }
    // Player
    const pcx = (s.world.px - camX) * TILE + TILE / 2;
    const pcy = (s.world.py - camY) * TILE + TILE / 2;
    ctx.strokeStyle = '#e8dcc0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pcx, pcy, TILE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '19px serif';
    ctx.fillText(s.stunnedTicks > 0 ? '💫' : '🧙', pcx, pcy + 1);
  }, [s]);

  const activityLabel = (() => {
    if (!s.activity) return null;
    if (s.activity.type === 'gather') {
      const a = GATHER_MAP[s.activity.actionId];
      return `${a.icon} ${a.name}…`;
    }
    if (s.activity.type === 'thieve') return '🎭 Pickpocketing…';
    if (s.activity.type === 'craft') return '🔨 Working…';
    return null;
  })();

  const inCombat = s.activity?.type === 'combat';
  const combatMonster = inCombat ? MONSTER_MAP[(s.activity as { monsterId: string }).monsterId] : null;

  return (
    <div className="world-wrap">
      <canvas
        ref={canvasRef}
        width={VIEW_W * TILE}
        height={VIEW_H * TILE}
        className="world-canvas"
        onClick={onCanvasClick}
      />
      <div className="zone-label">{zoneName(s.world.px, s.world.py)}</div>
      {activityLabel && (
        <button className="activity-chip" onClick={() => dispatch({ type: 'STOP' })} title="Click to stop">
          {activityLabel}
        </button>
      )}
      {dialog?.kind === 'npc' && (
        <NpcDialog npc={NPCS.find((n) => n.id === dialog.npcId)!} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'station' && (
        <StationDialog station={dialog.station} onClose={() => setDialog(null)} />
      )}
      {inCombat && combatMonster && (
        <div className="combat-overlay">
          <div className="combat-box">
            <FightView monster={combatMonster} monsterHp={(s.activity as { monsterHp: number }).monsterHp} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Best-guess terrain colour under a resource/station/lair glyph. */
function terrainUnder(x: number, y: number): string {
  const around = [tileAt(x - 1, y), tileAt(x + 1, y), tileAt(x, y - 1), tileAt(x, y + 1)];
  for (const c of around) if (TERRAIN_COLOR[c]) return c;
  return '.';
}
