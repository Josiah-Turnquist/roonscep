import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { EquipSlot, GameState, LogKind, Monster, SkillId } from '../game/types';
import { ITEMS } from '../game/items';
import { GATHER_MAP } from '../game/actions';
import { RECIPE_MAP } from '../game/recipes';
import { MONSTER_MAP } from '../game/monsters';
import { levelForXp, xpForLevel } from '../game/xp';
import {
  combatLevel, lvl, maxHp, monsterHitChance, offensiveStats, playerHitChance, playerMaxHit,
} from '../game/combat';
import { SKILL_MAP } from '../game/skills';
import { SHOP } from '../game/shop';

export const TICK_MS = 1200;
const SAVE_KEY = 'skillbound-save-v1';
const LOG_LIMIT = 80;

export type Action =
  | { type: 'TICK' }
  | { type: 'START_GATHER'; id: string }
  | { type: 'START_CRAFT'; id: string }
  | { type: 'STOP' }
  | { type: 'START_COMBAT'; id: string }
  | { type: 'ATTACK' }
  | { type: 'FLEE' }
  | { type: 'TOGGLE_AUTO' }
  | { type: 'EAT'; itemId: string }
  | { type: 'DRINK'; itemId: string }
  | { type: 'EQUIP'; itemId: string }
  | { type: 'UNEQUIP'; slot: EquipSlot }
  | { type: 'SELL'; itemId: string; qty: number }
  | { type: 'BUY'; itemId: string }
  | { type: 'RESET' };

function initialState(): GameState {
  const xp = Object.fromEntries(
    Object.keys(SKILL_MAP).map((id) => [id, 0]),
  ) as Record<SkillId, number>;
  xp.hitpoints = xpForLevel(10);
  return {
    xp,
    currentHp: 10,
    gold: 25,
    inventory: { shrimp: 5, bronze_sword: 1 },
    equipment: {},
    boosts: { attack: 0, strength: 0, defence: 0 },
    activity: null,
    autoCombat: false,
    kills: {},
    log: [{ id: 0, text: 'Welcome to Skillbound. Pick a skill and start your grind!', kind: 'info' }],
    logCounter: 1,
  };
}

function loadState(): GameState {
  const base = initialState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<GameState>;
    return {
      ...base,
      ...saved,
      xp: { ...base.xp, ...(saved.xp ?? {}) },
      boosts: { ...base.boosts, ...(saved.boosts ?? {}) },
    };
  } catch {
    return base;
  }
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

function grantXp(s: GameState, skill: SkillId, amount: number) {
  if (amount <= 0) return;
  const before = levelForXp(s.xp[skill]);
  s.xp[skill] += Math.floor(amount);
  const after = levelForXp(s.xp[skill]);
  if (after > before) {
    pushLog(s, `🎉 ${SKILL_MAP[skill].name} level up! You are now level ${after}.`, 'levelup');
    if (skill === 'hitpoints') s.currentHp += after - before;
  }
}

function rollGatherSuccess(s: GameState, skill: SkillId, req: number): boolean {
  const chance = Math.min(0.95, 0.6 + (lvl(s, skill) - req) * 0.01);
  return Math.random() < chance;
}

function monsterAttacks(s: GameState, m: Monster) {
  if (Math.random() < monsterHitChance(s, m)) {
    const dmg = 1 + Math.floor(Math.random() * m.maxHit);
    s.currentHp -= dmg;
    pushLog(s, `${m.icon} ${m.name} hits you for ${dmg}.`, 'combat');
  } else {
    pushLog(s, `${m.icon} ${m.name} misses you.`, 'combat');
  }
  if (s.currentHp <= 0) {
    const lost = Math.floor(s.gold * 0.1);
    s.gold -= lost;
    s.currentHp = maxHp(s);
    s.activity = null;
    s.autoCombat = false;
    s.boosts = { attack: 0, strength: 0, defence: 0 };
    pushLog(s, `💀 You were slain by ${m.name}! You lost ${lost.toLocaleString()} gold and awaken at home.`, 'danger');
  }
}

function rollDrops(s: GameState, m: Monster) {
  const gold = m.gold[0] + Math.floor(Math.random() * (m.gold[1] - m.gold[0] + 1));
  if (gold > 0) {
    s.gold += gold;
    pushLog(s, `💰 Looted ${gold.toLocaleString()} gold.`, 'loot');
  }
  for (const d of m.drops) {
    if (Math.random() < d.chance) {
      const qty = d.min + Math.floor(Math.random() * (d.max - d.min + 1));
      addItem(s, d.itemId, qty);
      const item = ITEMS[d.itemId];
      const rare = d.chance <= 0.05 ? ' ✨ Rare drop!' : '';
      pushLog(s, `🎁 Loot: ${qty > 1 ? qty + '× ' : ''}${item?.name ?? d.itemId}.${rare}`, 'loot');
    }
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
    pushLog(s, `⚔️ You hit ${m.name} for ${dmg}.`, 'combat');
  } else {
    pushLog(s, `⚔️ You miss ${m.name}.`, 'combat');
  }
  if (dmg > 0) {
    if (o.style === 'melee') {
      grantXp(s, 'attack', dmg * 2);
      grantXp(s, 'strength', dmg * 2);
    } else {
      grantXp(s, o.style === 'ranged' ? 'ranged' : 'magic', dmg * 4);
    }
    grantXp(s, 'defence', dmg); // small defensive xp for surviving the exchange
    grantXp(s, 'hitpoints', Math.floor(dmg * 1.33));
  }
  if (s.activity.monsterHp <= 0) {
    s.kills[m.id] = (s.kills[m.id] ?? 0) + 1;
    pushLog(s, `🏆 You defeated ${m.name}!`, 'combat');
    rollDrops(s, m);
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

function combatRound(s: GameState) {
  if (s.activity?.type !== 'combat') return;
  const m = MONSTER_MAP[s.activity.monsterId];
  const died = playerAttacks(s, m);
  if (!died && s.activity?.type === 'combat') monsterAttacks(s, m);
}

function doCraftTick(s: GameState, recipeId: string) {
  const r = RECIPE_MAP[recipeId];
  const canAfford =
    (r.goldCost ?? 0) <= s.gold &&
    Object.entries(r.inputs).every(([id, qty]) => (s.inventory[id] ?? 0) >= qty);
  if (!canAfford) {
    s.activity = null;
    pushLog(s, `Out of materials for ${r.name}.`, 'info');
    return;
  }
  for (const [id, qty] of Object.entries(r.inputs)) removeItem(s, id, qty);
  s.gold -= r.goldCost ?? 0;
  if (r.burnChance !== undefined) {
    const burn = Math.max(0, r.burnChance - (lvl(s, r.skill) - r.level) * 0.02);
    if (Math.random() < burn) {
      grantXp(s, r.skill, Math.floor(r.xp / 10));
      pushLog(s, `🔥 You accidentally burn the ${ITEMS[r.output]?.name ?? r.output}.`, 'info');
      return;
    }
  }
  addItem(s, r.output, r.outputQty ?? 1);
  grantXp(s, r.skill, r.xp);
}

function reduce(state: GameState, action: Action): GameState {
  const s: GameState = structuredClone(state);

  switch (action.type) {
    case 'TICK': {
      if (s.activity?.type === 'gather') {
        const a = GATHER_MAP[s.activity.actionId];
        if (rollGatherSuccess(s, a.skill, a.level)) {
          addItem(s, a.output, 1);
          grantXp(s, a.skill, a.xp);
          // Mining occasionally turns up gems
          if (a.skill === 'mining' && Math.random() < 0.01) {
            const gem = (['sapphire', 'sapphire', 'emerald', 'ruby', 'diamond'] as const)[
              Math.floor(Math.random() * 5)
            ];
            addItem(s, gem, 1);
            pushLog(s, `✨ You unearth a ${ITEMS[gem].name}!`, 'loot');
          }
        }
      } else if (s.activity?.type === 'craft') {
        doCraftTick(s, s.activity.recipeId);
      } else if (s.activity?.type === 'combat' && s.autoCombat) {
        combatRound(s);
      } else if (!s.activity && s.currentHp < maxHp(s)) {
        s.currentHp += 1; // rest regen
      }
      return s;
    }

    case 'START_GATHER': {
      const a = GATHER_MAP[action.id];
      if (lvl(s, a.skill) < a.level) return state;
      s.activity = { type: 'gather', actionId: action.id };
      pushLog(s, `You begin ${a.name.toLowerCase()} (${SKILL_MAP[a.skill].name}).`);
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
        s.boosts = { attack: 0, strength: 0, defence: 0 };
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
      pushLog(s, `🍽️ You eat the ${item.name} and heal ${healed} HP.`);
      // Eating mid-fight costs your turn: the monster gets a free swing
      if (s.activity?.type === 'combat') monsterAttacks(s, MONSTER_MAP[s.activity.monsterId]);
      return s;
    }

    case 'DRINK': {
      const item = ITEMS[action.itemId];
      if (!item?.boost || !removeItem(s, action.itemId, 1)) return state;
      s.boosts[item.boost.skill] = Math.max(s.boosts[item.boost.skill], item.boost.amount);
      pushLog(s, `🧪 You drink the ${item.name} (+${item.boost.amount} ${item.boost.skill}).`);
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
      const gold = item.value * qty;
      s.gold += gold;
      pushLog(s, `💰 Sold ${qty}× ${item.name} for ${gold.toLocaleString()} gold.`);
      return s;
    }

    case 'BUY': {
      const entry = SHOP.find((e) => e.itemId === action.itemId);
      if (!entry || s.gold < entry.price) return state;
      s.gold -= entry.price;
      addItem(s, entry.itemId, 1);
      pushLog(s, `🛒 Bought ${ITEMS[entry.itemId].name} for ${entry.price.toLocaleString()} gold.`);
      return s;
    }

    case 'RESET':
      return initialState();

    default:
      return state;
  }
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
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
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
