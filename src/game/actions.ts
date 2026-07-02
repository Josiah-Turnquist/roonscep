import { GatherAction, ThieveAction } from './types';

export const GATHER_ACTIONS: GatherAction[] = [
  // Woodcutting
  { id: 'tree', name: 'Tree', icon: '🌳', skill: 'woodcutting', level: 1, xp: 25, output: 'logs' },
  { id: 'oak', name: 'Oak Tree', icon: '🌳', skill: 'woodcutting', level: 15, xp: 38, output: 'oak_logs' },
  { id: 'willow', name: 'Willow Tree', icon: '🌳', skill: 'woodcutting', level: 30, xp: 68, output: 'willow_logs' },
  { id: 'maple', name: 'Maple Tree', icon: '🍁', skill: 'woodcutting', level: 45, xp: 100, output: 'maple_logs' },
  { id: 'yew', name: 'Yew Tree', icon: '🌲', skill: 'woodcutting', level: 60, xp: 175, output: 'yew_logs' },
  { id: 'magic_tree', name: 'Magic Tree', icon: '🎄', skill: 'woodcutting', level: 75, xp: 250, output: 'magic_logs' },
  // Mining
  { id: 'copper', name: 'Copper Rock', icon: '🪨', skill: 'mining', level: 1, xp: 18, output: 'copper_ore' },
  { id: 'tin', name: 'Tin Rock', icon: '🪨', skill: 'mining', level: 1, xp: 18, output: 'tin_ore' },
  { id: 'iron', name: 'Iron Rock', icon: '🪨', skill: 'mining', level: 15, xp: 35, output: 'iron_ore' },
  { id: 'coal_rock', name: 'Coal Rock', icon: '🪨', skill: 'mining', level: 30, xp: 50, output: 'coal' },
  { id: 'mithril_rock', name: 'Mithril Rock', icon: '🪨', skill: 'mining', level: 50, xp: 80, output: 'mithril_ore' },
  { id: 'adamantite_rock', name: 'Adamantite Rock', icon: '🪨', skill: 'mining', level: 65, xp: 95, output: 'adamantite_ore' },
  { id: 'runite_rock', name: 'Runite Rock', icon: '🪨', skill: 'mining', level: 80, xp: 125, output: 'runite_ore' },
  // Fishing
  { id: 'shrimp_spot', name: 'Shrimp Pool', icon: '🌊', skill: 'fishing', level: 1, xp: 10, output: 'raw_shrimp' },
  { id: 'trout_spot', name: 'River Trout', icon: '🏞️', skill: 'fishing', level: 20, xp: 50, output: 'raw_trout' },
  { id: 'salmon_spot', name: 'River Salmon', icon: '🏞️', skill: 'fishing', level: 30, xp: 70, output: 'raw_salmon' },
  { id: 'lobster_spot', name: 'Lobster Cage', icon: '🦞', skill: 'fishing', level: 40, xp: 90, output: 'raw_lobster' },
  { id: 'swordfish_spot', name: 'Harpoon Swordfish', icon: '🌊', skill: 'fishing', level: 50, xp: 100, output: 'raw_swordfish' },
  { id: 'shark_spot', name: 'Harpoon Shark', icon: '🦈', skill: 'fishing', level: 76, xp: 110, output: 'raw_shark' },
  // Foraging
  { id: 'berry_bush', name: 'Berry Bush', icon: '🫐', skill: 'foraging', level: 1, xp: 8, output: 'berries' },
  { id: 'flax_field', name: 'Flax Field', icon: '🌾', skill: 'foraging', level: 10, xp: 15, output: 'flax' },
  { id: 'sunleaf_patch', name: 'Sunleaf Patch', icon: '🌿', skill: 'foraging', level: 20, xp: 30, output: 'sunleaf' },
  { id: 'mossbloom_patch', name: 'Mossbloom Hollow', icon: '☘️', skill: 'foraging', level: 35, xp: 60, output: 'mossbloom' },
  { id: 'dragonwort_patch', name: 'Dragonwort Grove', icon: '🍀', skill: 'foraging', level: 55, xp: 110, output: 'dragonwort' },
  { id: 'duskthorn_patch', name: 'Duskthorn Thicket', icon: '🥀', skill: 'foraging', level: 62, xp: 130, output: 'duskthorn' },
  { id: 'golden_orchard', name: 'Golden Orchard', icon: '🍎', skill: 'foraging', level: 70, xp: 150, output: 'golden_apple' },
  { id: 'voidcap_hollow', name: 'Voidcap Hollow', icon: '🍄', skill: 'foraging', level: 82, xp: 200, output: 'voidcap' },
];

export const GATHER_MAP = Object.fromEntries(GATHER_ACTIONS.map((a) => [a.id, a]));

export const THIEVE_ACTIONS: ThieveAction[] = [
  { id: 'urchin', name: 'Street Urchin', icon: '🧒', level: 1, xp: 8, gold: [3, 12], failDamage: [1, 2] },
  { id: 'farmer', name: 'Farmer', icon: '👨‍🌾', level: 10, xp: 20, gold: [10, 30], failDamage: [1, 3], loot: [{ itemId: 'berries', min: 1, max: 3, chance: 0.15 }] },
  { id: 'merchant', name: 'Merchant', icon: '🧑‍💼', level: 25, xp: 45, gold: [30, 80], failDamage: [2, 5], loot: [{ itemId: 'sapphire', min: 1, max: 1, chance: 0.02 }] },
  { id: 'noble', name: 'Noble', icon: '🤵', level: 45, xp: 85, gold: [80, 200], failDamage: [3, 7], loot: [{ itemId: 'emerald', min: 1, max: 1, chance: 0.03 }] },
  { id: 'knight', name: 'Knight', icon: '🏇', level: 60, xp: 130, gold: [150, 350], failDamage: [5, 10], loot: [{ itemId: 'ruby', min: 1, max: 1, chance: 0.03 }] },
  { id: 'elf', name: 'Elf Emissary', icon: '🧝', level: 75, xp: 190, gold: [280, 600], failDamage: [6, 14], loot: [{ itemId: 'diamond', min: 1, max: 1, chance: 0.03 }] },
];

export const THIEVE_MAP = Object.fromEntries(THIEVE_ACTIONS.map((a) => [a.id, a]));
