import React, { createContext, useContext, useEffect, useReducer } from 'react';
import {
  AttackStyle, EquipSlot, GameState, LogKind, Monster, Settings, SkillId, StatKey,
} from '../game/types';
import { ITEMS } from '../game/items';
import { GATHER_MAP, THIEVE_MAP } from '../game/actions';
import { RECIPE_MAP } from '../game/recipes';
import { MONSTER_MAP } from '../game/monsters';
import { levelForXp, xpForLevel } from '../game/xp';
import {
  combatLevel, lvl, maxHp, maxPrayerPoints, monsterHitChance, offensiveStats,
  playerHitChance, playerMaxHit, prayerDrainPerRound, reduceIncoming,
} from '../game/combat';
import { SKILL_MAP } from '../game/skills';
import { SHOP } from '../game/shop';
import { PRAYER_MAP } from '../game/prayers';
import { SLAYER_MASTER_MAP, SLAYER_REWARDS } from '../game/slayer';
import { QUEST_MAP } from '../game/quests';
import { ACHIEVEMENTS } from '../game/achievements';

export const TICK_MS = 1200;
export const SAVE_KEY = 'skillbound-save-v1';
const LOG_LIMIT = 80;
const MAX_OFFLINE_TICKS = 18000; // 6 hours

export type Action =
  | { type: 'TICK' }
  | { type: 'START_GATHER'; id: string }
  | { type: 'START_THIEVE'; id: string }
  | { type: 'START_CRAFT'; id: string }
  | { type: 'STOP' }
  | { type: 'START_COMBAT'; id: string }
  | { type: 'ATTACK' }
  | { type: 'FLEE' }
  | { type: 'TOGGLE_AUTO' }
  | { type: 'EAT'; itemId: string }
  | { type: 'DRINK'; itemId: string }
  | { type: 'BURY'; itemId: string; qty: number }
  | { type: 'EQUIP'; itemId: string }
  | { type: 'UNEQUIP'; slot: EquipSlot }
  | { type: 'SELL'; itemId: string; qty: number }
  | { type: 'BUY'; itemId: string }
  | { type: 'BUY_CAPE'; skill: SkillId }
  | { type: 'SET_STYLE'; style: AttackStyle }
  | { type: 'TOGGLE_PRAYER'; id: string }
  | { type: 'NEW_TASK'; masterId: string }
  | { type: 'ABANDON_TASK' }
  | { type: 'BUY_SLAYER_REWARD'; id: string }
  | { type: 'ACCEPT_QUEST'; id: string }
  | { type: 'COMPLETE_QUEST'; id: string }
  | { type: 'SET_SETTINGS'; patch: Partial<Settings> }
  | { type: 'RESET' };

const ZERO_STATS: Record<StatKey, number> = {
  totalKills: 0, deaths: 0, damageDealt: 0, damageTaken: 0,
  foodEaten: 0, potionsDrunk: 0, bonesBuried: 0, pickpockets: 0,
  goldEarned: 0, goldSpent: 0, itemsGathered: 0, itemsCrafted: 0,
  tasksCompleted: 0, questsCompleted: 0,
};

function initialState(): GameState {
  const xp = Object.fromEntries(
    Object.keys(SKILL_MAP).map((id) => [id, 0]),
  ) as Record<SkillId, number>;
  xp.hitpoints = xpForLevel(10);
  return {
    xp,
    currentHp: 10,
    prayerPoints: 1,
    activePrayers: [],
    attackStyle: 'controlled',
    gold: 25,
    inventory: { shrimp: 5, bronze_sword: 1 },
    equipment: {},
    boosts: { attack: 0, strength: 0, defence: 0, ranged: 0, magic: 0 },
    activity: null,
    autoCombat: false,
    stunnedTicks: 0,
    kills: {},
    slayerTask: null,
    slayerPoints: 0,
    quests: {},
    achievements: [],
    stats: { ...ZERO_STATS },
    settings: { autoEat: true, autoEatThreshold: 0.4 },
    log: [{ id: 0, text: 'Welcome to Skillbound. Pick a skill and start your grind!', kind: 'info' }],
    logCounter: 1,
  };
}

// ——— reducer helpers (operate on a cloned draft) ———

function pushLog(s: GameState, text: string, kind: LogKind = 'info') {
  s.log.unshift({ id: s.logCounter++, text, kind });
  if (s.log.length > LOG_LIMIT) s.log.length = LOG_LIMIT;
}

function addItem(s: GameState, itemId: string, qty: number) {
  s.inventory[itemId] = (s.inventory[itemId] ?? 0) + qty;
}

function removeItem(s: GameState, itemId: string, qty: number): boolean {
  const have = s.inventory[itemId] ?? 0;
  if (have < qty) return false;
  if (have === qty) delete s.inventory[itemId];
  else s.inventory[itemId] = have - qty;
  return true;
}

function addGold(s: GameState, amount: number) {
  s.gold += amount;
  s.stats.goldEarned += amount;
}

function grantXp(s: GameState, skill: SkillId, amount: number) {
  if (amount <= 0) return;
  const before = levelForXp(s.xp[skill]);
  s.xp[skill] += Math.floor(amount);
  const after = levelForXp(s.xp[skill]);
  if (after > before) {
    pushLog(s, `🎉 ${SKILL_MAP[skill].name} level up! You are now level ${after}.`, 'levelup');
    if (skill === 'hitpoints') s.currentHp += after - before;
    if (skill === 'prayer') s.prayerPoints = Math.min(maxPrayerPoints(s), s.prayerPoints + (after - before));
  }
}

function gatherChance(level: number, req: number): number {
  return Math.min(0.95, 0.6 + (level - req) * 0.01);
}

function thieveChance(level: number, req: number): number {
  return Math.min(0.95, 0.55 + (level - req) * 0.01);
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function die(s: GameState, causeName: string) {
  const lost = Math.floor(s.gold * 0.1);
  s.gold -= lost;
  s.currentHp = maxHp(s);
  s.prayerPoints = maxPrayerPoints(s);
  s.activity = null;
  s.autoCombat = false;
  s.stunnedTicks = 0;
  s.activePrayers = [];
  s.boosts = { attack: 0, strength: 0, defence: 0, ranged: 0, magic: 0 };
  s.stats.deaths += 1;
  pushLog(s, `💀 You were slain by ${causeName}! You lost ${lost.toLocaleString()} gold and awaken at home.`, 'danger');
}

function bestFoodId(s: GameState): string | null {
  let best: string | null = null;
  let bestHeals = 0;
  for (const [id, qty] of Object.entries(s.inventory)) {
    const heals = ITEMS[id]?.heals ?? 0;
    if (qty > 0 && heals > bestHeals) {
      best = id;
      bestHeals = heals;
    }
  }
  return best;
}

function tryAutoEat(s: GameState) {
  if (!s.settings.autoEat || s.currentHp <= 0) return;
  const threshold = Math.floor(maxHp(s) * s.settings.autoEatThreshold);
  let ate = 0;
  while (s.currentHp <= threshold) {
    const id = bestFoodId(s);
    if (!id) break;
    removeItem(s, id, 1);
    s.currentHp = Math.min(maxHp(s), s.currentHp + (ITEMS[id].heals ?? 0));
    s.stats.foodEaten += 1;
    ate += 1;
  }
  if (ate > 0) pushLog(s, `🍽️ Auto-eat: you wolf down ${ate} piece${ate > 1 ? 's' : ''} of food.`, 'combat');
}

function monsterAttacks(s: GameState, m: Monster) {
  if (Math.random() < monsterHitChance(s, m)) {
    const dmg = reduceIncoming(s, 1 + Math.floor(Math.random() * m.maxHit));
    s.currentHp -= dmg;
    s.stats.damageTaken += dmg;
    pushLog(s, `${m.icon} ${m.name} hits you for ${dmg}.`, 'combat');
  } else {
    pushLog(s, `${m.icon} ${m.name} misses you.`, 'combat');
  }
  if (s.currentHp <= 0) {
    die(s, m.name);
    return;
  }
  tryAutoEat(s);
}

function rollDrops(s: GameState, m: Monster) {
  const gold = randInt(m.gold[0], m.gold[1]);
  if (gold > 0) {
    addGold(s, gold);
    pushLog(s, `💰 Looted ${gold.toLocaleString()} gold.`, 'loot');
  }
  for (const d of m.drops) {
    if (Math.random() < d.chance) {
      const qty = randInt(d.min, d.max);
      addItem(s, d.itemId, qty);
      const item = ITEMS[d.itemId];
      const rare = d.chance <= 0.05 ? ' ✨ Rare drop!' : '';
      pushLog(s, `🎁 Loot: ${qty > 1 ? qty + '× ' : ''}${item?.name ?? d.itemId}.${rare}`, 'loot');
    }
  }
}

function creditSlayerKill(s: GameState, m: Monster) {
  const task = s.slayerTask;
  if (!task || task.monsterId !== m.id) return;
  grantXp(s, 'slayer', m.hp);
  task.remaining -= 1;
  if (task.remaining <= 0) {
    const master = SLAYER_MASTER_MAP[task.masterId];
    s.slayerPoints += master?.points ?? 3;
    s.stats.tasksCompleted += 1;
    grantXp(s, 'slayer', m.hp * 10);
    s.slayerTask = null;
    pushLog(s, `📋 Slayer task complete! +${master?.points ?? 3} slayer points (${s.slayerPoints} total).`, 'quest');
  }
}

function playerAttacks(s: GameState, m: Monster): boolean {
  if (s.activity?.type !== 'combat') return false;
  const o = offensiveStats(s);
  let dmg = 0;
  if (Math.random() < playerHitChance(s, m)) {
    dmg = 1 + Math.floor(Math.random() * playerMaxHit(s));
    dmg = Math.min(dmg, s.activity.monsterHp);
    s.activity.monsterHp -= dmg;
    s.stats.damageDealt += dmg;
    pushLog(s, `⚔️ You hit ${m.name} for ${dmg}.`, 'combat');
  } else {
    pushLog(s, `⚔️ You miss ${m.name}.`, 'combat');
  }
  if (dmg > 0) {
    if (o.style === 'melee') {
      switch (s.attackStyle) {
        case 'accurate': grantXp(s, 'attack', dmg * 4); break;
        case 'aggressive': grantXp(s, 'strength', dmg * 4); break;
        case 'defensive': grantXp(s, 'defence', dmg * 4); break;
        case 'controlled':
          grantXp(s, 'attack', Math.ceil(dmg * 1.33));
          grantXp(s, 'strength', Math.ceil(dmg * 1.33));
          grantXp(s, 'defence', Math.ceil(dmg * 1.33));
          break;
      }
    } else {
      grantXp(s, o.style === 'ranged' ? 'ranged' : 'magic', dmg * 4);
    }
    grantXp(s, 'hitpoints', Math.floor(dmg * 1.33));
  }
  if (s.activity.monsterHp <= 0) {
    s.kills[m.id] = (s.kills[m.id] ?? 0) + 1;
    s.stats.totalKills += 1;
    pushLog(s, `🏆 You defeated ${m.name}!`, 'combat');
    rollDrops(s, m);
    creditSlayerKill(s, m);
    if (m.boss) {
      s.activity = null;
      s.autoCombat = false;
    } else {
      s.activity = { type: 'combat', monsterId: m.id, monsterHp: m.hp };
      pushLog(s, `Another ${m.name} appears.`, 'combat');
    }
    return true;
  }
  return false;
}

function drainPrayers(s: GameState) {
  if (s.activePrayers.length === 0) return;
  s.prayerPoints = Math.max(0, s.prayerPoints - prayerDrainPerRound(s));
  if (s.prayerPoints === 0) {
    s.activePrayers = [];
    pushLog(s, '🙏 Your prayers fade — you are out of prayer points.', 'danger');
  }
}

function combatRound(s: GameState) {
  if (s.activity?.type !== 'combat') return;
  const m = MONSTER_MAP[s.activity.monsterId];
  drainPrayers(s);
  const died = playerAttacks(s, m);
  if (!died && s.activity?.type === 'combat') monsterAttacks(s, m);
}

function canAffordRecipe(s: GameState, recipeId: string): boolean {
  const r = RECIPE_MAP[recipeId];
  return (
    (r.goldCost ?? 0) <= s.gold &&
    Object.entries(r.inputs).every(([id, qty]) => (s.inventory[id] ?? 0) >= qty)
  );
}

function doCraftTick(s: GameState, recipeId: string) {
  const r = RECIPE_MAP[recipeId];
  if (!canAffordRecipe(s, recipeId)) {
    s.activity = null;
    pushLog(s, `Out of materials for ${r.name}.`, 'info');
    return;
  }
  for (const [id, qty] of Object.entries(r.inputs)) removeItem(s, id, qty);
  if (r.goldCost) {
    s.gold -= r.goldCost;
    s.stats.goldSpent += r.goldCost;
  }
  if (r.burnChance !== undefined) {
    const burn = Math.max(0, r.burnChance - (lvl(s, r.skill) - r.level) * 0.02);
    if (Math.random() < burn) {
      grantXp(s, r.skill, Math.floor(r.xp / 10));
      pushLog(s, `🔥 You accidentally burn the ${ITEMS[r.output]?.name ?? r.output}.`, 'info');
      return;
    }
  }
  addItem(s, r.output, r.outputQty ?? 1);
  s.stats.itemsCrafted += r.outputQty ?? 1;
  grantXp(s, r.skill, r.xp);
}

function doThieveTick(s: GameState, targetId: string) {
  const t = THIEVE_MAP[targetId];
  if (Math.random() < thieveChance(lvl(s, 'thieving'), t.level)) {
    const gold = randInt(t.gold[0], t.gold[1]);
    addGold(s, gold);
    grantXp(s, 'thieving', t.xp);
    s.stats.pickpockets += 1;
    for (const d of t.loot ?? []) {
      if (Math.random() < d.chance) {
        const qty = randInt(d.min, d.max);
        addItem(s, d.itemId, qty);
        pushLog(s, `🎁 You lift ${qty > 1 ? qty + '× ' : ''}${ITEMS[d.itemId]?.name} from the ${t.name}!`, 'loot');
      }
    }
  } else {
    const dmg = randInt(t.failDamage[0], t.failDamage[1]);
    s.currentHp -= dmg;
    s.stunnedTicks = 2;
    pushLog(s, `👮 The ${t.name} catches you! You take ${dmg} damage and are stunned.`, 'danger');
    if (s.currentHp <= 0) {
      die(s, `an angry ${t.name.toLowerCase()}`);
      return;
    }
    tryAutoEat(s);
  }
}

function questObjectivesMet(s: GameState, questId: string): boolean {
  const q = QUEST_MAP[questId];
  const p = s.quests[questId];
  if (!q || p?.status !== 'active') return false;
  return q.objectives.every((o) => {
    if (o.type === 'kill') return (s.kills[o.monsterId] ?? 0) - (p.killSnapshot[o.monsterId] ?? 0) >= o.count;
    if (o.type === 'item') return (s.inventory[o.itemId] ?? 0) >= o.qty;
    return s.stats[o.stat] - (p.statSnapshot[o.stat] ?? 0) >= o.count;
  });
}

function withAchievements(s: GameState): GameState {
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements.includes(a.id) && a.check(s)) {
      s.achievements.push(a.id);
      pushLog(s, `🏅 Achievement unlocked: ${a.name} — ${a.desc}!`, 'levelup');
    }
  }
  return s;
}

// ——— offline progress ———

function simulateOffline(s: GameState, ticks: number) {
  const before = { ...s.xp };
  const summary: string[] = [];
  if (s.activity?.type === 'combat') {
    s.activity = null;
    s.autoCombat = false;
    summary.push('you withdrew from combat');
  } else if (s.activity?.type === 'gather') {
    const a = GATHER_MAP[s.activity.actionId];
    if (a) {
      let remaining = ticks;
      let gained = 0;
      while (remaining > 0) {
        const chunk = Math.min(remaining, 200);
        const succ = Math.round(chunk * gatherChance(lvl(s, a.skill), a.level));
        addItem(s, a.output, succ);
        grantXp(s, a.skill, succ * a.xp);
        gained += succ;
        remaining -= chunk;
      }
      s.stats.itemsGathered += gained;
      summary.push(`gathered ${gained.toLocaleString()}× ${ITEMS[a.output]?.name}`);
    }
  } else if (s.activity?.type === 'thieve') {
    const t = THIEVE_MAP[s.activity.targetId];
    if (t) {
      let remaining = ticks;
      let gold = 0;
      let succTotal = 0;
      const avgGold = (t.gold[0] + t.gold[1]) / 2;
      while (remaining > 0) {
        const chunk = Math.min(remaining, 200);
        const succ = Math.round(chunk * thieveChance(lvl(s, 'thieving'), t.level));
        grantXp(s, 'thieving', succ * t.xp);
        gold += Math.round(succ * avgGold);
        succTotal += succ;
        remaining -= chunk;
      }
      addGold(s, gold);
      s.stats.pickpockets += succTotal;
      summary.push(`picked ${succTotal.toLocaleString()} pockets for ${gold.toLocaleString()} gold`);
    }
  } else if (s.activity?.type === 'craft') {
    const r = RECIPE_MAP[s.activity.recipeId];
    if (r) {
      let made = 0;
      let attempts = 0;
      while (attempts < ticks && canAffordRecipe(s, r.id)) {
        for (const [id, qty] of Object.entries(r.inputs)) removeItem(s, id, qty);
        if (r.goldCost) s.gold -= r.goldCost;
        const burn = r.burnChance !== undefined
          ? Math.max(0, r.burnChance - (lvl(s, r.skill) - r.level) * 0.02)
          : 0;
        if (Math.random() < burn) {
          grantXp(s, r.skill, Math.floor(r.xp / 10));
        } else {
          addItem(s, r.output, r.outputQty ?? 1);
          grantXp(s, r.skill, r.xp);
          made += r.outputQty ?? 1;
        }
        attempts += 1;
      }
      if (attempts < ticks) s.activity = null;
      s.stats.itemsCrafted += made;
      summary.push(`crafted ${made.toLocaleString()}× ${ITEMS[r.output]?.name}`);
    }
  }
  s.currentHp = maxHp(s);
  s.prayerPoints = maxPrayerPoints(s);
  const xpGained = Object.keys(s.xp).reduce((sum, k) => sum + (s.xp[k as SkillId] - before[k as SkillId]), 0);
  const hours = ((ticks * TICK_MS) / 3600000).toFixed(1);
  pushLog(
    s,
    `🌙 Welcome back! While you were away (${hours}h): ${summary.join(', ') || 'you rested'}${xpGained > 0 ? ` (+${xpGained.toLocaleString()} xp)` : ''}.`,
    'quest',
  );
}

export function loadState(): GameState {
  const base = initialState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<GameState>;
    const s: GameState = {
      ...base,
      ...saved,
      xp: { ...base.xp, ...(saved.xp ?? {}) },
      boosts: { ...base.boosts, ...(saved.boosts ?? {}) },
      stats: { ...base.stats, ...(saved.stats ?? {}) },
      settings: { ...base.settings, ...(saved.settings ?? {}) },
      quests: saved.quests ?? {},
      achievements: saved.achievements ?? [],
    };
    if (saved.savedAt) {
      const ticks = Math.min(Math.floor((Date.now() - saved.savedAt) / TICK_MS), MAX_OFFLINE_TICKS);
      if (ticks > 10 && s.activity) simulateOffline(s, ticks);
    }
    return withAchievements(s);
  } catch {
    return base;
  }
}

// ——— reducer ———

function reduceInner(state: GameState, action: Action): GameState {
  const s: GameState = structuredClone(state);

  switch (action.type) {
    case 'TICK': {
      if (s.stunnedTicks > 0) {
        s.stunnedTicks -= 1;
        return s;
      }
      if (s.activity?.type === 'gather') {
        const a = GATHER_MAP[s.activity.actionId];
        if (Math.random() < gatherChance(lvl(s, a.skill), a.level)) {
          addItem(s, a.output, 1);
          s.stats.itemsGathered += 1;
          grantXp(s, a.skill, a.xp);
          if (a.skill === 'mining' && Math.random() < 0.01) {
            const gem = (['sapphire', 'sapphire', 'emerald', 'ruby', 'diamond'] as const)[
              Math.floor(Math.random() * 5)
            ];
            addItem(s, gem, 1);
            pushLog(s, `✨ You unearth a ${ITEMS[gem].name}!`, 'loot');
          }
        }
      } else if (s.activity?.type === 'thieve') {
        doThieveTick(s, s.activity.targetId);
      } else if (s.activity?.type === 'craft') {
        doCraftTick(s, s.activity.recipeId);
      } else if (s.activity?.type === 'combat' && s.autoCombat) {
        combatRound(s);
      }
      // Passive regeneration outside combat
      if (s.activity?.type !== 'combat') {
        if (s.currentHp < maxHp(s)) s.currentHp += 1;
        if (s.prayerPoints < maxPrayerPoints(s)) s.prayerPoints += 1;
      }
      return s;
    }

    case 'START_GATHER': {
      const a = GATHER_MAP[action.id];
      if (lvl(s, a.skill) < a.level) return state;
      s.activity = { type: 'gather', actionId: action.id };
      pushLog(s, `You begin working the ${a.name.toLowerCase()} (${SKILL_MAP[a.skill].name}).`);
      return s;
    }

    case 'START_THIEVE': {
      const t = THIEVE_MAP[action.id];
      if (lvl(s, 'thieving') < t.level) return state;
      s.activity = { type: 'thieve', targetId: action.id };
      pushLog(s, `You slip into the crowd near the ${t.name.toLowerCase()}…`);
      return s;
    }

    case 'START_CRAFT': {
      const r = RECIPE_MAP[action.id];
      if (lvl(s, r.skill) < r.level) return state;
      s.activity = { type: 'craft', recipeId: action.id };
      pushLog(s, `You begin making ${r.name}.`);
      return s;
    }

    case 'STOP': {
      s.activity = null;
      return s;
    }

    case 'START_COMBAT': {
      const m = MONSTER_MAP[action.id];
      if (m.boss && combatLevel(s) < (m.levelReq ?? 0)) return state;
      if (m.slayerReq && lvl(s, 'slayer') < m.slayerReq) {
        pushLog(s, `You need Slayer level ${m.slayerReq} to harm ${m.name}.`, 'danger');
        return s;
      }
      s.activity = { type: 'combat', monsterId: m.id, monsterHp: m.hp };
      pushLog(s, `${m.icon} You engage ${m.name}${m.boss ? ' — a mighty boss' : ''}!`, 'combat');
      return s;
    }

    case 'ATTACK': {
      combatRound(s);
      return s;
    }

    case 'FLEE': {
      if (s.activity?.type === 'combat') {
        const m = MONSTER_MAP[s.activity.monsterId];
        s.activity = null;
        s.autoCombat = false;
        s.boosts = { attack: 0, strength: 0, defence: 0, ranged: 0, magic: 0 };
        pushLog(s, `🏃 You flee from ${m.name}.`, 'combat');
      }
      return s;
    }

    case 'TOGGLE_AUTO': {
      s.autoCombat = !s.autoCombat;
      return s;
    }

    case 'EAT': {
      const item = ITEMS[action.itemId];
      if (!item?.heals || !removeItem(s, action.itemId, 1)) return state;
      const healed = Math.min(item.heals, maxHp(s) - s.currentHp);
      s.currentHp += healed;
      s.stats.foodEaten += 1;
      pushLog(s, `🍽️ You eat the ${item.name} and heal ${healed} HP.`);
      // Eating mid-fight costs your turn: the monster gets a free swing
      if (s.activity?.type === 'combat') monsterAttacks(s, MONSTER_MAP[s.activity.monsterId]);
      return s;
    }

    case 'DRINK': {
      const item = ITEMS[action.itemId];
      if ((!item?.boost && !item?.restorePrayer) || !removeItem(s, action.itemId, 1)) return state;
      s.stats.potionsDrunk += 1;
      if (item.boost) {
        s.boosts[item.boost.skill] = Math.max(s.boosts[item.boost.skill], item.boost.amount);
        pushLog(s, `🧪 You drink the ${item.name} (+${item.boost.amount} ${item.boost.skill}).`);
      }
      if (item.restorePrayer) {
        s.prayerPoints = Math.min(maxPrayerPoints(s), s.prayerPoints + item.restorePrayer);
        pushLog(s, `🍷 You drink the ${item.name} and restore prayer points.`);
      }
      return s;
    }

    case 'BURY': {
      const item = ITEMS[action.itemId];
      if (!item?.bury) return state;
      const qty = Math.min(action.qty, s.inventory[action.itemId] ?? 0);
      if (qty <= 0) return state;
      removeItem(s, action.itemId, qty);
      grantXp(s, 'prayer', item.bury.xp * qty);
      s.prayerPoints = Math.min(maxPrayerPoints(s), s.prayerPoints + item.bury.points * qty);
      s.stats.bonesBuried += qty;
      pushLog(s, `⚰️ You bury ${qty}× ${item.name} with honour. (+${item.bury.xp * qty} Prayer xp)`);
      return s;
    }

    case 'EQUIP': {
      const item = ITEMS[action.itemId];
      if (!item?.slot) return state;
      if (item.levelReq && lvl(s, item.levelReq.skill) < item.levelReq.level) {
        pushLog(s, `You need ${SKILL_MAP[item.levelReq.skill].name} ${item.levelReq.level} to equip ${item.name}.`, 'danger');
        return s;
      }
      if (!removeItem(s, action.itemId, 1)) return state;
      const current = s.equipment[item.slot];
      if (current) addItem(s, current, 1);
      s.equipment[item.slot] = action.itemId;
      pushLog(s, `You equip the ${item.name}.`);
      return s;
    }

    case 'UNEQUIP': {
      const current = s.equipment[action.slot];
      if (!current) return state;
      delete s.equipment[action.slot];
      addItem(s, current, 1);
      return s;
    }

    case 'SELL': {
      const item = ITEMS[action.itemId];
      const have = s.inventory[action.itemId] ?? 0;
      const qty = Math.min(action.qty, have);
      if (!item || qty <= 0) return state;
      removeItem(s, action.itemId, qty);
      addGold(s, item.value * qty);
      pushLog(s, `💰 Sold ${qty}× ${item.name} for ${(item.value * qty).toLocaleString()} gold.`);
      return s;
    }

    case 'BUY': {
      const entry = SHOP.find((e) => e.itemId === action.itemId);
      if (!entry || s.gold < entry.price) return state;
      s.gold -= entry.price;
      s.stats.goldSpent += entry.price;
      addItem(s, entry.itemId, 1);
      pushLog(s, `🛒 Bought ${ITEMS[entry.itemId].name} for ${entry.price.toLocaleString()} gold.`);
      return s;
    }

    case 'BUY_CAPE': {
      const capeId = `${action.skill}_cape`;
      const cape = ITEMS[capeId];
      if (!cape || lvl(s, action.skill) < 99 || s.gold < 99000) return state;
      s.gold -= 99000;
      s.stats.goldSpent += 99000;
      addItem(s, capeId, 1);
      pushLog(s, `🧣 You purchase the ${cape.name} — a mark of true mastery!`, 'levelup');
      return s;
    }

    case 'SET_STYLE': {
      s.attackStyle = action.style;
      return s;
    }

    case 'TOGGLE_PRAYER': {
      const p = PRAYER_MAP[action.id];
      if (!p || lvl(s, 'prayer') < p.level) return state;
      if (s.activePrayers.includes(action.id)) {
        s.activePrayers = s.activePrayers.filter((id) => id !== action.id);
      } else {
        if (s.prayerPoints <= 0) {
          pushLog(s, 'You have no prayer points. Bury bones or drink a prayer potion.', 'danger');
          return s;
        }
        s.activePrayers.push(action.id);
      }
      return s;
    }

    case 'NEW_TASK': {
      if (s.slayerTask) return state;
      const master = SLAYER_MASTER_MAP[action.masterId];
      if (!master || combatLevel(s) < master.minCombat) return state;
      const slayerLvl = lvl(s, 'slayer');
      const pool = master.pool.filter((id) => (MONSTER_MAP[id].slayerReq ?? 0) <= slayerLvl);
      if (pool.length === 0) return state;
      const monsterId = pool[Math.floor(Math.random() * pool.length)];
      const total = randInt(master.count[0], master.count[1]);
      s.slayerTask = { monsterId, remaining: total, total, masterId: master.id };
      pushLog(s, `📋 ${master.name} assigns you: slay ${total}× ${MONSTER_MAP[monsterId].name}.`, 'quest');
      return s;
    }

    case 'ABANDON_TASK': {
      if (!s.slayerTask) return state;
      pushLog(s, '📋 You abandon your slayer task.', 'info');
      s.slayerTask = null;
      return s;
    }

    case 'BUY_SLAYER_REWARD': {
      const r = SLAYER_REWARDS.find((x) => x.id === action.id);
      if (!r || s.slayerPoints < r.cost) return state;
      s.slayerPoints -= r.cost;
      if (r.gold) addGold(s, r.gold);
      for (const it of r.items ?? []) addItem(s, it.itemId, it.qty);
      pushLog(s, `📋 Redeemed ${r.name} for ${r.cost} slayer points.`, 'loot');
      return s;
    }

    case 'ACCEPT_QUEST': {
      const q = QUEST_MAP[action.id];
      if (!q || s.quests[q.id]) return state;
      if (q.reqCombat && combatLevel(s) < q.reqCombat) return state;
      if (q.reqQuests?.some((id) => s.quests[id]?.status !== 'done')) return state;
      const killSnapshot: Record<string, number> = {};
      const statSnapshot: Partial<Record<StatKey, number>> = {};
      for (const o of q.objectives) {
        if (o.type === 'kill') killSnapshot[o.monsterId] = s.kills[o.monsterId] ?? 0;
        if (o.type === 'stat') statSnapshot[o.stat] = s.stats[o.stat];
      }
      s.quests[q.id] = { status: 'active', killSnapshot, statSnapshot };
      pushLog(s, `📜 Quest accepted: ${q.name}.`, 'quest');
      return s;
    }

    case 'COMPLETE_QUEST': {
      const q = QUEST_MAP[action.id];
      if (!q || !questObjectivesMet(s, q.id)) return state;
      for (const o of q.objectives) {
        if (o.type === 'item') removeItem(s, o.itemId, o.qty);
      }
      if (q.rewards.gold) addGold(s, q.rewards.gold);
      for (const it of q.rewards.items ?? []) addItem(s, it.itemId, it.qty);
      for (const xp of q.rewards.xp ?? []) grantXp(s, xp.skill, xp.amount);
      s.quests[q.id].status = 'done';
      s.stats.questsCompleted += 1;
      pushLog(s, `🏵️ Quest complete: ${q.name}!`, 'quest');
      return s;
    }

    case 'SET_SETTINGS': {
      s.settings = { ...s.settings, ...action.patch };
      return s;
    }

    case 'RESET':
      return initialState();

    default:
      return state;
  }
}

function reduce(state: GameState, action: Action): GameState {
  const out = reduceInner(state, action);
  return out === state ? state : withAchievements(out);
}

// ——— context ———

const StateCtx = createContext<GameState | null>(null);
const DispatchCtx = createContext<React.Dispatch<Action>>(() => {});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, loadState);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK' }), TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  }, [state]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useGame(): GameState {
  const s = useContext(StateCtx);
  if (!s) throw new Error('useGame outside provider');
  return s;
}

export function useDispatch(): React.Dispatch<Action> {
  return useContext(DispatchCtx);
}
