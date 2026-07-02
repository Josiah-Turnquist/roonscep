import { Quest } from './types';

export const QUESTS: Quest[] = [
  {
    id: 'rat_problem', name: 'A Rat Problem', icon: '🐀',
    flavor: 'The innkeeper swears the cellar rats are "the size of dogs". He is not wrong.',
    objectives: [{ type: 'kill', monsterId: 'giant_rat', count: 5 }],
    rewards: { gold: 300, xp: [{ skill: 'attack', amount: 250 }] },
  },
  {
    id: 'cowhide_couture', name: 'Cowhide Couture', icon: '🐄',
    flavor: 'The tanner needs hides, and the cows are not going to volunteer.',
    objectives: [{ type: 'item', itemId: 'cowhide', qty: 10 }],
    rewards: { gold: 500, xp: [{ skill: 'crafting', amount: 400 }], items: [{ itemId: 'leather', qty: 8 }] },
  },
  {
    id: 'smiths_apprentice', name: "The Smith's Apprentice", icon: '🔨',
    flavor: 'The blacksmith wants proof you can work a furnace without burning down the town.',
    objectives: [{ type: 'item', itemId: 'bronze_bar', qty: 5 }],
    rewards: { xp: [{ skill: 'smithing', amount: 600 }], items: [{ itemId: 'iron_sword', qty: 1 }] },
  },
  {
    id: 'fish_for_compliments', name: 'Fish for Compliments', icon: '🐟',
    flavor: 'The chef needs fifteen cooked trout for the harvest feast. No pressure.',
    objectives: [{ type: 'item', itemId: 'trout', qty: 15 }],
    rewards: { gold: 800, xp: [{ skill: 'fishing', amount: 900 }, { skill: 'cooking', amount: 500 }] },
  },
  {
    id: 'grave_matters', name: 'Grave Matters', icon: '⚰️',
    flavor: 'The priest asks you to lay the restless dead to rest. Bury their bones with honour.',
    objectives: [{ type: 'stat', stat: 'bonesBuried', count: 10 }],
    rewards: { xp: [{ skill: 'prayer', amount: 900 }], items: [{ itemId: 'big_bones', qty: 10 }] },
  },
  {
    id: 'light_fingers', name: 'Light Fingers', icon: '🎭',
    flavor: 'The Thieves\' Guild does not exist. The Thieves\' Guild would like 25 successful pickpockets.',
    objectives: [{ type: 'stat', stat: 'pickpockets', count: 25 }],
    rewards: { gold: 2000, xp: [{ skill: 'thieving', amount: 1200 }] },
  },
  {
    id: 'giant_trouble', name: 'Giant Trouble', icon: '🗿',
    flavor: 'The hill giants have started throwing boulders at the trade road. Throw something back.',
    objectives: [{ type: 'kill', monsterId: 'hill_giant', count: 10 }],
    rewards: { gold: 2500, xp: [{ skill: 'strength', amount: 2500 }] },
  },
  {
    id: 'demons_bane', name: "Demon's Bane", icon: '👹',
    flavor: 'A summoning circle went unsupervised. Now there are demons. There is always a summoning circle.',
    reqCombat: 40,
    objectives: [{ type: 'kill', monsterId: 'lesser_demon', count: 5 }],
    rewards: { xp: [{ skill: 'attack', amount: 5000 }], items: [{ itemId: 'adept_staff', qty: 1 }] },
  },
  {
    id: 'dragon_slayer', name: 'Dragon Slayer', icon: '🐉',
    flavor: 'Three blue dragons nest in the western peaks. The village would prefer zero.',
    reqCombat: 60, reqQuests: ['demons_bane'],
    objectives: [{ type: 'kill', monsterId: 'blue_dragon', count: 3 }],
    rewards: { gold: 10000, xp: [{ skill: 'defence', amount: 8000 }], items: [{ itemId: 'dragonhide', qty: 10 }] },
  },
  {
    id: 'the_kings_end', name: "The King's End", icon: '🏰',
    flavor: 'A century of tyranny ends today. Storm the ruined keep and finish the Fallen King.',
    reqQuests: ['dragon_slayer'],
    objectives: [{ type: 'kill', monsterId: 'fallen_king', count: 1 }],
    rewards: { gold: 25000, xp: [{ skill: 'hitpoints', amount: 12000 }], items: [{ itemId: 'diamond', qty: 3 }] },
  },
  {
    id: 'into_the_void', name: 'Into the Void', icon: '🌑',
    flavor: 'Something hungry watches from beyond the stars. Close its eye.',
    reqQuests: ['the_kings_end'],
    objectives: [{ type: 'kill', monsterId: 'voidheart', count: 1 }],
    rewards: { gold: 100000, xp: [{ skill: 'slayer', amount: 15000 }] },
  },
];

export const QUEST_MAP = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

// ——— shared quest progress helpers ———
import type { GameState } from './types';

export function questReqsMet(s: GameState, q: Quest, combatLvl: number): boolean {
  return (
    (!q.reqCombat || combatLvl >= q.reqCombat) &&
    (!q.reqQuests || q.reqQuests.every((id) => s.quests[id]?.status === 'done'))
  );
}

/** Progress toward each objective: [current, total]. Uses accept-time snapshots. */
export function objectiveProgress(s: GameState, q: Quest): [number, number][] {
  const p = s.quests[q.id];
  return q.objectives.map((o) => {
    if (o.type === 'kill') {
      const base = p?.killSnapshot[o.monsterId] ?? s.kills[o.monsterId] ?? 0;
      return [Math.min(o.count, (s.kills[o.monsterId] ?? 0) - base), o.count];
    }
    if (o.type === 'item') return [Math.min(o.qty, s.inventory[o.itemId] ?? 0), o.qty];
    const base = p?.statSnapshot[o.stat] ?? s.stats[o.stat];
    return [Math.min(o.count, s.stats[o.stat] - base), o.count];
  });
}

export function questReadyToTurnIn(s: GameState, q: Quest): boolean {
  if (s.quests[q.id]?.status !== 'active') return false;
  return objectiveProgress(s, q).every(([cur, total]) => cur >= total);
}
