import { Item, SkillId } from './types';
import { SKILLS } from './skills';

/** Metal tiers shared by items (gear) and recipes (smithing). */
export const METALS = [
  { id: 'bronze', name: 'Bronze', smithLevel: 1, equipLevel: 1, barValue: 15, barXp: 6, smithXp: 13, ores: { copper_ore: 1, tin_ore: 1 }, att: 4, str: 3, defH: 3, defB: 6, defL: 4 },
  { id: 'iron', name: 'Iron', smithLevel: 15, equipLevel: 10, barValue: 30, barXp: 13, smithXp: 25, ores: { iron_ore: 1 }, att: 9, str: 7, defH: 6, defB: 12, defL: 9 },
  { id: 'steel', name: 'Steel', smithLevel: 30, equipLevel: 20, barValue: 60, barXp: 18, smithXp: 38, ores: { iron_ore: 1, coal: 2 }, att: 14, str: 12, defH: 9, defB: 18, defL: 13 },
  { id: 'mithril', name: 'Mithril', smithLevel: 50, equipLevel: 30, barValue: 150, barXp: 30, smithXp: 50, ores: { mithril_ore: 1, coal: 4 }, att: 20, str: 17, defH: 13, defB: 26, defL: 19 },
  { id: 'adamant', name: 'Adamant', smithLevel: 70, equipLevel: 40, barValue: 300, barXp: 38, smithXp: 63, ores: { adamantite_ore: 1, coal: 6 }, att: 28, str: 24, defH: 18, defB: 36, defL: 26 },
  { id: 'rune', name: 'Rune', smithLevel: 85, equipLevel: 50, barValue: 600, barXp: 50, smithXp: 75, ores: { runite_ore: 1, coal: 8 }, att: 38, str: 32, defH: 25, defB: 50, defL: 36 },
] as const;

/** Bow tiers shared by items and fletching recipes. */
export const BOWS = [
  { id: 'shortbow', name: 'Shortbow', logs: 'logs', fletchLevel: 1, equipLevel: 1, ranged: 6, xp: 15, value: 40 },
  { id: 'oak_shortbow', name: 'Oak Shortbow', logs: 'oak_logs', fletchLevel: 20, equipLevel: 10, ranged: 12, xp: 33, value: 100 },
  { id: 'willow_shortbow', name: 'Willow Shortbow', logs: 'willow_logs', fletchLevel: 35, equipLevel: 20, ranged: 20, xp: 50, value: 250 },
  { id: 'maple_shortbow', name: 'Maple Shortbow', logs: 'maple_logs', fletchLevel: 50, equipLevel: 30, ranged: 29, xp: 72, value: 600 },
  { id: 'yew_shortbow', name: 'Yew Shortbow', logs: 'yew_logs', fletchLevel: 65, equipLevel: 40, ranged: 38, xp: 100, value: 1200 },
  { id: 'magic_shortbow', name: 'Magic Shortbow', logs: 'magic_logs', fletchLevel: 80, equipLevel: 50, ranged: 50, xp: 140, value: 2500 },
] as const;

/** Fish shared by items (raw + cooked) and cooking recipes. */
export const FISH = [
  { raw: 'raw_shrimp', cooked: 'shrimp', name: 'Shrimp', fishLevel: 1, fishXp: 10, cookLevel: 1, cookXp: 30, heals: 3, rawValue: 3, value: 5, burn: 0.3 },
  { raw: 'raw_sardine', cooked: 'sardine', name: 'Sardine', fishLevel: 5, fishXp: 20, cookLevel: 5, cookXp: 40, heals: 4, rawValue: 5, value: 8, burn: 0.3 },
  { raw: 'raw_herring', cooked: 'herring', name: 'Herring', fishLevel: 12, fishXp: 30, cookLevel: 10, cookXp: 50, heals: 5, rawValue: 8, value: 12, burn: 0.32 },
  { raw: 'raw_trout', cooked: 'trout', name: 'Trout', fishLevel: 20, fishXp: 50, cookLevel: 15, cookXp: 70, heals: 7, rawValue: 12, value: 20, burn: 0.35 },
  { raw: 'raw_pike', cooked: 'pike', name: 'Pike', fishLevel: 25, fishXp: 60, cookLevel: 20, cookXp: 80, heals: 8, rawValue: 15, value: 25, burn: 0.35 },
  { raw: 'raw_salmon', cooked: 'salmon', name: 'Salmon', fishLevel: 30, fishXp: 70, cookLevel: 25, cookXp: 90, heals: 9, rawValue: 20, value: 30, burn: 0.35 },
  { raw: 'raw_lobster', cooked: 'lobster', name: 'Lobster', fishLevel: 40, fishXp: 90, cookLevel: 40, cookXp: 120, heals: 12, rawValue: 40, value: 60, burn: 0.4 },
  { raw: 'raw_swordfish', cooked: 'swordfish', name: 'Swordfish', fishLevel: 50, fishXp: 100, cookLevel: 45, cookXp: 140, heals: 14, rawValue: 65, value: 100, burn: 0.45 },
  { raw: 'raw_shark', cooked: 'shark', name: 'Shark', fishLevel: 76, fishXp: 110, cookLevel: 80, cookXp: 210, heals: 20, rawValue: 150, value: 220, burn: 0.45 },
] as const;

const list: Item[] = [
  // Logs
  { id: 'logs', name: 'Logs', icon: '🪵', value: 5 },
  { id: 'birch_logs', name: 'Birch Logs', icon: '🪵', value: 8 },
  { id: 'oak_logs', name: 'Oak Logs', icon: '🪵', value: 12 },
  { id: 'willow_logs', name: 'Willow Logs', icon: '🪵', value: 25 },
  { id: 'maple_logs', name: 'Maple Logs', icon: '🪵', value: 45 },
  { id: 'yew_logs', name: 'Yew Logs', icon: '🪵', value: 90 },
  { id: 'magic_logs', name: 'Magic Logs', icon: '🪵', value: 180 },
  // Ores
  { id: 'copper_ore', name: 'Copper Ore', icon: '🟠', value: 4 },
  { id: 'tin_ore', name: 'Tin Ore', icon: '⚪', value: 4 },
  { id: 'silver_ore', name: 'Silver Ore', icon: '⚪', value: 25 },
  { id: 'iron_ore', name: 'Iron Ore', icon: '🟤', value: 15 },
  { id: 'coal', name: 'Coal', icon: '⚫', value: 30 },
  { id: 'mithril_ore', name: 'Mithril Ore', icon: '🔵', value: 80 },
  { id: 'adamantite_ore', name: 'Adamantite Ore', icon: '🟢', value: 160 },
  { id: 'runite_ore', name: 'Runite Ore', icon: '🩵', value: 320 },
  // Gems
  { id: 'sapphire', name: 'Sapphire', icon: '💙', value: 150 },
  { id: 'emerald', name: 'Emerald', icon: '💚', value: 300 },
  { id: 'ruby', name: 'Ruby', icon: '❤️‍🔥', value: 600 },
  { id: 'diamond', name: 'Diamond', icon: '💎', value: 1200 },
  // Foraging
  { id: 'berries', name: 'Berries', icon: '🫐', value: 2, heals: 2 },
  { id: 'flax', name: 'Flax', icon: '🌾', value: 5 },
  { id: 'sunleaf', name: 'Sunleaf Herb', icon: '🌿', value: 15 },
  { id: 'mossbloom', name: 'Mossbloom Herb', icon: '☘️', value: 40 },
  { id: 'dragonwort', name: 'Dragonwort Herb', icon: '🍀', value: 90 },
  { id: 'duskthorn', name: 'Duskthorn Herb', icon: '🥀', value: 140 },
  { id: 'voidcap', name: 'Voidcap Mushroom', icon: '🍄', value: 220 },
  { id: 'golden_apple', name: 'Golden Apple', icon: '🍎', value: 120, heals: 10 },
  // Crafting materials & monster parts
  { id: 'bowstring', name: 'Bowstring', icon: '🧶', value: 20 },
  { id: 'cowhide', name: 'Cowhide', icon: '🐮', value: 8 },
  { id: 'leather', name: 'Leather', icon: '🟫', value: 15 },
  { id: 'dragonhide', name: 'Dragonhide', icon: '🐲', value: 120 },
  { id: 'bones', name: 'Bones', icon: '🦴', value: 4, bury: { xp: 5, points: 2 } },
  { id: 'big_bones', name: 'Big Bones', icon: '🦴', value: 12, bury: { xp: 15, points: 4 } },
  { id: 'dragon_bones', name: 'Dragon Bones', icon: '🦴', value: 50, bury: { xp: 72, points: 10 } },
  // Leather armour
  { id: 'leather_coif', name: 'Leather Coif', icon: '🪖', value: 30, slot: 'helmet', defenceBonus: 2, levelReq: { skill: 'defence', level: 1 } },
  { id: 'leather_body', name: 'Leather Body', icon: '🥋', value: 50, slot: 'body', defenceBonus: 4, levelReq: { skill: 'defence', level: 1 } },
  { id: 'leather_chaps', name: 'Leather Chaps', icon: '👖', value: 40, slot: 'legs', defenceBonus: 3, levelReq: { skill: 'defence', level: 1 } },
  // Dragonhide armour (ranged)
  { id: 'dragonhide_coif', name: 'Dragonhide Coif', icon: '🪖', value: 2000, slot: 'helmet', rangedBonus: 6, defenceBonus: 8, levelReq: { skill: 'ranged', level: 40 } },
  { id: 'dragonhide_body', name: 'Dragonhide Body', icon: '🥋', value: 4000, slot: 'body', rangedBonus: 10, defenceBonus: 14, levelReq: { skill: 'ranged', level: 40 } },
  { id: 'dragonhide_chaps', name: 'Dragonhide Chaps', icon: '👖', value: 3000, slot: 'legs', rangedBonus: 8, defenceBonus: 10, levelReq: { skill: 'ranged', level: 40 } },
  // Mystic robes (magic)
  { id: 'mystic_hat', name: 'Mystic Hat', icon: '🎩', value: 2000, slot: 'helmet', magicBonus: 5, defenceBonus: 4, levelReq: { skill: 'magic', level: 40 } },
  { id: 'mystic_robe_top', name: 'Mystic Robe Top', icon: '🥻', value: 4000, slot: 'body', magicBonus: 8, defenceBonus: 6, levelReq: { skill: 'magic', level: 40 } },
  { id: 'mystic_robe_bottom', name: 'Mystic Robe Bottom', icon: '👖', value: 3000, slot: 'legs', magicBonus: 6, defenceBonus: 5, levelReq: { skill: 'magic', level: 40 } },
  // Shields
  { id: 'wooden_shield', name: 'Wooden Shield', icon: '🛡️', value: 20, slot: 'shield', defenceBonus: 3, levelReq: { skill: 'defence', level: 1 } },
  // Staves
  { id: 'apprentice_staff', name: 'Apprentice Staff', icon: '🪄', value: 50, slot: 'weapon', combatStyle: 'magic', magicBonus: 6, levelReq: { skill: 'magic', level: 1 } },
  { id: 'adept_staff', name: 'Adept Staff', icon: '🪄', value: 800, slot: 'weapon', combatStyle: 'magic', magicBonus: 22, levelReq: { skill: 'magic', level: 30 } },
  { id: 'master_staff', name: 'Master Staff', icon: '🔮', value: 4000, slot: 'weapon', combatStyle: 'magic', magicBonus: 42, levelReq: { skill: 'magic', level: 60 } },
  // Gem amulets
  { id: 'silver_amulet', name: 'Silver Amulet', icon: '📿', value: 120, slot: 'amulet', attackBonus: 2, magicBonus: 2, levelReq: { skill: 'defence', level: 1 } },
  { id: 'sapphire_amulet', name: 'Sapphire Amulet', icon: '📿', value: 400, slot: 'amulet', attackBonus: 4, magicBonus: 4, levelReq: { skill: 'defence', level: 1 } },
  { id: 'emerald_amulet', name: 'Emerald Amulet', icon: '📿', value: 800, slot: 'amulet', defenceBonus: 6, rangedBonus: 4, levelReq: { skill: 'defence', level: 1 } },
  { id: 'ruby_amulet', name: 'Ruby Amulet', icon: '📿', value: 1500, slot: 'amulet', strengthBonus: 8, levelReq: { skill: 'defence', level: 1 } },
  { id: 'diamond_amulet', name: 'Diamond Amulet', icon: '📿', value: 3000, slot: 'amulet', attackBonus: 8, strengthBonus: 8, levelReq: { skill: 'defence', level: 1 } },
  // Potions
  { id: 'attack_potion', name: 'Attack Potion', icon: '🧪', value: 60, boost: { skill: 'attack', amount: 8 } },
  { id: 'strength_potion', name: 'Strength Potion', icon: '🧪', value: 80, boost: { skill: 'strength', amount: 8 } },
  { id: 'defence_potion', name: 'Defence Potion', icon: '🧪', value: 70, boost: { skill: 'defence', amount: 8 } },
  { id: 'ranging_potion', name: 'Ranging Potion', icon: '🧪', value: 120, boost: { skill: 'ranged', amount: 8 } },
  { id: 'magic_potion', name: 'Magic Potion', icon: '🧪', value: 120, boost: { skill: 'magic', amount: 8 } },
  { id: 'super_attack_potion', name: 'Super Attack Potion', icon: '⚗️', value: 250, boost: { skill: 'attack', amount: 14 } },
  { id: 'super_strength_potion', name: 'Super Strength Potion', icon: '⚗️', value: 300, boost: { skill: 'strength', amount: 14 } },
  { id: 'super_defence_potion', name: 'Super Defence Potion', icon: '⚗️', value: 280, boost: { skill: 'defence', amount: 14 } },
  { id: 'prayer_potion', name: 'Prayer Potion', icon: '🍷', value: 200, restorePrayer: 25 },
  { id: 'healing_elixir', name: 'Healing Elixir', icon: '🍶', value: 150, heals: 30 },
  // Boss & slayer uniques
  { id: 'bone_crusher', name: 'Bone Crusher', icon: '🦴', value: 5000, slot: 'weapon', combatStyle: 'melee', attackBonus: 22, strengthBonus: 24, levelReq: { skill: 'attack', level: 30 } },
  { id: 'obsidian_blade', name: 'Obsidian Blade', icon: '🗡️', value: 12000, slot: 'weapon', combatStyle: 'melee', attackBonus: 34, strengthBonus: 32, levelReq: { skill: 'attack', level: 45 } },
  { id: 'molten_shield', name: 'Molten Shield', icon: '🛡️', value: 10000, slot: 'shield', defenceBonus: 24, levelReq: { skill: 'defence', level: 40 } },
  { id: 'wyrm_scale_shield', name: 'Wyrm Scale Shield', icon: '🐲', value: 25000, slot: 'shield', defenceBonus: 38, levelReq: { skill: 'defence', level: 55 } },
  { id: 'frost_amulet', name: 'Frost Amulet', icon: '❄️', value: 20000, slot: 'amulet', attackBonus: 10, defenceBonus: 10, levelReq: { skill: 'defence', level: 40 } },
  { id: 'kings_greatsword', name: "King's Greatsword", icon: '⚔️', value: 60000, slot: 'weapon', combatStyle: 'melee', attackBonus: 48, strengthBonus: 45, levelReq: { skill: 'attack', level: 60 } },
  { id: 'crown_of_kings', name: 'Crown of Kings', icon: '👑', value: 50000, slot: 'helmet', defenceBonus: 32, levelReq: { skill: 'defence', level: 60 } },
  { id: 'void_amulet', name: 'Void Amulet', icon: '🌑', value: 150000, slot: 'amulet', attackBonus: 15, strengthBonus: 15, defenceBonus: 15, rangedBonus: 15, magicBonus: 15, levelReq: { skill: 'defence', level: 1 } },
  { id: 'abyssal_lash', name: 'Abyssal Lash', icon: '🐙', value: 120000, slot: 'weapon', combatStyle: 'melee', attackBonus: 42, strengthBonus: 40, levelReq: { skill: 'attack', level: 60 } },
  { id: 'soul_reaver', name: 'Soul Reaver', icon: '🌘', value: 500000, slot: 'weapon', combatStyle: 'melee', attackBonus: 52, strengthBonus: 50, levelReq: { skill: 'attack', level: 70 } },
  { id: 'void_staff', name: 'Void Staff', icon: '🌌', value: 500000, slot: 'weapon', combatStyle: 'magic', magicBonus: 55, levelReq: { skill: 'magic', level: 70 } },
  { id: 'soulbow', name: 'Soulbow', icon: '🏹', value: 500000, slot: 'weapon', combatStyle: 'ranged', rangedBonus: 58, levelReq: { skill: 'ranged', level: 70 } },
  // Slayer reward cape
  { id: 'slayer_cape', name: 'Slayer Cape', icon: '🧣', value: 99000, slot: 'cape', attackBonus: 4, strengthBonus: 4, rangedBonus: 4, magicBonus: 4, defenceBonus: 6, levelReq: { skill: 'slayer', level: 50 } },
];

// Generated: metal bars + melee gear per tier
for (const m of METALS) {
  list.push(
    { id: `${m.id}_bar`, name: `${m.name} Bar`, icon: '🧱', value: m.barValue },
    { id: `${m.id}_sword`, name: `${m.name} Sword`, icon: '🗡️', value: m.barValue * 2, slot: 'weapon', combatStyle: 'melee', attackBonus: m.att, strengthBonus: m.str, levelReq: { skill: 'attack', level: m.equipLevel } },
    { id: `${m.id}_helmet`, name: `${m.name} Helmet`, icon: '🪖', value: m.barValue * 2, slot: 'helmet', defenceBonus: m.defH, levelReq: { skill: 'defence', level: m.equipLevel } },
    { id: `${m.id}_platebody`, name: `${m.name} Platebody`, icon: '🎽', value: m.barValue * 6, slot: 'body', defenceBonus: m.defB, levelReq: { skill: 'defence', level: m.equipLevel } },
    { id: `${m.id}_platelegs`, name: `${m.name} Platelegs`, icon: '👖', value: m.barValue * 4, slot: 'legs', defenceBonus: m.defL, levelReq: { skill: 'defence', level: m.equipLevel } },
  );
}

// Generated: raw + cooked fish
for (const f of FISH) {
  list.push(
    { id: f.raw, name: `Raw ${f.name}`, icon: '🐟', value: f.rawValue },
    { id: f.cooked, name: f.name, icon: '🍤', value: f.value, heals: f.heals },
  );
}

// Generated: bows
for (const b of BOWS) {
  list.push({ id: b.id, name: b.name, icon: '🏹', value: b.value, slot: 'weapon', combatStyle: 'ranged', rangedBonus: b.ranged, levelReq: { skill: 'ranged', level: b.equipLevel } });
}

// Generated: Capes of Accomplishment, one per skill, requiring level 99
for (const sk of SKILLS) {
  list.push({
    id: `${sk.id}_cape`,
    name: `${sk.name} Cape`,
    icon: '🧣',
    value: 99000,
    slot: 'cape',
    defenceBonus: 8,
    levelReq: { skill: sk.id as SkillId, level: 99 },
  });
}

export const ITEMS: Record<string, Item> = Object.fromEntries(list.map((i) => [i.id, i]));
