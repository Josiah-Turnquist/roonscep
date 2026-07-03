// The overworld: a 240×144 tile realm built programmatically, plus NPCs,
// monster spawns, resource nodes, crafting stations and boss lairs.
//
// Geography, west to east / north to south:
//   The North Shore & sea — beaches along the whole top edge
//   Port Selwick — fishing town on the coast, pier, smokehouse, second shop
//   The Selwick River — flows from Willowmere Lake to the sea, crossed by
//     Stonebridge on the northern highway
//   Willowmere Lake & Westwood (NW), Elder Grove (deep SW)
//   Havenbrook — the starting town, center-west, at the crossroads
//   Greenfields & Copperhill — pastures and starter mining east of town
//   The North Pass — maple and birch woods between town and the coast
//   The Frozen Reach — snowfields and an ice bay, NE quarter
//   Darkspine Mountains — eastern range; ore grows richer the deeper you go
//   Duskmire Swamp & the Sunken Crypt — the rotten south
//   The Ruined Castle — south-east, the Fallen King's seat
//   Emberdeep — volcanic far SE; The Void Rift — a scar in the far south

export const MAP_W = 240;
export const MAP_H = 144;

// ——— tile legend ———
// terrain: . grass  , road  ; sand  : rocky  _ swamp  * snow  % ember  ! void  ~ water  # wall  = wood floor/bridge
// trees:   T tree  h birch  O oak  W willow  P maple  Y yew  G magic
// rocks:   1 copper  2 tin  8 silver  3 iron  4 coal  5 mithril  6 adamantite  7 runite
// fish:    f shrimp  a sardine  c herring  g trout  j salmon  u pike  l lobster  w swordfish  x shark
// forage:  b berries  z flax  q sunleaf  d mossbloom  e dragonwort  n duskthorn  o golden apple  v voidcap
// stations: U furnace  A anvil  R range
// lairs:   K korgath  E embermaw  F frostfang  X fallen king  V voidheart  N nethrax

const WALKABLE = new Set(['.', ',', ';', ':', '_', '*', '%', '!', '=']);

function buildMap(): string[][] {
  const g: string[][] = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('.'));
  const set = (x: number, y: number, c: string) => {
    if (x >= 1 && x < MAP_W - 1 && y >= 1 && y < MAP_H - 1) g[y][x] = c;
  };
  const fill = (x: number, y: number, w: number, h: number, c: string) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, c);
  };
  const disc = (cx: number, cy: number, r: number, c: string) => {
    for (let j = cy - r; j <= cy + r; j++)
      for (let i = cx - r; i <= cx + r; i++)
        if ((i - cx) * (i - cx) + (j - cy) * (j - cy) <= r * r) set(i, j, c);
  };
  const hash01 = (a: number, b: number) => {
    const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  /** Deterministically scatter n of char inside a rect, only on `on` tiles. */
  const scatter = (c: string, x: number, y: number, w: number, h: number, n: number, seed: number, on = '.') => {
    let placed = 0;
    for (let k = 0; placed < n && k < n * 40; k++) {
      const i = x + Math.floor(hash01(seed, k) * w);
      const j = y + Math.floor(hash01(seed * 7 + 3, k * 5 + 1) * h);
      if (g[j]?.[i] === on) {
        set(i, j, c);
        placed++;
      }
    }
  };
  /** Fill a rect with feathered, ragged edges so biomes read as natural. */
  const organic = (x: number, y: number, w: number, h: number, c: string, feather = 5) => {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        const d = Math.min(i - x, x + w - 1 - i, j - y, y + h - 1 - j);
        if (d >= feather || hash01(i * 3 + 7, j * 5 + 11) < (d + 1) / (feather + 1)) set(i, j, c);
      }
    }
  };
  /** Lay road over natural terrain without carving through water or walls. */
  const road = (x: number, y: number) => {
    if ('.;:_*'.includes(g[y]?.[x] ?? '#')) set(x, y, ',');
  };
  const hRoad = (x1: number, x2: number, y: number) => {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) road(x, y);
  };
  const vRoad = (y1: number, y2: number, x: number) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) road(x, y);
  };
  const building = (x: number, y: number, w: number, h: number, doorX: number, doorY: number) => {
    fill(x, y, w, h, '#');
    fill(x + 1, y + 1, w - 2, h - 2, '=');
    set(doorX, doorY, '=');
  };

  // ——— border cliffs ———
  fill(0, 0, MAP_W, 1, '#');
  fill(0, MAP_H - 1, MAP_W, 1, '#');
  fill(0, 0, 1, MAP_H, '#');
  fill(MAP_W - 1, 0, 1, MAP_H, '#');

  // ——— the sea & the North Shore ———
  fill(1, 1, MAP_W - 2, 12, '~');
  fill(1, 13, MAP_W - 2, 3, ';');
  organic(1, 15, MAP_W - 2, 4, ';', 3); // the beach fades raggedly into grass

  // ——— the Frozen Reach (NE quarter, swallows its stretch of coast) ———
  organic(148, 1, 90, 42, '*', 7);
  fill(188, 4, 34, 7, '~'); // the ice bay
  set(196, 11, 'x'); set(214, 11, 'x');
  set(204, 11, 'w'); set(220, 8, 'w');
  set(156, 18, 'Y'); set(164, 30, 'Y'); set(178, 24, 'Y'); set(158, 34, 'Y');
  set(216, 14, 'F'); // Frostfang's lair, on the bay's south shore

  // ——— Willowmere Lake & the Selwick River ———
  disc(38, 38, 15, '~');
  disc(52, 32, 9, '~');
  disc(28, 46, 8, '~');
  disc(47, 45, 6, '~');
  disc(30, 27, 7, '~');
  fill(60, 14, 4, 20, '~'); // the river runs north to the sea
  fill(56, 30, 8, 6, '~'); // joining the lake
  // fishing waters
  set(30, 36, 'f'); set(45, 28, 'f');
  set(61, 25, 'g'); set(62, 17, 'g'); set(59, 31, 'g');
  set(44, 46, 'j'); set(28, 44, 'j');
  set(38, 51, 'u'); set(51, 39, 'u');
  // willows ring the shore
  for (const [wx, wy] of [[24, 26], [32, 22], [46, 22], [56, 26], [20, 42], [28, 50], [46, 50]] as const) set(wx, wy, 'W');

  // ——— Stonebridge & the northern highway ———
  fill(59, 21, 6, 2, '='); // the bridge itself
  hRoad(44, 58, 22);
  hRoad(65, 100, 22);

  // ——— Port Selwick ———
  fill(100, 16, 34, 15, ';'); // the town stands on sand
  fill(112, 5, 3, 11, '='); // the pier
  set(111, 8, 'l'); set(116, 10, 'l');
  set(111, 12, 'w');
  set(116, 6, 'x');
  set(105, 12, 'a'); set(96, 12, 'a');
  set(125, 12, 'c'); set(131, 12, 'c');
  building(102, 17, 8, 6, 106, 22); // Sella's port store
  building(120, 17, 8, 6, 124, 22); // the smokehouse
  set(122, 19, 'R');
  hRoad(100, 132, 24);
  vRoad(24, 32, 100);

  // ——— roads: the realm's spine ———
  vRoad(32, 58, 100); // port → Havenbrook north gate
  hRoad(48, 172, 74); // Westwood → Havenbrook → Darkspine camp
  vRoad(90, 106, 88); // Havenbrook → the swamp
  vRoad(94, 100, 150); // castle approach

  // ——— Westwood & the Elder Grove: an actual forest ———
  scatter('T', 6, 52, 40, 46, 90, 11);
  scatter('O', 8, 56, 36, 40, 40, 12);
  scatter('Y', 6, 80, 30, 20, 12, 13);
  scatter('q', 40, 56, 12, 36, 6, 14);
  scatter('T', 8, 102, 28, 26, 26, 33); // the grove's outer woods
  set(12, 108, 'G'); set(20, 116, 'G'); set(28, 110, 'G'); set(16, 122, 'G'); set(24, 106, 'G');
  set(16, 106, 'o'); set(24, 120, 'o'); set(10, 118, 'o'); set(30, 114, 'o');

  // ——— the North Pass ———
  scatter('P', 60, 32, 40, 22, 28, 15);
  scatter('h', 58, 34, 44, 22, 22, 16);
  scatter('T', 66, 36, 32, 18, 14, 34);

  // ——— Havenbrook ———
  fill(84, 70, 12, 9, ','); // the town square
  building(74, 60, 8, 6, 78, 65); // general store
  building(84, 60, 8, 6, 88, 65); // town hall
  building(96, 60, 9, 6, 100, 65); // the smithy
  set(98, 62, 'U'); set(102, 62, 'A');
  building(74, 80, 8, 6, 78, 80); // the inn
  set(76, 82, 'R');
  building(96, 80, 9, 6, 100, 80); // the chapel
  set(90, 74, '#'); // the town well

  // ——— fields south of town ———
  scatter('b', 76, 92, 28, 10, 6, 17);
  scatter('z', 76, 92, 28, 10, 6, 18);

  // ——— Greenfields & Copperhill ———
  scatter('T', 110, 52, 56, 40, 34, 19);
  scatter('h', 104, 44, 40, 12, 6, 35);
  scatter('b', 112, 84, 30, 12, 3, 36);
  scatter('1', 130, 74, 22, 16, 7, 20);
  scatter('2', 130, 74, 22, 16, 7, 21);
  scatter('8', 132, 66, 18, 7, 4, 22);

  // ——— Darkspine Mountains: richer ore the deeper you climb ———
  organic(170, 42, 68, 64, ':', 6);
  fill(188, 50, 2, 20, '#');
  fill(204, 70, 2, 24, '#');
  fill(214, 48, 2, 18, '#');
  fill(196, 88, 2, 14, '#');
  scatter('3', 174, 46, 18, 34, 9, 23, ':');
  scatter('4', 180, 48, 22, 36, 9, 24, ':');
  scatter('5', 196, 52, 14, 32, 6, 25, ':');
  scatter('6', 210, 54, 12, 30, 4, 26, ':');
  set(224, 66, '7'); set(228, 88, '7'); set(232, 76, '7');

  // ——— Duskmire Swamp & the Sunken Crypt ———
  organic(40, 102, 88, 40, '_', 6);
  scatter('d', 46, 106, 76, 30, 8, 27, '_');
  scatter('e', 60, 112, 60, 26, 6, 28, '_');
  scatter('n', 80, 118, 44, 20, 6, 29, '_');
  fill(54, 116, 20, 18, '#');
  fill(56, 118, 16, 14, '_');
  set(63, 116, '_'); set(64, 116, '_'); // the crypt mouth
  set(62, 126, 'K'); // Korgath's lair

  // ——— the Ruined Castle ———
  fill(132, 100, 44, 28, '#');
  fill(134, 102, 40, 24, ':');
  set(150, 100, ':'); set(151, 100, ':'); // the shattered gate
  set(168, 112, 'X'); // the Fallen King's throne

  // ——— Emberdeep ———
  organic(176, 110, 62, 32, '%', 5);
  set(226, 132, 'E'); // Embermaw's forge-heart

  // ——— the Void Rift ———
  organic(119, 131, 28, 12, '!', 3);
  set(122, 134, 'v'); set(134, 133, 'v'); set(143, 136, 'v');
  set(128, 136, 'V'); // Voidheart
  set(140, 138, 'N'); // Nethrax

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
  h: { actionId: 'birch', uses: 6, respawn: 16, depleteMsg: 'The birch falls.' },
  O: { actionId: 'oak', uses: 6, respawn: 18, depleteMsg: 'The oak falls.' },
  W: { actionId: 'willow', uses: 6, respawn: 20, depleteMsg: 'The willow falls.' },
  P: { actionId: 'maple', uses: 6, respawn: 24, depleteMsg: 'The maple falls.' },
  Y: { actionId: 'yew', uses: 5, respawn: 30, depleteMsg: 'The yew falls.' },
  G: { actionId: 'magic_tree', uses: 4, respawn: 40, depleteMsg: 'The magic tree fades away.' },
  '1': { actionId: 'copper', uses: 4, respawn: 12, depleteMsg: 'The copper vein is exhausted.' },
  '2': { actionId: 'tin', uses: 4, respawn: 12, depleteMsg: 'The tin vein is exhausted.' },
  '8': { actionId: 'silver', uses: 4, respawn: 14, depleteMsg: 'The silver vein is exhausted.' },
  '3': { actionId: 'iron', uses: 4, respawn: 16, depleteMsg: 'The iron vein is exhausted.' },
  '4': { actionId: 'coal_rock', uses: 4, respawn: 20, depleteMsg: 'The coal seam is exhausted.' },
  '5': { actionId: 'mithril_rock', uses: 3, respawn: 28, depleteMsg: 'The mithril vein is exhausted.' },
  '6': { actionId: 'adamantite_rock', uses: 3, respawn: 34, depleteMsg: 'The adamantite vein is exhausted.' },
  '7': { actionId: 'runite_rock', uses: 2, respawn: 45, depleteMsg: 'The runite vein is exhausted.' },
  f: { actionId: 'shrimp_spot', uses: 0, respawn: 0, depleteMsg: '' },
  a: { actionId: 'sardine_spot', uses: 0, respawn: 0, depleteMsg: '' },
  c: { actionId: 'herring_spot', uses: 0, respawn: 0, depleteMsg: '' },
  g: { actionId: 'trout_spot', uses: 0, respawn: 0, depleteMsg: '' },
  j: { actionId: 'salmon_spot', uses: 0, respawn: 0, depleteMsg: '' },
  u: { actionId: 'pike_spot', uses: 0, respawn: 0, depleteMsg: '' },
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

/** Boss id → lair tile, scanned from the map. */
export const BOSS_LAIRS: Record<string, { x: number; y: number }> = {};
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const bossId = LAIR_BY_CHAR[MAP[y][x]];
    if (bossId) BOSS_LAIRS[bossId] = { x, y };
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
  // Havenbrook
  { id: 'marla', name: 'Shopkeeper Marla', icon: '🧑‍🌾', x: 78, y: 63, kind: 'shop', dialog: 'Welcome to the Havenbrook General Store! Buying or selling, love?' },
  { id: 'boren', name: 'Boren the Smith', icon: '🧔', x: 101, y: 63, kind: 'quest', questIds: ['smiths_apprentice'], dialog: 'The furnace and anvil are free for any hand that knows hot metal.' },
  { id: 'tam', name: 'Innkeeper Tam', icon: '🧑', x: 77, y: 83, kind: 'quest', questIds: ['rat_problem'], dialog: 'Mind the cellar door. The scratching started a fortnight ago…' },
  { id: 'colette', name: 'Chef Colette', icon: '👩‍🍳', x: 79, y: 83, kind: 'quest', questIds: ['fish_for_compliments'], dialog: 'A feast without trout is just a sad meeting with bread.' },
  { id: 'aldous', name: 'Father Aldous', icon: '🧓', x: 99, y: 83, kind: 'quest', questIds: ['grave_matters'], dialog: 'The dead of Duskmire do not sleep. Help me give them rest.' },
  { id: 'hesta', name: 'Hesta the Tanner', icon: '👩‍🔧', x: 84, y: 73, kind: 'quest', questIds: ['cowhide_couture'], dialog: 'Hides! Fresh hides! The pasture cows practically donate them.' },
  { id: 'bram', name: 'Mayor Bram', icon: '🤵', x: 88, y: 63, kind: 'quest', questIds: ['giant_trouble'], dialog: 'Boulders on the trade road again. This town cannot afford giants.' },
  { id: 'vex', name: 'A Shady Figure', icon: '🕵️', x: 95, y: 77, kind: 'quest', questIds: ['light_fingers'], dialog: 'The Guild that does not exist is always recruiting. Hypothetically.' },
  { id: 'mira', name: 'Mira the Novice', icon: '🧝‍♀️', x: 92, y: 72, kind: 'slayer', masterId: 'mira', dialog: 'Everyone starts with rats. Even the legends. Especially the legends.' },
  { id: 'pick_urchin', name: 'Street Urchin', icon: '🧒', x: 89, y: 76, kind: 'thieve', thieveId: 'urchin', dialog: 'Spare a coin? No? Worth a try.' },
  { id: 'pick_merchant', name: 'Traveling Merchant', icon: '🧑‍💼', x: 86, y: 71, kind: 'thieve', thieveId: 'merchant', dialog: 'Finest silks east of the mountains! Do not touch.' },
  // Port Selwick
  { id: 'sella', name: 'Shopkeeper Sella', icon: '🧜‍♀️', x: 106, y: 19, kind: 'shop', dialog: 'Fresh off the boats! Well. Most of it.' },
  // the countryside
  { id: 'elowen', name: 'Elowen the Wizard', icon: '🧙‍♀️', x: 52, y: 73, kind: 'quest', questIds: ['demons_bane'], dialog: 'I told the apprentices: NO unsupervised summoning circles.' },
  { id: 'pick_farmer', name: 'Farmer Gwen', icon: '👨‍🌾', x: 82, y: 96, kind: 'thieve', thieveId: 'farmer', dialog: 'These cows will not herd themselves.' },
  { id: 'pick_elf', name: 'Elf Emissary', icon: '🧝', x: 16, y: 112, kind: 'thieve', thieveId: 'elf', dialog: 'The grove remembers when your town was a single campfire.' },
  // the frontier
  { id: 'dorn', name: 'Dorn Ironfist', icon: '🧔‍♂️', x: 170, y: 72, kind: 'slayer', masterId: 'dorn', dialog: 'The mountains breed hard beasts. I keep the ledger of which must die.' },
  { id: 'roderic', name: 'Steward Roderic', icon: '🫅', x: 150, y: 98, kind: 'quest', questIds: ['dragon_slayer', 'the_kings_end', 'into_the_void'], dialog: 'The castle has not known a rightful ruler in a hundred years.' },
  { id: 'pick_noble', name: 'Idle Noble', icon: '🤵‍♂️', x: 152, y: 108, kind: 'thieve', thieveId: 'noble', dialog: 'Guards! Is that a commoner looking at me?' },
  { id: 'pick_knight', name: 'Castle Knight', icon: '🏇', x: 160, y: 114, kind: 'thieve', thieveId: 'knight', dialog: 'The King will rise again. We keep the watch.' },
  { id: 'zyra', name: 'Zyra the Veiled', icon: '🧛‍♀️', x: 182, y: 116, kind: 'slayer', masterId: 'zyra', dialog: 'You smell the sulfur? Good. Fear keeps slayers alive.' },
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

function cluster(defId: string, cx: number, cy: number, n: number, radius: number, seed: number): SpawnDef[] {
  const out: SpawnDef[] = [];
  for (let k = 0; k < n; k++) {
    const a = Math.sin(seed * 89.7 + k * 37.3) * 43758.5453;
    const b = Math.sin(seed * 13.1 + k * 71.9) * 24634.6345;
    const dx = Math.round(((a - Math.floor(a)) * 2 - 1) * radius);
    const dy = Math.round(((b - Math.floor(b)) * 2 - 1) * radius);
    out.push({ defId, x: cx + dx, y: cy + dy });
  }
  return out;
}

export const SPAWNS: SpawnDef[] = [
  ...cluster('giant_rat', 112, 80, 4, 4, 1),
  ...cluster('giant_rat', 96, 92, 2, 3, 2),
  ...cluster('cow', 120, 60, 4, 4, 3),
  ...cluster('cow', 140, 60, 4, 4, 4),
  ...cluster('goblin', 134, 84, 4, 4, 5),
  ...cluster('goblin', 118, 90, 4, 4, 6),
  ...cluster('skeleton', 60, 110, 6, 5, 7),
  ...cluster('zombie', 86, 112, 6, 5, 8),
  ...cluster('guard', 150, 96, 3, 3, 9),
  ...cluster('hill_giant', 166, 64, 3, 4, 10),
  ...cluster('hill_giant', 168, 84, 3, 4, 11),
  ...cluster('moss_giant', 100, 124, 5, 5, 12),
  ...cluster('black_knight', 152, 114, 6, 7, 13),
  ...cluster('ice_troll', 170, 20, 4, 5, 14),
  ...cluster('ice_troll', 190, 28, 3, 4, 15),
  ...cluster('blue_dragon', 222, 24, 2, 4, 16),
  ...cluster('blue_dragon', 208, 32, 2, 3, 17),
  ...cluster('dust_wraith', 196, 70, 4, 5, 18),
  ...cluster('lesser_demon', 192, 122, 5, 5, 19),
  ...cluster('greater_demon', 212, 126, 4, 4, 20),
  ...cluster('fire_giant', 200, 132, 5, 5, 21),
  ...cluster('crawling_horror', 62, 122, 4, 3, 22),
  ...cluster('abyssal_fiend', 132, 136, 4, 3, 23),
];

/** Where you wake up (Havenbrook square) and where a new game starts. */
export const HOME = { x: 90, y: 72 };

// ——— zones ———

interface Zone {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ZONES: Zone[] = [
  { name: 'The Sunken Crypt', x: 54, y: 116, w: 20, h: 18 },
  { name: 'Stonebridge', x: 55, y: 17, w: 14, h: 10 },
  { name: 'Port Selwick', x: 96, y: 4, w: 40, h: 28 },
  { name: 'Havenbrook', x: 70, y: 56, w: 40, h: 34 },
  { name: 'The Elder Grove', x: 4, y: 100, w: 34, h: 30 },
  { name: 'Willowmere Lake', x: 16, y: 20, w: 52, h: 36 },
  { name: 'Westwood', x: 2, y: 50, w: 48, h: 50 },
  { name: 'The North Pass', x: 56, y: 28, w: 46, h: 28 },
  { name: 'The Frozen Reach', x: 148, y: 1, w: 91, h: 41 },
  { name: 'Copperhill', x: 126, y: 64, w: 30, h: 28 },
  { name: 'The Ruined Castle', x: 128, y: 96, w: 50, h: 34 },
  { name: 'Emberdeep', x: 176, y: 108, w: 63, h: 35 },
  { name: 'The Void Rift', x: 118, y: 130, w: 30, h: 13 },
  { name: 'Duskmire Swamp', x: 40, y: 100, w: 88, h: 43 },
  { name: 'Darkspine Mountains', x: 170, y: 42, w: 69, h: 66 },
  { name: 'Greenfields', x: 100, y: 50, w: 70, h: 48 },
  { name: 'The North Shore', x: 1, y: 1, w: 238, h: 18 },
];

export function zoneName(x: number, y: number): string {
  for (const z of ZONES) {
    if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z.name;
  }
  return 'The Wilds';
}
