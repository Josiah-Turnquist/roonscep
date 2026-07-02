import { Monster } from './types';

export const MONSTERS: Monster[] = [
  {
    id: 'giant_rat', name: 'Giant Rat', icon: '🐀', hp: 5, attack: 2, defence: 2, maxHit: 1,
    gold: [1, 5], drops: [{ itemId: 'bones', min: 1, max: 1, chance: 1 }],
    flavor: 'A mangy sewer-dweller. Everyone starts somewhere.',
  },
  {
    id: 'cow', name: 'Cow', icon: '🐄', hp: 6, attack: 2, defence: 3, maxHit: 1,
    gold: [0, 3],
    drops: [
      { itemId: 'bones', min: 1, max: 1, chance: 1 },
      { itemId: 'cowhide', min: 1, max: 1, chance: 1 },
    ],
    flavor: 'Docile, but its hide makes fine leather.',
  },
  {
    id: 'goblin', name: 'Goblin', icon: '👺', hp: 10, attack: 5, defence: 4, maxHit: 2,
    gold: [3, 12],
    drops: [
      { itemId: 'bones', min: 1, max: 1, chance: 1 },
      { itemId: 'bronze_sword', min: 1, max: 1, chance: 0.05 },
    ],
    flavor: 'Loud, green, and perpetually up to no good.',
  },
  {
    id: 'skeleton', name: 'Skeleton', icon: '💀', hp: 20, attack: 12, defence: 10, maxHit: 3,
    gold: [8, 25],
    drops: [
      { itemId: 'bones', min: 1, max: 2, chance: 1 },
      { itemId: 'iron_sword', min: 1, max: 1, chance: 0.04 },
    ],
    flavor: 'Rattles menacingly. Held together by spite.',
  },
  {
    id: 'zombie', name: 'Zombie', icon: '🧟', hp: 30, attack: 20, defence: 16, maxHit: 5,
    gold: [10, 35],
    drops: [
      { itemId: 'bones', min: 1, max: 2, chance: 1 },
      { itemId: 'iron_platebody', min: 1, max: 1, chance: 0.03 },
    ],
    flavor: 'Shambles with purpose. The purpose is you.',
  },
  {
    id: 'guard', name: 'Renegade Guard', icon: '💂', hp: 28, attack: 18, defence: 15, maxHit: 4,
    gold: [15, 40],
    drops: [
      { itemId: 'bones', min: 1, max: 1, chance: 1 },
      { itemId: 'steel_sword', min: 1, max: 1, chance: 0.03 },
      { itemId: 'steel_helmet', min: 1, max: 1, chance: 0.03 },
    ],
    flavor: 'Deserted his post; kept his training.',
  },
  {
    id: 'hill_giant', name: 'Hill Giant', icon: '🗿', hp: 40, attack: 25, defence: 20, maxHit: 6,
    gold: [20, 60],
    drops: [
      { itemId: 'big_bones', min: 1, max: 1, chance: 1 },
      { itemId: 'mithril_sword', min: 1, max: 1, chance: 0.02 },
      { itemId: 'sapphire', min: 1, max: 1, chance: 0.05 },
    ],
    flavor: 'Slow, enormous, and very territorial.',
  },
  {
    id: 'crawling_horror', name: 'Crawling Horror', icon: '🕷️', hp: 35, attack: 22, defence: 18, maxHit: 5,
    slayerReq: 15, gold: [20, 55],
    drops: [
      { itemId: 'sunleaf', min: 1, max: 3, chance: 0.5 },
      { itemId: 'emerald', min: 1, max: 1, chance: 0.06 },
      { itemId: 'mystic_hat', min: 1, max: 1, chance: 0.02 },
    ],
    flavor: 'Too many legs, too many eyes. Requires Slayer 15.',
  },
  {
    id: 'moss_giant', name: 'Moss Giant', icon: '🌳', hp: 60, attack: 33, defence: 28, maxHit: 8,
    gold: [30, 90],
    drops: [
      { itemId: 'big_bones', min: 1, max: 1, chance: 1 },
      { itemId: 'emerald', min: 1, max: 1, chance: 0.05 },
      { itemId: 'mithril_platebody', min: 1, max: 1, chance: 0.02 },
    ],
    flavor: 'Ancient stone bones wrapped in living moss.',
  },
  {
    id: 'black_knight', name: 'Black Knight', icon: '🏴', hp: 55, attack: 40, defence: 35, maxHit: 9,
    gold: [50, 130],
    drops: [
      { itemId: 'bones', min: 1, max: 1, chance: 1 },
      { itemId: 'adamant_sword', min: 1, max: 1, chance: 0.03 },
      { itemId: 'adamant_helmet', min: 1, max: 1, chance: 0.03 },
    ],
    flavor: 'Sworn to a dark order. Hits like it, too.',
  },
  {
    id: 'ice_troll', name: 'Ice Troll', icon: '🧌', hp: 70, attack: 38, defence: 33, maxHit: 9,
    gold: [40, 110],
    drops: [
      { itemId: 'big_bones', min: 1, max: 1, chance: 1 },
      { itemId: 'raw_shark', min: 1, max: 2, chance: 0.2 },
      { itemId: 'sapphire', min: 1, max: 2, chance: 0.08 },
    ],
    flavor: 'Cold hands, colder temper.',
  },
  {
    id: 'dust_wraith', name: 'Dust Wraith', icon: '🌪️', hp: 75, attack: 48, defence: 40, maxHit: 11,
    slayerReq: 40, gold: [60, 160],
    drops: [
      { itemId: 'adamantite_ore', min: 1, max: 2, chance: 0.3 },
      { itemId: 'ruby', min: 1, max: 1, chance: 0.06 },
      { itemId: 'mystic_robe_bottom', min: 1, max: 1, chance: 0.02 },
    ],
    flavor: 'A storm with a grudge and nothing left to lose. Requires Slayer 40.',
  },
  {
    id: 'lesser_demon', name: 'Lesser Demon', icon: '👹', hp: 82, attack: 50, defence: 45, maxHit: 11,
    gold: [80, 200],
    drops: [
      { itemId: 'ruby', min: 1, max: 1, chance: 0.06 },
      { itemId: 'rune_sword', min: 1, max: 1, chance: 0.01 },
      { itemId: 'adept_staff', min: 1, max: 1, chance: 0.03 },
      { itemId: 'mystic_robe_top', min: 1, max: 1, chance: 0.015 },
    ],
    flavor: 'Lesser only by demonic standards.',
  },
  {
    id: 'fire_giant', name: 'Fire Giant', icon: '🔥', hp: 85, attack: 55, defence: 48, maxHit: 12,
    gold: [90, 220],
    drops: [
      { itemId: 'big_bones', min: 1, max: 1, chance: 1 },
      { itemId: 'coal', min: 2, max: 6, chance: 0.5 },
      { itemId: 'rune_sword', min: 1, max: 1, chance: 0.008 },
    ],
    flavor: 'Smells of ash and bad intentions.',
  },
  {
    id: 'greater_demon', name: 'Greater Demon', icon: '😈', hp: 105, attack: 62, defence: 55, maxHit: 14,
    gold: [120, 300],
    drops: [
      { itemId: 'ruby', min: 1, max: 1, chance: 0.08 },
      { itemId: 'rune_platelegs', min: 1, max: 1, chance: 0.015 },
      { itemId: 'master_staff', min: 1, max: 1, chance: 0.01 },
      { itemId: 'mystic_hat', min: 1, max: 1, chance: 0.02 },
    ],
    flavor: 'The reason adventurers write wills.',
  },
  {
    id: 'blue_dragon', name: 'Blue Dragon', icon: '🐉', hp: 120, attack: 70, defence: 65, maxHit: 16,
    gold: [150, 400],
    drops: [
      { itemId: 'dragon_bones', min: 1, max: 1, chance: 1 },
      { itemId: 'dragonhide', min: 1, max: 2, chance: 1 },
      { itemId: 'diamond', min: 1, max: 1, chance: 0.06 },
      { itemId: 'rune_platebody', min: 1, max: 1, chance: 0.015 },
    ],
    flavor: 'Old, cold, and covered in sapphire scales.',
  },
  {
    id: 'abyssal_fiend', name: 'Abyssal Fiend', icon: '🐙', hp: 130, attack: 75, defence: 68, maxHit: 16,
    slayerReq: 75, gold: [180, 450],
    drops: [
      { itemId: 'dragonwort', min: 1, max: 3, chance: 0.4 },
      { itemId: 'abyssal_lash', min: 1, max: 1, chance: 0.02 },
      { itemId: 'diamond', min: 1, max: 1, chance: 0.08 },
    ],
    flavor: 'Reaches out from between worlds. Requires Slayer 75. Hoards the Abyssal Lash.',
  },
  // ——— Bosses ———
  {
    id: 'korgath', name: 'Korgath the Bonelord', icon: '☠️', boss: true, levelReq: 30,
    hp: 150, attack: 45, defence: 40, maxHit: 10, gold: [200, 500],
    drops: [
      { itemId: 'big_bones', min: 3, max: 8, chance: 1 },
      { itemId: 'bone_crusher', min: 1, max: 1, chance: 0.25 },
      { itemId: 'ruby', min: 1, max: 2, chance: 0.3 },
    ],
    flavor: 'A necromancer who became his own masterpiece. Drops the Bone Crusher.',
  },
  {
    id: 'embermaw', name: 'Embermaw the Molten', icon: '🌋', boss: true, levelReq: 50,
    hp: 250, attack: 65, defence: 55, maxHit: 14, gold: [500, 1200],
    drops: [
      { itemId: 'obsidian_blade', min: 1, max: 1, chance: 0.2 },
      { itemId: 'molten_shield', min: 1, max: 1, chance: 0.2 },
      { itemId: 'coal', min: 10, max: 25, chance: 1 },
    ],
    flavor: 'A living forge with a grudge. Drops the Obsidian Blade and Molten Shield.',
  },
  {
    id: 'frostfang', name: 'Frostfang Wyrm', icon: '🐲', boss: true, levelReq: 70,
    hp: 350, attack: 80, defence: 70, maxHit: 17, gold: [1000, 2500],
    drops: [
      { itemId: 'dragon_bones', min: 2, max: 5, chance: 1 },
      { itemId: 'dragonhide', min: 2, max: 4, chance: 1 },
      { itemId: 'wyrm_scale_shield', min: 1, max: 1, chance: 0.2 },
      { itemId: 'frost_amulet', min: 1, max: 1, chance: 0.15 },
    ],
    flavor: 'The glacier is its den; the blizzard, its breath. Drops wyrm-scale gear.',
  },
  {
    id: 'fallen_king', name: 'The Fallen King', icon: '🏰', boss: true, levelReq: 90,
    hp: 500, attack: 95, defence: 85, maxHit: 21, gold: [2000, 5000],
    drops: [
      { itemId: 'kings_greatsword', min: 1, max: 1, chance: 0.15 },
      { itemId: 'crown_of_kings', min: 1, max: 1, chance: 0.15 },
      { itemId: 'diamond', min: 1, max: 3, chance: 0.5 },
    ],
    flavor: 'He ruled for a century and refuses to stop. Drops royal regalia.',
  },
  {
    id: 'voidheart', name: 'Voidheart', icon: '🌑', boss: true, levelReq: 105,
    hp: 750, attack: 110, defence: 100, maxHit: 25, gold: [5000, 12000],
    drops: [
      { itemId: 'void_amulet', min: 1, max: 1, chance: 0.2 },
      { itemId: 'diamond', min: 2, max: 5, chance: 1 },
    ],
    flavor: 'The hungry dark at the end of everything. Drops the Void Amulet.',
  },
  {
    id: 'nethrax', name: 'Nethrax, Devourer of Souls', icon: '👁️', boss: true, levelReq: 110, slayerReq: 90,
    hp: 900, attack: 115, defence: 105, maxHit: 27, gold: [8000, 20000],
    drops: [
      { itemId: 'soul_reaver', min: 1, max: 1, chance: 0.12 },
      { itemId: 'void_staff', min: 1, max: 1, chance: 0.12 },
      { itemId: 'soulbow', min: 1, max: 1, chance: 0.12 },
      { itemId: 'diamond', min: 2, max: 6, chance: 1 },
    ],
    flavor: 'Only master slayers may face it (Slayer 90). Hoards the Soul Reaver, Void Staff and Soulbow.',
  },
];

export const MONSTER_MAP = Object.fromEntries(MONSTERS.map((m) => [m.id, m]));
export const REGULAR_MONSTERS = MONSTERS.filter((m) => !m.boss);
export const BOSSES = MONSTERS.filter((m) => m.boss);
