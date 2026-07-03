// Builds the static low-poly 3D world from the tile map: terrain mesh with
// vertex colours and heights, water, cliff walls, resource-node models with
// depleted variants, crafting stations, boss lairs and NPC billboards.
import * as THREE from 'three';
import {
  LAIR_BY_CHAR, MAP, MAP_H, MAP_W, NPCS, RESOURCE_BY_CHAR, STATION_BY_CHAR, tileAt,
} from '../../game/world';
import { MONSTER_MAP } from '../../game/monsters';
import { GATHER_MAP } from '../../game/actions';
import { buildNpcModel } from './models';

// ——— terrain profile ———

const BASE_HEIGHT: Record<string, number> = {
  '.': 0, ',': 0.02, ';': 0.02, ':': 0.55, _: -0.12, '*': 0.3, '%': 0.18, '!': 0.05,
  '~': -0.55, '#': 0.9, '=': 0.06,
};

const TILE_COLOR: Record<string, number> = {
  '.': 0x4a7c33, ',': 0x9c8757, ';': 0xd8c78a, ':': 0x7d715c, _: 0x4c5a3d, '*': 0xdfe8ec,
  '%': 0x5a2d20, '!': 0x2a2040, '~': 0x2f5f8a, '#': 0x6a5f4f, '=': 0x8a6a42,
};

function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n); // 0..1, deterministic
}

/** The terrain char that a resource/station/lair glyph sits on. */
function underChar(x: number, y: number): string {
  const c = tileAt(x, y);
  if (BASE_HEIGHT[c] !== undefined) return c;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
    const n = tileAt(x + dx, y + dy);
    if (BASE_HEIGHT[n] !== undefined && n !== '#' && n !== '~') return n;
  }
  return '.';
}

function tileHeight(x: number, y: number): number {
  const c = underChar(x, y);
  let h = BASE_HEIGHT[c] ?? 0;
  if (c === '.' || c === '*' || c === ':') h += hash(x, y) * 0.18;
  return h;
}

function cornerHeight(i: number, j: number): number {
  return (
    (tileHeight(i - 1, j - 1) + tileHeight(i, j - 1) + tileHeight(i - 1, j) + tileHeight(i, j)) / 4
  );
}

/** Smoothed ground height at the centre of tile (x, y). */
export function groundHeight(x: number, y: number): number {
  return (
    (cornerHeight(x, y) + cornerHeight(x + 1, y) + cornerHeight(x, y + 1) + cornerHeight(x + 1, y + 1)) / 4
  );
}

/** World-space position of a tile centre. */
export function tilePos(x: number, y: number): THREE.Vector3 {
  return new THREE.Vector3(x + 0.5, groundHeight(x, y), y + 0.5);
}

// ——— shared materials ———

const matCache = new Map<string, THREE.MeshLambertMaterial>();
function mat(color: number, emissive = 0, emissiveIntensity = 0.6): THREE.MeshLambertMaterial {
  const key = `${color}:${emissive}:${emissiveIntensity}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity });
    matCache.set(key, m);
  }
  return m;
}

function solid(
  geo: THREE.BufferGeometry,
  color: number,
  opts: { emissive?: number; ei?: number } = {},
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(color, opts.emissive ?? 0, opts.ei ?? 0.6));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ——— sprite helpers ———

export function makeTextSprite(text: string, color = '#ffe873', height = 0.4): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = 'bold 44px Georgia, serif';
  const w = Math.ceil(ctx.measureText(text).width) + 24;
  canvas.width = w;
  canvas.height = 60;
  const c2 = canvas.getContext('2d')!;
  c2.font = 'bold 44px Georgia, serif';
  c2.textAlign = 'center';
  c2.textBaseline = 'middle';
  c2.lineWidth = 7;
  c2.strokeStyle = 'rgba(0,0,0,0.85)';
  c2.strokeText(text, w / 2, 32);
  c2.fillStyle = color;
  c2.fillText(text, w / 2, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  sprite.scale.set((height * w) / 60, height, 1);
  sprite.renderOrder = 3;
  return sprite;
}

// ——— vegetation & rocks ———

const TREE_STYLE: Record<string, { canopy: number; tall: number; trunk: number }> = {
  T: { canopy: 0x3f7a2d, tall: 1.0, trunk: 0x6b4a2f },
  h: { canopy: 0x8fbf62, tall: 0.95, trunk: 0xd8d2c8 },
  O: { canopy: 0x2f6323, tall: 1.15, trunk: 0x5c3d24 },
  W: { canopy: 0x5a9c7a, tall: 0.95, trunk: 0x6b4a2f },
  P: { canopy: 0xc96f2e, tall: 1.05, trunk: 0x6b4a2f },
  Y: { canopy: 0x234d20, tall: 1.35, trunk: 0x4a3320 },
  G: { canopy: 0x7b4fc4, tall: 1.2, trunk: 0x4a3350 },
};

function buildTree(char: string, seed: number): THREE.Group {
  const st = TREE_STYLE[char];
  const g = new THREE.Group();
  const trunkH = 0.55 * st.tall;
  const trunk = solid(new THREE.CylinderGeometry(0.09, 0.14, trunkH, 6), st.trunk);
  trunk.position.y = trunkH / 2;
  g.add(trunk);
  const canopyH = 0.9 * st.tall;
  const canopy = solid(new THREE.ConeGeometry(0.5 + hash(seed, 1) * 0.12, canopyH, 7), st.canopy);
  canopy.position.y = trunkH + canopyH / 2 - 0.08;
  g.add(canopy);
  const top = solid(new THREE.ConeGeometry(0.32, canopyH * 0.6, 7), st.canopy);
  top.position.y = trunkH + canopyH * 1.05;
  g.add(top);
  if (char === 'G') {
    const orb = solid(new THREE.SphereGeometry(0.1, 8, 6), 0xb48ee0, { emissive: 0xb48ee0, ei: 1 });
    orb.position.y = trunkH + canopyH * 1.45;
    g.add(orb);
  }
  g.rotation.y = hash(seed, 7) * Math.PI;
  return g;
}

const ROCK_TIER: Record<string, number> = {
  '1': 0xe07b39, '2': 0xd9d9d9, '8': 0xe8e8f0, '3': 0x8a5a3b, '4': 0x2b2b2b,
  '5': 0x5a79d6, '6': 0x4f9e3c, '7': 0x59d1e0,
};

function buildRock(char: string, seed: number): THREE.Group {
  const g = new THREE.Group();
  const boulder = solid(new THREE.IcosahedronGeometry(0.42, 0), 0x8a8378);
  boulder.scale.y = 0.72;
  boulder.position.y = 0.26;
  boulder.rotation.y = hash(seed, 3) * Math.PI;
  g.add(boulder);
  for (let k = 0; k < 3; k++) {
    const crystal = solid(new THREE.OctahedronGeometry(0.1, 0), ROCK_TIER[char], {
      emissive: ROCK_TIER[char], ei: 0.35,
    });
    const a = hash(seed, k) * Math.PI * 2;
    crystal.position.set(Math.cos(a) * 0.26, 0.45 + hash(seed, k + 9) * 0.12, Math.sin(a) * 0.26);
    g.add(crystal);
  }
  return g;
}

const BUSH_ACCENT: Record<string, number> = {
  b: 0x4a6fd6, z: 0xd8c67a, q: 0x9adf6a, d: 0x53c7a5, e: 0x2fbf4f,
  n: 0x8a2f4f, o: 0xe8b64c, v: 0x9a5fd0,
};

function buildBush(char: string, seed: number): THREE.Group {
  const g = new THREE.Group();
  const bush = solid(new THREE.SphereGeometry(0.3, 8, 6), char === 'v' ? 0x3a2a50 : 0x3a6b2a);
  bush.scale.y = 0.75;
  bush.position.y = 0.2;
  g.add(bush);
  for (let k = 0; k < 4; k++) {
    const berry = solid(new THREE.SphereGeometry(char === 'o' ? 0.09 : 0.055, 6, 5), BUSH_ACCENT[char], {
      emissive: BUSH_ACCENT[char], ei: 0.25,
    });
    const a = hash(seed, k + 20) * Math.PI * 2;
    berry.position.set(Math.cos(a) * 0.22, 0.28 + hash(seed, k) * 0.14, Math.sin(a) * 0.22);
    g.add(berry);
  }
  return g;
}

const FISH_COLOR: Record<string, number> = {
  f: 0x9adfff, a: 0xb8d4e8, c: 0x8fb4d8, g: 0x6fc3ff, j: 0xffa07a, u: 0x7a9c5a,
  l: 0xff7a5c, w: 0x7ae0ff, x: 0xc0d8e8,
};

// ——— stations & lairs ———

function buildStation(type: string): THREE.Group {
  const g = new THREE.Group();
  if (type === 'furnace') {
    const body = solid(new THREE.CylinderGeometry(0.42, 0.5, 0.95, 8), 0x6a6158);
    body.position.y = 0.48;
    g.add(body);
    const mouth = solid(new THREE.BoxGeometry(0.34, 0.3, 0.2), 0xff7722, { emissive: 0xff5500, ei: 1 });
    mouth.position.set(0, 0.35, 0.42);
    g.add(mouth);
  } else if (type === 'anvil') {
    const stump = solid(new THREE.CylinderGeometry(0.24, 0.3, 0.32, 8), 0x6b4a2f);
    stump.position.y = 0.16;
    g.add(stump);
    const top = solid(new THREE.BoxGeometry(0.62, 0.18, 0.26), 0x3a3a42);
    top.position.y = 0.42;
    g.add(top);
  } else {
    const body = solid(new THREE.BoxGeometry(0.85, 0.55, 0.7), 0x7a4a30);
    body.position.y = 0.28;
    g.add(body);
    const coals = solid(new THREE.BoxGeometry(0.65, 0.08, 0.5), 0xff5522, { emissive: 0xff3300, ei: 1 });
    coals.position.y = 0.58;
    g.add(coals);
  }
  return g;
}

const LAIR_ACCENT: Record<string, number> = {
  korgath: 0xdad6c2, embermaw: 0xff6a2a, frostfang: 0x8fd4ff,
  fallen_king: 0xe8b64c, voidheart: 0x8a5fd0, nethrax: 0xd0343f,
};

// ——— main build ———

export interface NodeVisual {
  full: THREE.Group;
  depleted: THREE.Object3D;
}

export interface AnimatedEntry {
  /** Tile position, used to skip animation far from the player. */
  x: number;
  y: number;
  /** The animated subtree — kept matrix-live while the rest of the world is frozen. */
  obj: THREE.Object3D;
  tick: (t: number) => void;
}

export interface WorldHandles {
  /** Raycast targets: terrain + every interactable object (userData.kind set). */
  pickables: THREE.Object3D[];
  interactables: THREE.Group;
  overlay: THREE.Group; // labels etc, not pickable
  nodeVisuals: Map<string, NodeVisual>;
  animated: AnimatedEntry[];
}

export function buildWorld(scene: THREE.Scene): WorldHandles {
  const interactables = new THREE.Group();
  const overlay = new THREE.Group();
  const nodeVisuals = new Map<string, NodeVisual>();
  const animated: AnimatedEntry[] = [];

  // — terrain —
  const geo = new THREE.PlaneGeometry(MAP_W, MAP_H, MAP_W, MAP_H);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const acc = new THREE.Color();
  for (let j = 0; j <= MAP_H; j++) {
    for (let i = 0; i <= MAP_W; i++) {
      const idx = j * (MAP_W + 1) + i;
      pos.setY(idx, cornerHeight(i, j));
      acc.setRGB(0, 0, 0);
      for (const [tx, ty] of [[i - 1, j - 1], [i, j - 1], [i - 1, j], [i, j]] as const) {
        c.setHex(TILE_COLOR[underChar(tx, ty)] ?? TILE_COLOR['.']);
        acc.add(c);
      }
      acc.multiplyScalar(0.25);
      const v = 0.92 + hash(i, j) * 0.16;
      colors[idx * 3] = acc.r * v;
      colors[idx * 3 + 1] = acc.g * v;
      colors[idx * 3 + 2] = acc.b * v;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  terrain.position.set(MAP_W / 2, 0, MAP_H / 2);
  terrain.receiveShadow = true;
  terrain.userData = { kind: 'terrain' };
  scene.add(terrain);

  // — water —
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_W, MAP_H),
    new THREE.MeshLambertMaterial({ color: 0x3d7ab5, transparent: true, opacity: 0.78 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(MAP_W / 2, -0.24, MAP_H / 2);
  scene.add(water);

  // — cliff walls (instanced) —
  const wallTiles: { x: number; y: number }[] = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) if (MAP[y][x] === '#') wallTiles.push({ x, y });
  }
  const walls = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    wallTiles.length,
  );
  walls.castShadow = true;
  walls.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  const wallColor = new THREE.Color();
  const tint = new THREE.Color();
  wallTiles.forEach(({ x, y }, k) => {
    const h = 1.35 + hash(x, y) * 0.6;
    const base = cornerHeight(x, y);
    m4.makeScale(1, h, 1);
    m4.setPosition(x + 0.5, base + h / 2 - 0.05, y + 0.5);
    walls.setMatrixAt(k, m4);
    tint.setHex(TILE_COLOR[underChar(x, y)] ?? 0x6a5f4f);
    wallColor.setHex(0x6a5f4f).lerp(tint, 0.4).multiplyScalar(0.92 + hash(y, x) * 0.16);
    walls.setColorAt(k, wallColor);
  });
  scene.add(walls);

  // — resource nodes, stations, lairs —
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const char = MAP[y][x];
      const p = tilePos(x, y);
      const seed = x * 100 + y;

      if (RESOURCE_BY_CHAR[char]) {
        const action = GATHER_MAP[RESOURCE_BY_CHAR[char].actionId];
        const full = new THREE.Group();
        let depleted: THREE.Object3D;
        if (TREE_STYLE[char]) {
          full.add(buildTree(char, seed));
          const stump = solid(new THREE.CylinderGeometry(0.13, 0.16, 0.18, 7), 0x7a5a3a);
          stump.position.y = 0.09;
          depleted = stump;
        } else if (ROCK_TIER[char]) {
          full.add(buildRock(char, seed));
          const rubble = solid(new THREE.IcosahedronGeometry(0.24, 0), 0x5f5a50);
          rubble.scale.y = 0.5;
          rubble.position.y = 0.1;
          depleted = rubble;
        } else if (FISH_COLOR[char]) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.3, 0.05, 8, 20),
            mat(FISH_COLOR[char], FISH_COLOR[char], 0.5),
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.06;
          full.add(ring);
          // invisible disc so clicking anywhere inside the ring works, not just the band
          const hitDisc = new THREE.Mesh(
            new THREE.CircleGeometry(0.6, 12),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
          );
          hitDisc.rotation.x = -Math.PI / 2;
          hitDisc.position.y = 0.07;
          full.add(hitDisc);
          const phase = hash(seed, 5) * Math.PI * 2;
          animated.push({
            x, y, obj: ring,
            tick: (t) => {
              const sc = 1 + Math.sin(t * 2.2 + phase) * 0.18;
              ring.scale.set(sc, sc, 1);
            },
          });
          full.position.set(p.x, -0.22, p.z);
          depleted = new THREE.Group(); // fishing spots never deplete
        } else {
          full.add(buildBush(char, seed));
          const bare = solid(new THREE.SphereGeometry(0.14, 6, 5), 0x5a4a32);
          bare.scale.y = 0.6;
          bare.position.y = 0.09;
          depleted = bare;
        }
        if (!FISH_COLOR[char]) full.position.copy(p);
        depleted.position.copy(full.position);
        depleted.visible = false;
        const data = { kind: 'resource', x, y, label: `${action.name} (lvl ${action.level})` };
        full.userData = data;
        full.traverse((o) => (o.userData = data));
        depleted.userData = { kind: 'terrain' };
        interactables.add(full);
        interactables.add(depleted);
        nodeVisuals.set(`${x},${y}`, { full, depleted });
      } else if (STATION_BY_CHAR[char]) {
        const type = STATION_BY_CHAR[char];
        const st = buildStation(type);
        st.position.copy(p);
        const data = { kind: 'station', station: type, label: type[0].toUpperCase() + type.slice(1) };
        st.userData = data;
        st.traverse((o) => (o.userData = data));
        interactables.add(st);
        const label = makeTextSprite(data.label, '#ffd98a', 0.32);
        label.position.set(p.x, p.y + 1.35, p.z);
        overlay.add(label);
      } else if (LAIR_BY_CHAR[char]) {
        const bossId = LAIR_BY_CHAR[char];
        const boss = MONSTER_MAP[bossId];
        const accent = LAIR_ACCENT[bossId] ?? 0xffffff;
        const g = new THREE.Group();
        const ring = solid(new THREE.TorusGeometry(0.62, 0.09, 8, 24), accent, { emissive: accent, ei: 0.8 });
        ring.position.y = 0.85;
        g.add(ring);
        const void_ = new THREE.Mesh(
          new THREE.CircleGeometry(0.53, 24),
          new THREE.MeshBasicMaterial({ color: 0x05040a, side: THREE.DoubleSide }),
        );
        void_.position.y = 0.85;
        g.add(void_);
        animated.push({ x, y, obj: g, tick: (t) => (g.rotation.y = t * 0.4) });
        g.position.copy(p);
        const data = { kind: 'lair', bossId, label: `${boss.icon} ${boss.name} (combat ${boss.levelReq}+)` };
        g.userData = data;
        g.traverse((o) => (o.userData = data));
        interactables.add(g);
        const label = makeTextSprite(boss.name, '#ff9a8a', 0.36);
        label.position.set(p.x, p.y + 2.0, p.z);
        overlay.add(label);
      }
    }
  }

  // — NPCs —
  for (const n of NPCS) {
    const p = tilePos(n.x, n.y);
    const model = buildNpcModel(n);
    model.group.position.copy(p);
    // face the nearest road-ish direction: toward the player spawn feels natural enough
    model.group.rotation.y = Math.PI + hash(n.x, n.y) * 1.2 - 0.6;
    const data = { kind: 'npc', id: n.id, label: `${n.name} — click to talk` };
    model.group.userData = data;
    model.group.traverse((o) => (o.userData = data));
    interactables.add(model.group);
    // idle animation so townsfolk never stand frozen
    const npcPhase = hash(n.x, n.y) * 20;
    animated.push({ x: n.x, y: n.y, obj: model.group, tick: (t) => model.update(0.016, t + npcPhase, 0, false) });
    const label = makeTextSprite(n.name, '#ffe873', 0.3);
    label.position.set(p.x, p.y + 1.5, p.z);
    overlay.add(label);
    if (n.kind === 'quest') {
      const marker = solid(new THREE.OctahedronGeometry(0.12, 0), 0xe8b64c, { emissive: 0xe8b64c, ei: 0.9 });
      marker.position.set(p.x, p.y + 1.75, p.z);
      animated.push({
        x: n.x, y: n.y, obj: marker,
        tick: (t) => {
          marker.position.y = p.y + 1.75 + Math.sin(t * 2.5 + n.x) * 0.09;
          marker.rotation.y = t * 1.5;
        },
      });
      overlay.add(marker);
    }
  }

  scene.add(interactables);
  scene.add(overlay);

  // ——— decorative filler: pure scenery, instanced per type, never clickable ———
  // (not in pickables, so clicks and hovers pass straight through)
  // squat, rounded shapes only: anything cone-shaped reads as a "mini tree"
  // that players expect to block them — these are all pure walk-through scenery
  const shrubGeo = new THREE.SphereGeometry(0.2, 6, 5);
  shrubGeo.scale(1, 0.6, 1);
  const snowShrubGeo = new THREE.SphereGeometry(0.24, 6, 5);
  snowShrubGeo.scale(1, 0.55, 1);
  const tuftGeo = new THREE.ConeGeometry(0.09, 0.14, 5); // squat grass, not a sapling
  const DECOR: { chars: string; density: number; geo: THREE.BufferGeometry; color: number; yOff: number }[] = [
    { chars: '.', density: 0.09, geo: tuftGeo, color: 0x3a6b28, yOff: 0.07 }, // grass tufts
    { chars: '.', density: 0.02, geo: shrubGeo, color: 0x2f5a22, yOff: 0.11 }, // shrubs
    { chars: '.', density: 0.008, geo: new THREE.SphereGeometry(0.05, 6, 5), color: 0xe8e0d0, yOff: 0.06 }, // white flowers
    { chars: '.', density: 0.006, geo: new THREE.SphereGeometry(0.05, 6, 5), color: 0xd9ab4f, yOff: 0.06 }, // gold flowers
    { chars: '.:;', density: 0.012, geo: new THREE.IcosahedronGeometry(0.09, 0), color: 0x8a8378, yOff: 0.05 }, // pebbles
    { chars: '*', density: 0.02, geo: snowShrubGeo, color: 0x4a6b52, yOff: 0.11 }, // hardy snow shrubs
    { chars: '*', density: 0.012, geo: new THREE.IcosahedronGeometry(0.16, 0), color: 0xeef2f5, yOff: 0.08 }, // ice boulders
    { chars: '_', density: 0.03, geo: new THREE.CylinderGeometry(0.015, 0.022, 0.6, 4), color: 0x5a6b4a, yOff: 0.3 }, // reeds
    { chars: '_', density: 0.008, geo: new THREE.CylinderGeometry(0.04, 0.1, 1.0, 5), color: 0x3a352c, yOff: 0.5 }, // dead snags
    { chars: '%', density: 0.02, geo: new THREE.IcosahedronGeometry(0.18, 0), color: 0x2b1e1a, yOff: 0.1 }, // basalt rocks
    { chars: '!', density: 0.02, geo: new THREE.OctahedronGeometry(0.12, 0), color: 0x4a3a70, yOff: 0.1 }, // void shards
  ];
  const m4d = new THREE.Matrix4();
  const qd = new THREE.Quaternion();
  const ed = new THREE.Euler();
  const vp = new THREE.Vector3();
  const vs = new THREE.Vector3();
  DECOR.forEach((spec, si) => {
    const mats: THREE.Matrix4[] = [];
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        if (!spec.chars.includes(MAP[y][x])) continue;
        if (hash(x * 17 + si * 101, y * 23 + si * 57) >= spec.density) continue;
        const jx = (hash(x + si, y) - 0.5) * 0.7;
        const jz = (hash(x, y + si) - 0.5) * 0.7;
        const sc = 0.7 + hash(x * 2 + si, y * 3) * 0.7;
        ed.set(0, hash(x, y * 7 + si) * Math.PI * 2, 0);
        qd.setFromEuler(ed);
        vp.set(x + 0.5 + jx, groundHeight(x, y) + spec.yOff * sc, y + 0.5 + jz);
        vs.set(sc, sc, sc);
        mats.push(m4d.compose(vp, qd, vs).clone());
      }
    }
    if (mats.length === 0) return;
    const imesh = new THREE.InstancedMesh(
      spec.geo,
      new THREE.MeshLambertMaterial({ color: spec.color }),
      mats.length,
    );
    mats.forEach((mm, i) => imesh.setMatrixAt(i, mm));
    imesh.instanceMatrix.needsUpdate = true;
    imesh.receiveShadow = true;
    imesh.matrixAutoUpdate = false;
    imesh.updateMatrix();
    scene.add(imesh);
  });

  // The world is static: freeze every matrix so three.js stops recomposing
  // thousands of unchanged transforms per frame. Animated subtrees are
  // re-enabled and are only ticked near the player (see WorldView).
  for (const root of [terrain, water, walls, interactables, overlay] as THREE.Object3D[]) {
    root.traverse((o) => {
      o.matrixAutoUpdate = false;
      o.updateMatrix();
    });
  }
  for (const a of animated) {
    a.obj.traverse((o) => (o.matrixAutoUpdate = true));
  }
  scene.updateMatrixWorld(true);

  return { pickables: [terrain, interactables], interactables, overlay, nodeVisuals, animated };
}

