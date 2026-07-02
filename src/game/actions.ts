import { GatherAction } from './types';

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
  { id: 'golden_orchard', name: 'Golden Orchard', icon: '🍎', skill: 'foraging', level: 70, xp: 150, output: 'golden_apple' },
];

export const GATHER_MAP = Object.fromEntries(GATHER_ACTIONS.map((a) => [a.id, a]));
