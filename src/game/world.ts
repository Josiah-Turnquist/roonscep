// The overworld: a 72×48 tile map built programmatically, plus NPCs, monster
// spawns, resource nodes, crafting stations and boss lairs placed on it.

export const MAP_W = 72;
export const MAP_H = 48;

// ——— tile legend ———
// terrain: . grass  , path  : rocky ground  _ swamp  * snow  % emberdeep  ! void  ~ water  # wall  = wood floor
// trees:   T tree  O oak  W willow  P maple  Y yew  G magic
// rocks:   1 copper  2 tin  3 iron  4 coal  5 mithril  6 adamantite  7 runite
// fish:    f shrimp  g trout  j salmon  l lobster  w swordfish  x shark
// forage:  b berries  z flax  q sunleaf  d mossbloom  e dragonwort  n duskthorn  o golden apple  v voidcap
// stations: U furnace  A anvil  R range
// lairs:   K korgath  E embermaw  F frostfang  X fallen king  V voidheart  N nethrax

const WALKABLE = new Set(['.', ',', ':', '_', '*', '%', '!', '=']);

function buildMap(): string[][] {
  const g: string[][] = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('.'));
  const set = (x: number, y: number, c: string) => {
    if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) g[y][x] = c;
  };
  const fill = (x: number, y: number, w: number, h: number, c: string) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, c);
  };

  // Border cliffs
  fill(0, 0, MAP_W, 1, '#');
  fill(0, MAP_H - 1, MAP_W, 1, '#');
  fill(0, 0, 1, MAP_H, '#');
  fill(MAP_W - 1, 0, 1, MAP_H, '#');

  // — Willowmere Lake (NW) —
  fill(3, 2, 24, 8, '~');
  set(6, 9, 'f'); set(10, 9, 'f');
  set(16, 9, 'g'); set(20, 9, 'g');
  set(24, 6, 'j'); set(25, 4, 'j');
  set(13, 9, 'l');
  for (const x of [5, 9, 13, 17, 21]) set(x, 11, 'W');

  // — North Pass maples —
  set(31, 4, 'P'); set(33, 8, 'P'); set(36, 3, 'P'); set(38, 7, 'P');

  // — The Frozen Reach (NE) —
  fill(42, 1, 29, 11, '*');
  fill(58, 1, 10, 3, '~');
  set(60, 3, 'x'); set(64, 3, 'x');
  set(62, 3, 'w'); set(66, 3, 'w');
  set(66, 6, 'F'); // Frostfang's lair
  set(44, 2, 'Y'); set(52, 10, 'Y');

  // — Darkspine Mountains (E) —
  fill(48, 12, 23, 17, ':');
  // ridge walls for texture / routing
  for (const [wx, wy] of [[57, 14], [57, 15], [57, 16], [57, 17], [62, 20], [62, 21], [62, 22], [52, 22], [52, 23], [66, 13], [67, 13], [59, 26], [60, 26]] as const) set(wx, wy, '#');
  set(50, 15, '3'); set(52, 18, '3'); set(50, 21, '3'); set(53, 25, '3');
  set(55, 16, '4'); set(56, 20, '4'); set(55, 25, '4'); set(58, 13, '4');
  set(60, 17, '5'); set(61, 22, '5'); set(63, 19, '5');
  set(65, 16, '6'); set(66, 21, '6');
  set(68, 24, '7'); set(69, 19, '7');

  // — Havenbrook town —
  fill(8, 19, 21, 1, ','); // main street
  fill(17, 12, 1, 14, ','); // north-south road
  fill(29, 19, 19, 1, ','); // east road to the mountains
  fill(17, 26, 1, 4, ','); // south road into the swamp
  // General store
  fill(8, 14, 6, 4, '#'); fill(9, 15, 4, 2, '='); set(11, 17, '=');
  // Smithy
  fill(21, 14, 6, 4, '#'); fill(22, 15, 4, 2, '='); set(23, 17, '=');
  set(22, 15, 'U'); set(25, 15, 'A');
  // Inn
  fill(8, 21, 6, 4, '#'); fill(9, 22, 4, 2, '='); set(11, 21, '=');
  set(9, 22, 'R');
  // Chapel
  fill(21, 21, 6, 4, '#'); fill(22, 22, 4, 2, '='); set(23, 21, '=');

  // — Fields & Copperhill (around town) —
  set(12, 26, 'b'); set(14, 27, 'b');
  set(20, 26, 'z'); set(22, 27, 'z'); set(24, 26, 'z');
  set(31, 23, '1'); set(33, 25, '1'); set(35, 22, '1');
  set(32, 24, '2'); set(34, 23, '2'); set(36, 25, '2');

  // — Westwood & the Elder Grove (W) —
  for (const [tx, ty] of [[3, 13], [5, 16], [2, 18], [6, 21], [4, 26], [7, 24], [2, 28], [6, 27]] as const) set(tx, ty, 'T');
  for (const [tx, ty] of [[4, 17], [6, 13], [3, 21], [5, 25]] as const) set(tx, ty, 'O');
  set(2, 24, 'Y'); set(5, 29, 'Y');
  set(3, 32, 'G'); set(5, 33, 'G');
  set(2, 34, 'o'); set(4, 35, 'o');
  set(5, 22, 'q'); set(3, 26, 'q'); set(7, 30, 'q');

  // — Duskmire Swamp (S) —
  fill(6, 30, 36, 14, '_');
  // The Sunken Crypt
  fill(8, 36, 8, 6, '#'); fill(9, 37, 6, 4, '_'); set(12, 36, '_');
  set(10, 39, 'K'); // Korgath's lair
  set(18, 33, 'd'); set(24, 35, 'd'); set(30, 37, 'd'); set(21, 40, 'd');
  set(19, 38, 'e'); set(26, 41, 'e'); set(34, 39, 'e');
  set(17, 42, 'n'); set(23, 43, 'n'); set(32, 42, 'n');

  // — Ruined Castle (SE) —
  fill(50, 29, 20, 11, '#');
  fill(51, 30, 18, 9, ':');
  set(50, 34, ':'); // gate
  fill(42, 34, 8, 1, ','); // approach road
  set(66, 34, 'X'); // the Fallen King's throne

  // — Emberdeep (far S) —
  fill(44, 41, 26, 6, '%');
  set(46, 40, ':'); set(47, 40, ':'); // entrance from the castle road
  set(67, 44, 'E'); // Embermaw's forge-heart

  // — The Void Rift (S) —
  fill(30, 42, 10, 5, '!');
  set(31, 43, 'v'); set(38, 42, 'v');
  set(33, 45, 'V'); // Voidheart
  set(37, 45, 'N'); // Nethrax

  return g;
}

export const MAP: string[][] = buildMap();

export function tileAt(x: number, y: number): string {
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return '#';
  return MAP[y][x];
}

export function isWalkableTile(x: number, y: number): boolean {
  return WALKABLE.has(tileAt(x, y));
}

// ——— resource nodes ———

export interface ResourceConfig {
  actionId: string;
  /** Successful gathers before the node depletes; 0 = never depletes. */
  uses: number;
  /** Ticks until a depleted node returns. */
  respawn: number;
  depleteMsg: string;
}

export const RESOURCE_BY_CHAR: Record<string, ResourceConfig> = {
  T: { actionId: 'tree', uses: 6, respawn: 15, depleteMsg: 'The tree falls.' },
  O: { actionId: 'oak', uses: 6, respawn: 18, depleteMsg: 'The oak falls.' },
  W: { actionId: 'willow', uses: 6, respawn: 20, depleteMsg: 'The willow falls.' },
  P: { actionId: 'maple', uses: 6, respawn: 24, depleteMsg: 'The maple falls.' },
  Y: { actionId: 'yew', uses: 5, respawn: 30, depleteMsg: 'The yew falls.' },
  G: { actionId: 'magic_tree', uses: 4, respawn: 40, depleteMsg: 'The magic tree fades away.' },
  '1': { actionId: 'copper', uses: 4, respawn: 12, depleteMsg: 'The copper vein is exhausted.' },
  '2': { actionId: 'tin', uses: 4, respawn: 12, depleteMsg: 'The tin vein is exhausted.' },
  '3': { actionId: 'iron', uses: 4, respawn: 16, depleteMsg: 'The iron vein is exhausted.' },
  '4': { actionId: 'coal_rock', uses: 4, respawn: 20, depleteMsg: 'The coal seam is exhausted.' },
  '5': { actionId: 'mithril_rock', uses: 3, respawn: 28, depleteMsg: 'The mithril vein is exhausted.' },
  '6': { actionId: 'adamantite_rock', uses: 3, respawn: 34, depleteMsg: 'The adamantite vein is exhausted.' },
  '7': { actionId: 'runite_rock', uses: 2, respawn: 45, depleteMsg: 'The runite vein is exhausted.' },
  f: { actionId: 'shrimp_spot', uses: 0, respawn: 0, depleteMsg: '' },
  g: { actionId: 'trout_spot', uses: 0, respawn: 0, depleteMsg: '' },
  j: { actionId: 'salmon_spot', uses: 0, respawn: 0, depleteMsg: '' },
  l: { actionId: 'lobster_spot', uses: 0, respawn: 0, depleteMsg: '' },
  w: { actionId: 'swordfish_spot', uses: 0, respawn: 0, depleteMsg: '' },
  x: { actionId: 'shark_spot', uses: 0, respawn: 0, depleteMsg: '' },
  b: { actionId: 'berry_bush', uses: 5, respawn: 12, depleteMsg: 'The bush is picked clean.' },
  z: { actionId: 'flax_field', uses: 5, respawn: 12, depleteMsg: 'The flax is picked clean.' },
  q: { actionId: 'sunleaf_patch', uses: 5, respawn: 15, depleteMsg: 'The patch is picked clean.' },
  d: { actionId: 'mossbloom_patch', uses: 5, respawn: 18, depleteMsg: 'The hollow is picked clean.' },
  e: { actionId: 'dragonwort_patch', uses: 4, respawn: 22, depleteMsg: 'The grove is picked clean.' },
  n: { actionId: 'duskthorn_patch', uses: 4, respawn: 25, depleteMsg: 'The thicket is picked clean.' },
  o: { actionId: 'golden_orchard', uses: 4, respawn: 28, depleteMsg: 'The orchard is picked clean.' },
  v: { actionId: 'voidcap_hollow', uses: 3, respawn: 35, depleteMsg: 'The voidcaps crumble to dust.' },
};

// ——— stations & lairs ———

export type StationType = 'furnace' | 'anvil' | 'range';

export const STATION_BY_CHAR: Record<string, StationType> = { U: 'furnace', A: 'anvil', R: 'range' };

export const LAIR_BY_CHAR: Record<string, string> = {
  K: 'korgath', E: 'embermaw', F: 'frostfang', X: 'fallen_king', V: 'voidheart', N: 'nethrax',
};

export const STATIONS: { type: StationType; x: number; y: number }[] = [];
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const st = STATION_BY_CHAR[MAP[y][x]];
    if (st) STATIONS.push({ type: st, x, y });
  }
}

// ——— NPCs ———

export interface NpcDef {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  kind: 'shop' | 'slayer' | 'quest' | 'thieve';
  dialog: string;
  questIds?: string[];
  masterId?: string;
  thieveId?: string;
}

export const NPCS: NpcDef[] = [
  { id: 'marla', name: 'Shopkeeper Marla', icon: '🧑‍🌾', x: 11, y: 16, kind: 'shop', dialog: 'Welcome to the Havenbrook General Store! Buying or selling, love?' },
  { id: 'boren', name: 'Boren the Smith', icon: '🧔', x: 24, y: 16, kind: 'quest', questIds: ['smiths_apprentice'], dialog: 'The furnace and anvil are free for any hand that knows hot metal.' },
  { id: 'tam', name: 'Innkeeper Tam', icon: '🧑', x: 10, y: 23, kind: 'quest', questIds: ['rat_problem'], dialog: 'Mind the cellar door. The scratching started a fortnight ago…' },
  { id: 'colette', name: 'Chef Colette', icon: '👩‍🍳', x: 12, y: 22, kind: 'quest', questIds: ['fish_for_compliments'], dialog: 'A feast without trout is just a sad meeting with bread.' },
  { id: 'aldous', name: 'Father Aldous', icon: '🧓', x: 23, y: 23, kind: 'quest', questIds: ['grave_matters'], dialog: 'The dead of Duskmire do not sleep. Help me give them rest.' },
  { id: 'hesta', name: 'Hesta the Tanner', icon: '👩‍🔧', x: 14, y: 20, kind: 'quest', questIds: ['cowhide_couture'], dialog: 'Hides! Fresh hides! The pasture cows practically donate them.' },
  { id: 'bram', name: 'Mayor Bram', icon: '🤵', x: 18, y: 18, kind: 'quest', questIds: ['giant_trouble'], dialog: 'Boulders on the trade road again. This town cannot afford giants.' },
  { id: 'elowen', name: 'Elowen the Wizard', icon: '🧙‍♀️', x: 4, y: 15, kind: 'quest', questIds: ['demons_bane'], dialog: 'I told the apprentices: NO unsupervised summoning circles.' },
  { id: 'vex', name: 'A Shady Figure', icon: '🕵️', x: 26, y: 24, kind: 'quest', questIds: ['light_fingers'], dialog: 'The Guild that does not exist is always recruiting. Hypothetically.' },
  { id: 'roderic', name: 'Steward Roderic', icon: '🫅', x: 47, y: 34, kind: 'quest', questIds: ['dragon_slayer', 'the_kings_end', 'into_the_void'], dialog: 'The castle has not known a rightful ruler in a hundred years.' },
  { id: 'mira', name: 'Mira the Novice', icon: '🧝‍♀️', x: 19, y: 20, kind: 'slayer', masterId: 'mira', dialog: 'Everyone starts with rats. Even the legends. Especially the legends.' },
  { id: 'dorn', name: 'Dorn Ironfist', icon: '🧔‍♂️', x: 49, y: 13, kind: 'slayer', masterId: 'dorn', dialog: 'The mountains breed hard beasts. I keep the ledger of which must die.' },
  { id: 'zyra', name: 'Zyra the Veiled', icon: '🧛‍♀️', x: 45, y: 42, kind: 'slayer', masterId: 'zyra', dialog: 'You smell the sulfur? Good. Fear keeps slayers alive.' },
  { id: 'pick_urchin', name: 'Street Urchin', icon: '🧒', x: 15, y: 20, kind: 'thieve', thieveId: 'urchin', dialog: 'Spare a coin? No? Worth a try.' },
  { id: 'pick_farmer', name: 'Farmer Gwen', icon: '👨‍🌾', x: 34, y: 18, kind: 'thieve', thieveId: 'farmer', dialog: 'These cows will not herd themselves.' },
  { id: 'pick_merchant', name: 'Traveling Merchant', icon: '🧑‍💼', x: 13, y: 18, kind: 'thieve', thieveId: 'merchant', dialog: 'Finest silks east of the mountains! Do not touch.' },
  { id: 'pick_noble', name: 'Idle Noble', icon: '🤵‍♂️', x: 55, y: 31, kind: 'thieve', thieveId: 'noble', dialog: 'Guards! Is that a commoner looking at me?' },
  { id: 'pick_knight', name: 'Castle Knight', icon: '🏇', x: 63, y: 35, kind: 'thieve', thieveId: 'knight', dialog: 'The King will rise again. We keep the watch.' },
  { id: 'pick_elf', name: 'Elf Emissary', icon: '🧝', x: 3, y: 30, kind: 'thieve', thieveId: 'elf', dialog: 'The grove remembers when your town was a single campfire.' },
];

export const NPC_MAP = Object.fromEntries(NPCS.map((n) => [n.id, n]));

const npcTiles = new Set(NPCS.map((n) => `${n.x},${n.y}`));

export function isWalkable(x: number, y: number): boolean {
  return isWalkableTile(x, y) && !npcTiles.has(`${x},${y}`);
}

// ——— monster spawns ———

export interface SpawnDef {
  defId: string;
  x: number;
  y: number;
}

export const SPAWNS: SpawnDef[] = [
  ...([[29, 21], [30, 22], [28, 24], [29, 25]] as const).map(([x, y]) => ({ defId: 'giant_rat', x, y })),
  ...([[33, 15], [35, 16], [37, 15], [34, 17], [36, 18]] as const).map(([x, y]) => ({ defId: 'cow', x, y })),
  ...([[37, 23], [38, 25], [36, 26], [39, 22]] as const).map(([x, y]) => ({ defId: 'goblin', x, y })),
  ...([[12, 32], [16, 33], [20, 32], [24, 33]] as const).map(([x, y]) => ({ defId: 'skeleton', x, y })),
  ...([[14, 35], [18, 35], [22, 35], [26, 35]] as const).map(([x, y]) => ({ defId: 'zombie', x, y })),
  ...([[46, 34], [48, 33]] as const).map(([x, y]) => ({ defId: 'guard', x, y })),
  ...([[43, 15], [45, 18], [44, 22], [46, 25]] as const).map(([x, y]) => ({ defId: 'hill_giant', x, y })),
  ...([[26, 39], [30, 40], [33, 38], [28, 42]] as const).map(([x, y]) => ({ defId: 'moss_giant', x, y })),
  ...([[54, 32], [58, 36], [62, 32], [64, 37]] as const).map(([x, y]) => ({ defId: 'black_knight', x, y })),
  ...([[45, 4], [49, 7], [53, 5], [47, 9], [56, 7]] as const).map(([x, y]) => ({ defId: 'ice_troll', x, y })),
  ...([[58, 19], [60, 23], [63, 21]] as const).map(([x, y]) => ({ defId: 'dust_wraith', x, y })),
  ...([[47, 43], [50, 44], [53, 43]] as const).map(([x, y]) => ({ defId: 'lesser_demon', x, y })),
  ...([[56, 44], [59, 43], [62, 45]] as const).map(([x, y]) => ({ defId: 'fire_giant', x, y })),
  ...([[64, 42], [60, 45], [57, 42]] as const).map(([x, y]) => ({ defId: 'greater_demon', x, y })),
  ...([[61, 7], [65, 9], [68, 6]] as const).map(([x, y]) => ({ defId: 'blue_dragon', x, y })),
  ...([[13, 38], [11, 40], [14, 39]] as const).map(([x, y]) => ({ defId: 'crawling_horror', x, y })),
  ...([[31, 44], [34, 43], [38, 43]] as const).map(([x, y]) => ({ defId: 'abyssal_fiend', x, y })),
];

/** Where you wake up (Havenbrook square) and where a new game starts. */
export const HOME = { x: 17, y: 20 };

// ——— zones ———

interface Zone {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ZONES: Zone[] = [
  { name: 'The Sunken Crypt', x: 8, y: 36, w: 8, h: 6 },
  { name: 'Havenbrook', x: 6, y: 12, w: 23, h: 16 },
  { name: 'Willowmere Lake', x: 1, y: 1, w: 30, h: 11 },
  { name: 'The Frozen Reach', x: 40, y: 1, w: 31, h: 11 },
  { name: 'Darkspine Mountains', x: 48, y: 12, w: 23, h: 17 },
  { name: 'The Ruined Castle', x: 48, y: 29, w: 23, h: 12 },
  { name: 'Emberdeep', x: 43, y: 40, w: 28, h: 7 },
  { name: 'The Void Rift', x: 29, y: 41, w: 12, h: 6 },
  { name: 'Duskmire Swamp', x: 4, y: 29, w: 40, h: 16 },
  { name: 'The Elder Grove', x: 1, y: 28, w: 8, h: 10 },
  { name: 'Westwood', x: 1, y: 12, w: 7, h: 16 },
  { name: 'Greenfields', x: 28, y: 12, w: 20, h: 17 },
];

export function zoneName(x: number, y: number): string {
  for (const z of ZONES) {
    if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z.name;
  }
  return 'The Wilds';
}
