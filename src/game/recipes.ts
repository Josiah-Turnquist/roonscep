import { Recipe } from './types';
import { BOWS, FISH, METALS } from './items';

const recipes: Recipe[] = [
  // Crafting
  { id: 'craft_leather', name: 'Tan Leather', icon: '🟫', skill: 'crafting', level: 1, xp: 14, inputs: { cowhide: 1 }, output: 'leather' },
  { id: 'craft_silver_amulet', name: 'Silver Amulet', icon: '📿', skill: 'crafting', level: 8, xp: 40, inputs: { silver_ore: 1 }, goldCost: 30, output: 'silver_amulet' },
  { id: 'craft_bowstring', name: 'Spin Bowstring', icon: '🧶', skill: 'crafting', level: 10, xp: 15, inputs: { flax: 2 }, output: 'bowstring' },
  { id: 'craft_coif', name: 'Leather Coif', icon: '🪖', skill: 'crafting', level: 9, xp: 25, inputs: { leather: 1 }, output: 'leather_coif' },
  { id: 'craft_chaps', name: 'Leather Chaps', icon: '👖', skill: 'crafting', level: 11, xp: 30, inputs: { leather: 2 }, output: 'leather_chaps' },
  { id: 'craft_body', name: 'Leather Body', icon: '🥋', skill: 'crafting', level: 14, xp: 35, inputs: { leather: 3 }, output: 'leather_body' },
  { id: 'craft_sapphire_amulet', name: 'Sapphire Amulet', icon: '📿', skill: 'crafting', level: 20, xp: 65, inputs: { sapphire: 1 }, goldCost: 100, output: 'sapphire_amulet' },
  { id: 'craft_emerald_amulet', name: 'Emerald Amulet', icon: '📿', skill: 'crafting', level: 35, xp: 85, inputs: { emerald: 1 }, goldCost: 250, output: 'emerald_amulet' },
  { id: 'craft_ruby_amulet', name: 'Ruby Amulet', icon: '📿', skill: 'crafting', level: 50, xp: 110, inputs: { ruby: 1 }, goldCost: 500, output: 'ruby_amulet' },
  { id: 'craft_dhide_coif', name: 'Dragonhide Coif', icon: '🪖', skill: 'crafting', level: 55, xp: 130, inputs: { dragonhide: 1 }, output: 'dragonhide_coif' },
  { id: 'craft_dhide_chaps', name: 'Dragonhide Chaps', icon: '👖', skill: 'crafting', level: 59, xp: 155, inputs: { dragonhide: 2 }, output: 'dragonhide_chaps' },
  { id: 'craft_dhide_body', name: 'Dragonhide Body', icon: '🥋', skill: 'crafting', level: 63, xp: 185, inputs: { dragonhide: 3 }, output: 'dragonhide_body' },
  { id: 'craft_diamond_amulet', name: 'Diamond Amulet', icon: '📿', skill: 'crafting', level: 70, xp: 140, inputs: { diamond: 1 }, goldCost: 1000, output: 'diamond_amulet' },
  // Alchemy
  { id: 'brew_attack', name: 'Attack Potion', icon: '🧪', skill: 'alchemy', level: 5, xp: 40, inputs: { sunleaf: 2 }, output: 'attack_potion' },
  { id: 'brew_defence', name: 'Defence Potion', icon: '🧪', skill: 'alchemy', level: 15, xp: 55, inputs: { sunleaf: 1, mossbloom: 1 }, output: 'defence_potion' },
  { id: 'brew_strength', name: 'Strength Potion', icon: '🧪', skill: 'alchemy', level: 25, xp: 70, inputs: { mossbloom: 2 }, output: 'strength_potion' },
  { id: 'brew_ranging', name: 'Ranging Potion', icon: '🧪', skill: 'alchemy', level: 35, xp: 85, inputs: { mossbloom: 1, dragonwort: 1 }, output: 'ranging_potion' },
  { id: 'brew_magic', name: 'Magic Potion', icon: '🧪', skill: 'alchemy', level: 40, xp: 95, inputs: { dragonwort: 1, sunleaf: 2 }, output: 'magic_potion' },
  { id: 'brew_elixir', name: 'Healing Elixir', icon: '🍶', skill: 'alchemy', level: 45, xp: 120, inputs: { dragonwort: 1, berries: 3 }, output: 'healing_elixir' },
  { id: 'brew_prayer', name: 'Prayer Potion', icon: '🍷', skill: 'alchemy', level: 50, xp: 130, inputs: { duskthorn: 1, berries: 2 }, output: 'prayer_potion' },
  { id: 'brew_super_attack', name: 'Super Attack Potion', icon: '⚗️', skill: 'alchemy', level: 60, xp: 160, inputs: { duskthorn: 1, sunleaf: 2 }, output: 'super_attack_potion' },
  { id: 'brew_super_defence', name: 'Super Defence Potion', icon: '⚗️', skill: 'alchemy', level: 66, xp: 175, inputs: { duskthorn: 1, mossbloom: 2 }, output: 'super_defence_potion' },
  { id: 'brew_super_strength', name: 'Super Strength Potion', icon: '⚗️', skill: 'alchemy', level: 72, xp: 190, inputs: { duskthorn: 2, dragonwort: 1 }, output: 'super_strength_potion' },
  { id: 'brew_void_elixir', name: 'Grand Healing Elixir', icon: '🍶', skill: 'alchemy', level: 85, xp: 260, inputs: { voidcap: 1, dragonwort: 1 }, output: 'healing_elixir', outputQty: 3 },
];

// Smithing: smelt bars, then forge gear
for (const m of METALS) {
  recipes.push({
    id: `smelt_${m.id}`, name: `Smelt ${m.name} Bar`, icon: '🧱', skill: 'smithing',
    level: m.smithLevel, xp: m.barXp, inputs: { ...m.ores }, output: `${m.id}_bar`,
    station: 'furnace',
  });
  const pieces = [
    { piece: 'sword', label: 'Sword', icon: '🗡️', bars: 1, extraLevel: 0 },
    { piece: 'helmet', label: 'Helmet', icon: '🪖', bars: 1, extraLevel: 2 },
    { piece: 'platelegs', label: 'Platelegs', icon: '👖', bars: 2, extraLevel: 4 },
    { piece: 'platebody', label: 'Platebody', icon: '🎽', bars: 3, extraLevel: 6 },
  ];
  for (const p of pieces) {
    recipes.push({
      id: `forge_${m.id}_${p.piece}`, name: `${m.name} ${p.label}`, icon: p.icon, skill: 'smithing',
      level: Math.min(99, m.smithLevel + p.extraLevel), xp: m.smithXp * p.bars,
      inputs: { [`${m.id}_bar`]: p.bars }, output: `${m.id}_${p.piece}`, station: 'anvil',
    });
  }
}

// Cooking
for (const f of FISH) {
  recipes.push({
    id: `cook_${f.cooked}`, name: `Cook ${f.name}`, icon: '🍳', skill: 'cooking',
    level: f.cookLevel, xp: f.cookXp, inputs: { [f.raw]: 1 }, output: f.cooked, burnChance: f.burn,
    station: 'range',
  });
}

// Fletching
for (const b of BOWS) {
  recipes.push({
    id: `fletch_${b.id}`, name: b.name, icon: '🏹', skill: 'fletching',
    level: b.fletchLevel, xp: b.xp, inputs: { [b.logs]: 1, bowstring: 1 }, output: b.id,
  });
}

export const RECIPES = recipes;
export const RECIPE_MAP = Object.fromEntries(recipes.map((r) => [r.id, r]));
