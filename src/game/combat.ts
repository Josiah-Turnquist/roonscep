import { CombatStyle, GameState, Monster, SkillId } from './types';
import { ITEMS } from './items';
import { PRAYER_MAP } from './prayers';
import { levelForXp } from './xp';

export function lvl(state: GameState, skill: SkillId): number {
  return levelForXp(state.xp[skill]);
}

export function maxHp(state: GameState): number {
  return lvl(state, 'hitpoints');
}

export function maxPrayerPoints(state: GameState): number {
  return Math.max(1, lvl(state, 'prayer'));
}

export interface EquipBonuses {
  attack: number;
  strength: number;
  ranged: number;
  magic: number;
  defence: number;
}

export function equipmentBonuses(state: GameState): EquipBonuses {
  const b: EquipBonuses = { attack: 0, strength: 0, ranged: 0, magic: 0, defence: 0 };
  for (const id of Object.values(state.equipment)) {
    const it = id ? ITEMS[id] : undefined;
    if (!it) continue;
    b.attack += it.attackBonus ?? 0;
    b.strength += it.strengthBonus ?? 0;
    b.ranged += it.rangedBonus ?? 0;
    b.magic += it.magicBonus ?? 0;
    b.defence += it.defenceBonus ?? 0;
  }
  return b;
}

export function playerStyle(state: GameState): CombatStyle {
  const w = state.equipment.weapon ? ITEMS[state.equipment.weapon] : undefined;
  return w?.combatStyle ?? 'melee';
}

export function prayerMults(state: GameState): { acc: number; dmg: number; reduce: number } {
  let acc = 1;
  let dmg = 1;
  let intact = 1;
  for (const id of state.activePrayers) {
    const p = PRAYER_MAP[id];
    if (!p) continue;
    acc *= p.accMult ?? 1;
    dmg *= p.dmgMult ?? 1;
    intact *= 1 - (p.reduce ?? 0);
  }
  return { acc, dmg, reduce: Math.min(0.5, 1 - intact) };
}

export function prayerDrainPerRound(state: GameState): number {
  return state.activePrayers.reduce((sum, id) => sum + (PRAYER_MAP[id]?.drain ?? 0), 0);
}

interface Offense {
  style: CombatStyle;
  attLevel: number;
  dmgLevel: number;
  attBonus: number;
  dmgBonus: number;
}

export function offensiveStats(state: GameState): Offense {
  const style = playerStyle(state);
  const b = equipmentBonuses(state);
  // Attack-style stance bonus (melee only)
  const stance = {
    accurate: { att: 3, dmg: 0, def: 0 },
    aggressive: { att: 0, dmg: 3, def: 0 },
    defensive: { att: 0, dmg: 0, def: 3 },
    controlled: { att: 1, dmg: 1, def: 1 },
  }[state.attackStyle];
  if (style === 'ranged') {
    const l = lvl(state, 'ranged') + state.boosts.ranged;
    return { style, attLevel: l, dmgLevel: l, attBonus: b.ranged, dmgBonus: b.ranged };
  }
  if (style === 'magic') {
    const l = lvl(state, 'magic') + state.boosts.magic;
    return { style, attLevel: l, dmgLevel: l, attBonus: b.magic, dmgBonus: b.magic };
  }
  return {
    style,
    attLevel: lvl(state, 'attack') + state.boosts.attack + stance.att,
    dmgLevel: lvl(state, 'strength') + state.boosts.strength + stance.dmg,
    attBonus: b.attack,
    dmgBonus: b.strength,
  };
}

export function playerMaxHit(state: GameState): number {
  const o = offensiveStats(state);
  const base = Math.floor(0.5 + ((o.dmgLevel + 8) * (o.dmgBonus + 64)) / 480);
  return Math.max(1, Math.floor(base * prayerMults(state).dmg));
}

function hitChance(attRoll: number, defRoll: number): number {
  return attRoll > defRoll
    ? 1 - (defRoll + 2) / (2 * (attRoll + 1))
    : attRoll / (2 * (defRoll + 1));
}

export function playerHitChance(state: GameState, m: Monster): number {
  const o = offensiveStats(state);
  const attRoll = (o.attLevel + 8) * (o.attBonus + 64) * prayerMults(state).acc;
  return Math.min(1, hitChance(attRoll, (m.defence + 8) * 64));
}

export function monsterHitChance(state: GameState, m: Monster): number {
  const b = equipmentBonuses(state);
  const stanceDef = state.attackStyle === 'defensive' ? 3 : state.attackStyle === 'controlled' ? 1 : 0;
  const d = lvl(state, 'defence') + state.boosts.defence + stanceDef;
  return hitChance((m.attack + 8) * 64, (d + 8) * (b.defence + 64));
}

/** Damage the monster deals after prayer reduction. */
export function reduceIncoming(state: GameState, dmg: number): number {
  const { reduce } = prayerMults(state);
  return Math.max(1, Math.round(dmg * (1 - reduce)));
}

export function combatLevel(state: GameState): number {
  const base = 0.25 * (lvl(state, 'defence') + lvl(state, 'hitpoints') + Math.floor(lvl(state, 'prayer') / 2));
  const off = 0.325 * Math.max(
    lvl(state, 'attack') + lvl(state, 'strength'),
    1.5 * lvl(state, 'ranged'),
    1.5 * lvl(state, 'magic'),
  );
  return Math.floor(base + off);
}
