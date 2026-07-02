import { CombatStyle, GameState, Monster, SkillId } from './types';
import { ITEMS } from './items';
import { levelForXp } from './xp';

export function lvl(state: GameState, skill: SkillId): number {
  return levelForXp(state.xp[skill]);
}

export function maxHp(state: GameState): number {
  return lvl(state, 'hitpoints');
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
  if (style === 'ranged') {
    const l = lvl(state, 'ranged');
    return { style, attLevel: l, dmgLevel: l, attBonus: b.ranged, dmgBonus: b.ranged };
  }
  if (style === 'magic') {
    const l = lvl(state, 'magic');
    return { style, attLevel: l, dmgLevel: l, attBonus: b.magic, dmgBonus: b.magic };
  }
  return {
    style,
    attLevel: lvl(state, 'attack') + state.boosts.attack,
    dmgLevel: lvl(state, 'strength') + state.boosts.strength,
    attBonus: b.attack,
    dmgBonus: b.strength,
  };
}

export function playerMaxHit(state: GameState): number {
  const o = offensiveStats(state);
  return Math.max(1, Math.floor(0.5 + ((o.dmgLevel + 8) * (o.dmgBonus + 64)) / 480));
}

function hitChance(attRoll: number, defRoll: number): number {
  return attRoll > defRoll
    ? 1 - (defRoll + 2) / (2 * (attRoll + 1))
    : attRoll / (2 * (defRoll + 1));
}

export function playerHitChance(state: GameState, m: Monster): number {
  const o = offensiveStats(state);
  return hitChance((o.attLevel + 8) * (o.attBonus + 64), (m.defence + 8) * 64);
}

export function monsterHitChance(state: GameState, m: Monster): number {
  const b = equipmentBonuses(state);
  const d = lvl(state, 'defence') + state.boosts.defence;
  return hitChance((m.attack + 8) * 64, (d + 8) * (b.defence + 64));
}

export function combatLevel(state: GameState): number {
  const base = 0.25 * (lvl(state, 'defence') + lvl(state, 'hitpoints'));
  const off = 0.325 * Math.max(
    lvl(state, 'attack') + lvl(state, 'strength'),
    1.5 * lvl(state, 'ranged'),
    1.5 * lvl(state, 'magic'),
  );
  return Math.floor(base + off);
}
