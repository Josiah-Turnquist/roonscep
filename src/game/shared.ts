// The shared world (multiplayer only): monsters and dropped loot that ALL
// players see and interact with, owned authoritatively by the server. Pure
// logic — the server calls tickSharedWorld() each tick and pickUpLoot() on
// request. Single-player never touches this (it keeps per-player monsters in
// its own GameState).
//
// Combat rules (owner-decided): multiple players can tag the same monster; each
// engaged player deals their own attack to the shared HP; the monster
// retaliates once against the highest-combat-level tagger. On death, loot lands
// on the ground where the monster fell — visible ONLY to the killing-blow
// player for 1 minute, then to everyone.
import { GameState, Monster } from './types';
import { MONSTER_MAP } from './monsters';
import { ITEMS } from './items';
import { SPAWNS, isWalkable } from './world';
import {
  combatLevel, monsterHitChance, offensiveStats, playerHitChance, playerMaxHit, reduceIncoming,
} from './combat';
import {
  ENTITY_RESPAWN_TICKS, addGold, addItem, creditSlayerKill, die, grantXp, pushLog, randInt, tryAutoEat,
} from './engine';
import { rng } from './rng';

/** 1 minute at 1.2s/tick. */
export const LOOT_OWNER_TICKS = 50;
/** How long loot stays on the ground after going public before vanishing. */
export const LOOT_DESPAWN_TICKS = 200;
/** Sentinel item id for a gold pile on the ground. */
export const GOLD_ITEM = '__gold__';

export interface SharedMonster {
  uid: number;
  defId: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  hp: number;
  respawn: number; // 0 = alive; >0 = ticks until it returns
  damageBy: Record<string, number>; // playerId -> damage dealt this life
}

export interface GroundLoot {
  id: number;
  x: number;
  y: number;
  itemId: string; // or GOLD_ITEM
  qty: number;
  owner: string; // playerId with first dibs
  publicAt: number; // tickCount when it becomes visible to everyone
  despawnAt: number; // tickCount when it vanishes
}

export interface SharedWorld {
  monsters: SharedMonster[];
  loot: GroundLoot[];
  lootCounter: number;
  tickCount: number;
}

export function createSharedWorld(): SharedWorld {
  return {
    monsters: SPAWNS.map((sp, i) => ({
      uid: i,
      defId: sp.defId,
      x: sp.x,
      y: sp.y,
      homeX: sp.x,
      homeY: sp.y,
      hp: MONSTER_MAP[sp.defId].hp,
      respawn: 0,
      damageBy: {},
    })),
    loot: [],
    lootCounter: 0,
    tickCount: 0,
  };
}

/** Which ground loot a given player can currently see. */
export function visibleLoot(world: SharedWorld, playerId: string): GroundLoot[] {
  return world.loot.filter((l) => world.tickCount >= l.publicAt || l.owner === playerId);
}

function pushMonsterFx(s: GameState, amount: number | null) {
  s.fx.push({ id: s.logCounter++, target: 'monster', amount });
  if (s.fx.length > 12) s.fx.splice(0, s.fx.length - 12);
}

function pushPlayerFx(s: GameState, amount: number | null) {
  s.fx.push({ id: s.logCounter++, target: 'player', amount });
  if (s.fx.length > 12) s.fx.splice(0, s.fx.length - 12);
}

function grantAttackXp(st: GameState, dmg: number) {
  const o = offensiveStats(st);
  if (o.style === 'melee') {
    switch (st.attackStyle) {
      case 'accurate': grantXp(st, 'attack', dmg * 4); break;
      case 'aggressive': grantXp(st, 'strength', dmg * 4); break;
      case 'defensive': grantXp(st, 'defence', dmg * 4); break;
      case 'controlled':
        grantXp(st, 'attack', Math.ceil(dmg * 1.33));
        grantXp(st, 'strength', Math.ceil(dmg * 1.33));
        grantXp(st, 'defence', Math.ceil(dmg * 1.33));
        break;
    }
  } else {
    grantXp(st, o.style === 'ranged' ? 'ranged' : 'magic', dmg * 4);
  }
  grantXp(st, 'hitpoints', Math.ceil(dmg * 1.33));
}

function dropLoot(world: SharedWorld, monster: SharedMonster, def: Monster, ownerId: string) {
  const publicAt = world.tickCount + LOOT_OWNER_TICKS;
  const despawnAt = publicAt + LOOT_DESPAWN_TICKS;
  const push = (itemId: string, qty: number) =>
    world.loot.push({ id: world.lootCounter++, x: monster.x, y: monster.y, itemId, qty, owner: ownerId, publicAt, despawnAt });
  const gold = randInt(def.gold[0], def.gold[1]);
  if (gold > 0) push(GOLD_ITEM, gold);
  for (const d of def.drops) {
    if (rng() < d.chance) push(d.itemId, randInt(d.min, d.max));
  }
}

/**
 * One authoritative tick of the shared world. Mutates the world and every
 * engaged player's GameState (xp, hp, kill credit, death). `players` is every
 * connected player's server-owned state, keyed by playerId.
 */
export function tickSharedWorld(world: SharedWorld, players: Map<string, GameState>): void {
  world.tickCount++;

  // group engaged players by the monster they're fighting
  const byMonster = new Map<number, string[]>();
  for (const [pid, st] of players) {
    const act = st.activity;
    if (act?.type === 'combat' && act.entityUid !== undefined) {
      const m = world.monsters.find((mm) => mm.uid === act.entityUid && mm.respawn === 0);
      if (m) {
        const list = byMonster.get(m.uid);
        if (list) list.push(pid);
        else byMonster.set(m.uid, [pid]);
      } else {
        // the monster is gone (killed/respawning) — drop the stale fight
        st.activity = null;
      }
    }
  }

  // resolve combat per contested monster
  for (const [uid, pids] of byMonster) {
    const monster = world.monsters.find((m) => m.uid === uid)!;
    const def = MONSTER_MAP[monster.defId];
    let killer: string | null = null;

    for (const pid of pids) {
      if (monster.hp <= 0) break;
      const st = players.get(pid)!;
      if (rng() < playerHitChance(st, def)) {
        let dmg = 1 + Math.floor(rng() * playerMaxHit(st));
        dmg = Math.min(dmg, monster.hp);
        monster.hp -= dmg;
        monster.damageBy[pid] = (monster.damageBy[pid] ?? 0) + dmg;
        st.stats.damageDealt += dmg;
        grantAttackXp(st, dmg);
        pushMonsterFx(st, dmg);
        pushLog(st, `⚔️ You hit ${def.name} for ${dmg}.`, 'combat');
        if (monster.hp <= 0) killer = pid;
      } else {
        pushMonsterFx(st, null);
        pushLog(st, `⚔️ You miss ${def.name}.`, 'combat');
      }
    }

    // retaliation against the highest-combat-level tagger
    if (monster.hp > 0) {
      let topPid = pids[0];
      let topCl = -1;
      for (const pid of pids) {
        const cl = combatLevel(players.get(pid)!);
        if (cl > topCl) {
          topCl = cl;
          topPid = pid;
        }
      }
      const target = players.get(topPid)!;
      if (rng() < monsterHitChance(target, def)) {
        const dmg = reduceIncoming(target, 1 + Math.floor(rng() * def.maxHit));
        target.currentHp -= dmg;
        target.stats.damageTaken += dmg;
        grantXp(target, 'hitpoints', dmg * 2);
        pushPlayerFx(target, dmg);
        pushLog(target, `${def.icon} ${def.name} hits you for ${dmg}.`, 'combat');
        if (target.currentHp <= 0) {
          die(target, def.name);
        } else {
          tryAutoEat(target);
        }
      } else {
        pushPlayerFx(target, null);
        pushLog(target, `${def.icon} ${def.name} misses you.`, 'combat');
      }
    }

    // death: credit the killer, drop owned loot, respawn the monster
    if (killer) {
      const kst = players.get(killer)!;
      kst.kills[def.id] = (kst.kills[def.id] ?? 0) + 1;
      kst.stats.totalKills += 1;
      pushLog(kst, `🏆 You landed the killing blow on ${def.name}!`, 'combat');
      creditSlayerKill(kst, def);
      dropLoot(world, monster, def, killer);
      monster.respawn = ENTITY_RESPAWN_TICKS;
      monster.hp = def.hp;
      monster.damageBy = {};
      for (const pid of pids) {
        const st = players.get(pid)!;
        if (st.activity?.type === 'combat' && st.activity.entityUid === uid) st.activity = null;
      }
    }
  }

  // wander / respawn monsters (skip any currently being fought)
  for (const m of world.monsters) {
    if (m.respawn > 0) {
      m.respawn -= 1;
      if (m.respawn === 0) {
        m.x = m.homeX;
        m.y = m.homeY;
        m.hp = MONSTER_MAP[m.defId].hp;
      }
      continue;
    }
    if (byMonster.has(m.uid)) continue; // in a fight — hold still
    if (rng() > 0.35) continue;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const [dx, dy] = dirs[Math.floor(rng() * dirs.length)];
    const nx = m.x + dx;
    const ny = m.y + dy;
    if (
      Math.max(Math.abs(nx - m.homeX), Math.abs(ny - m.homeY)) <= 4 &&
      isWalkable(nx, ny) &&
      !world.monsters.some((o) => o.uid !== m.uid && o.respawn === 0 && o.x === nx && o.y === ny)
    ) {
      m.x = nx;
      m.y = ny;
    }
  }

  // vanish expired ground loot
  if (world.loot.length > 0) {
    world.loot = world.loot.filter((l) => world.tickCount < l.despawnAt);
  }
}

/** A player attempts to pick up a ground loot item. Returns true if taken. */
export function pickUpLoot(world: SharedWorld, st: GameState, playerId: string, lootId: number): boolean {
  const idx = world.loot.findIndex((l) => l.id === lootId);
  if (idx < 0) return false;
  const loot = world.loot[idx];
  const isPublic = world.tickCount >= loot.publicAt;
  if (!isPublic && loot.owner !== playerId) return false; // still in the owner-only window
  if (Math.max(Math.abs(st.world.px - loot.x), Math.abs(st.world.py - loot.y)) > 1) return false;
  world.loot.splice(idx, 1);
  if (loot.itemId === GOLD_ITEM) {
    addGold(st, loot.qty);
    pushLog(st, `💰 You pick up ${loot.qty.toLocaleString()} gold.`, 'loot');
  } else {
    addItem(st, loot.itemId, loot.qty);
    pushLog(st, `🎁 You pick up ${loot.qty > 1 ? loot.qty + '× ' : ''}${ITEMS[loot.itemId]?.name ?? loot.itemId}.`, 'loot');
  }
  return true;
}
