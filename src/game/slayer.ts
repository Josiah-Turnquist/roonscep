export interface SlayerMaster {
  id: string;
  name: string;
  icon: string;
  minCombat: number;
  /** Slayer points granted per completed task. */
  points: number;
  count: [number, number];
  pool: string[];
  blurb: string;
}

export const SLAYER_MASTERS: SlayerMaster[] = [
  {
    id: 'mira', name: 'Mira the Novice', icon: '🧝‍♀️', minCombat: 0, points: 3, count: [10, 20],
    pool: ['giant_rat', 'cow', 'goblin', 'skeleton', 'zombie', 'guard'],
    blurb: 'Kind eyes, sharp knives. Assigns gentle prey.',
  },
  {
    id: 'dorn', name: 'Dorn Ironfist', icon: '🧔', minCombat: 40, points: 8, count: [15, 30],
    pool: ['guard', 'zombie', 'hill_giant', 'crawling_horror', 'moss_giant', 'black_knight', 'ice_troll'],
    blurb: 'Retired boss-hunter. Assigns real fights. Requires combat 40.',
  },
  {
    id: 'zyra', name: 'Zyra the Veiled', icon: '🧛‍♀️', minCombat: 80, points: 15, count: [20, 40],
    pool: ['lesser_demon', 'fire_giant', 'dust_wraith', 'greater_demon', 'blue_dragon', 'abyssal_fiend'],
    blurb: 'Nobody has seen her blink. Assigns nightmares. Requires combat 80.',
  },
];

export const SLAYER_MASTER_MAP = Object.fromEntries(SLAYER_MASTERS.map((m) => [m.id, m]));

export interface SlayerReward {
  id: string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
  items?: { itemId: string; qty: number }[];
  gold?: number;
}

export const SLAYER_REWARDS: SlayerReward[] = [
  { id: 'coal_pack', name: 'Coal Pack', icon: '⚫', cost: 8, desc: '30 coal for the forge', items: [{ itemId: 'coal', qty: 30 }] },
  { id: 'herb_pack', name: 'Herb Pack', icon: '🌿', cost: 12, desc: '5 mossbloom + 3 dragonwort', items: [{ itemId: 'mossbloom', qty: 5 }, { itemId: 'dragonwort', qty: 3 }] },
  { id: 'gem_pack', name: 'Gem Pack', icon: '💎', cost: 15, desc: '1 sapphire, emerald and ruby', items: [{ itemId: 'sapphire', qty: 1 }, { itemId: 'emerald', qty: 1 }, { itemId: 'ruby', qty: 1 }] },
  { id: 'gold_pouch', name: 'Gold Pouch', icon: '💰', cost: 20, desc: '5,000 gold coins', gold: 5000 },
  { id: 'slayer_cape', name: 'Slayer Cape', icon: '🧣', cost: 150, desc: 'Badge of a true hunter (+4 offence, +6 defence). Requires Slayer 50 to wear.', items: [{ itemId: 'slayer_cape', qty: 1 }] },
];
