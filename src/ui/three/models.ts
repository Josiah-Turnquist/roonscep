// Procedural low-poly character models: articulated humanoids, quadrupeds,
// spiders, ghosts, dragons and orbs — no emoji, no chess pieces.
import * as THREE from 'three';
import { NpcDef } from '../../game/world';

export interface CharModel {
  group: THREE.Group;
  /** Drive per-frame animation. moving: 0..1, working: gathering/crafting swing. */
  update: (dt: number, t: number, moving: number, working: boolean) => void;
}

const matCache = new Map<string, THREE.MeshLambertMaterial>();
function mat(color: number, opts: { emissive?: number; ei?: number; opacity?: number } = {}) {
  const key = `${color}:${opts.emissive ?? 0}:${opts.ei ?? 0}:${opts.opacity ?? 1}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({
      color,
      emissive: opts.emissive ?? 0,
      emissiveIntensity: opts.ei ?? 0.5,
      transparent: (opts.opacity ?? 1) < 1,
      opacity: opts.opacity ?? 1,
    });
    matCache.set(key, m);
  }
  return m;
}

function box(w: number, h: number, d: number, color: number, opts?: Parameters<typeof mat>[1]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.castShadow = true;
  return m;
}

function sphere(r: number, color: number, opts?: Parameters<typeof mat>[1]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat(color, opts));
  m.castShadow = true;
  return m;
}

function cone(r: number, h: number, color: number, opts?: Parameters<typeof mat>[1]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mat(color, opts));
  m.castShadow = true;
  return m;
}

function cyl(rt: number, rb: number, h: number, color: number, opts?: Parameters<typeof mat>[1]): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 8), mat(color, opts));
  m.castShadow = true;
  return m;
}

/** A limb whose geometry hangs from its origin, so rotating swings it naturally. */
function limb(w: number, len: number, color: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, len, w);
  geo.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = true;
  return m;
}

// ——— humanoid ———

export type HatType = 'none' | 'wizard' | 'helmet' | 'hood' | 'straw' | 'chef' | 'crown' | 'cap';

export interface HumanoidOpts {
  skin: number;
  tunic: number;
  legs?: number;
  scale?: number;
  /** Skeleton-thin limbs. */
  thin?: boolean;
  /** Cone skirt instead of legs (robes). */
  robe?: boolean;
  hat?: HatType;
  hatColor?: number;
  horns?: number;
  wings?: number;
  staff?: number;
  sword?: boolean;
  emissiveAccent?: number;
}

export function buildHumanoid(o: HumanoidOpts): CharModel {
  const g = new THREE.Group();
  const width = o.thin ? 0.55 : 1;
  const legColor = o.legs ?? o.tunic;
  const hipY = 0.38;

  const lLeg = limb(0.1 * width, 0.36, legColor);
  const rLeg = limb(0.1 * width, 0.36, legColor);
  lLeg.position.set(-0.09, hipY, 0);
  rLeg.position.set(0.09, hipY, 0);
  const body = new THREE.Group();

  if (o.robe) {
    const skirt = cone(0.3, 0.55, o.tunic);
    skirt.position.y = 0.28;
    g.add(skirt);
  } else {
    g.add(lLeg, rLeg);
  }

  const torso = box(0.34 * width, 0.42, 0.2 * width, o.tunic);
  torso.position.y = hipY + 0.21;
  body.add(torso);
  if (o.emissiveAccent) {
    const vein = box(0.36 * width, 0.06, 0.22 * width, o.emissiveAccent, { emissive: o.emissiveAccent, ei: 0.9 });
    vein.position.y = hipY + 0.18;
    body.add(vein);
  }

  const lArm = limb(0.08 * width, 0.36, o.tunic);
  const rArm = limb(0.08 * width, 0.36, o.skin);
  lArm.position.set(-0.22 * width, hipY + 0.38, 0);
  rArm.position.set(0.22 * width, hipY + 0.38, 0);
  body.add(lArm, rArm);

  if (o.staff !== undefined) {
    const staff = cyl(0.025, 0.025, 0.95, o.staff);
    staff.position.set(0, -0.32, 0.06);
    const knob = sphere(0.055, 0x7fe0c8, { emissive: 0x7fe0c8, ei: 0.8 });
    knob.position.set(0, 0.16, 0.06);
    staff.add(knob);
    rArm.add(staff);
  }
  if (o.sword) {
    const blade = box(0.045, 0.5, 0.02, 0xb8bcc4);
    blade.position.set(0, -0.55, 0);
    rArm.add(blade);
  }

  const headY = hipY + 0.42 + 0.14;
  const head = sphere(0.135, o.skin);
  head.position.y = headY;
  body.add(head);

  if (o.horns !== undefined) {
    for (const side of [-1, 1]) {
      const horn = cone(0.045, 0.18, o.horns);
      horn.position.set(side * 0.11, headY + 0.12, 0);
      horn.rotation.z = -side * 0.5;
      body.add(horn);
    }
  }
  if (o.wings !== undefined) {
    for (const side of [-1, 1]) {
      const wing = box(0.4, 0.28, 0.02, o.wings);
      wing.position.set(side * 0.28, hipY + 0.42, -0.14);
      wing.rotation.y = side * 0.7;
      wing.rotation.z = side * 0.25;
      body.add(wing);
    }
  }

  const hatC = o.hatColor ?? 0x333333;
  switch (o.hat ?? 'none') {
    case 'wizard': {
      const brim = cyl(0.2, 0.2, 0.03, hatC);
      brim.position.y = headY + 0.1;
      const tip = cone(0.13, 0.3, hatC);
      tip.position.y = headY + 0.26;
      body.add(brim, tip);
      break;
    }
    case 'helmet': {
      const helm = cyl(0.145, 0.15, 0.14, hatC);
      helm.position.y = headY + 0.06;
      body.add(helm);
      break;
    }
    case 'hood': {
      const hood = sphere(0.16, hatC);
      hood.position.y = headY + 0.03;
      hood.scale.z = 0.9;
      body.add(hood);
      break;
    }
    case 'straw': {
      const brim = cyl(0.24, 0.24, 0.03, hatC);
      brim.position.y = headY + 0.1;
      const crown = cyl(0.1, 0.12, 0.08, hatC);
      crown.position.y = headY + 0.15;
      body.add(brim, crown);
      break;
    }
    case 'chef': {
      const puff = cyl(0.13, 0.11, 0.18, hatC);
      puff.position.y = headY + 0.17;
      body.add(puff);
      break;
    }
    case 'crown': {
      const crown = cyl(0.13, 0.13, 0.08, hatC, { emissive: hatC, ei: 0.35 });
      crown.position.y = headY + 0.14;
      body.add(crown);
      for (let k = 0; k < 4; k++) {
        const spike = cone(0.025, 0.07, hatC, { emissive: hatC, ei: 0.35 });
        const a = (k / 4) * Math.PI * 2;
        spike.position.set(Math.cos(a) * 0.11, headY + 0.2, Math.sin(a) * 0.11);
        body.add(spike);
      }
      break;
    }
    case 'cap': {
      const cap = sphere(0.145, hatC);
      cap.scale.y = 0.6;
      cap.position.y = headY + 0.07;
      body.add(cap);
      break;
    }
  }

  g.add(body);
  const scale = o.scale ?? 1;
  g.scale.setScalar(scale);

  const update = (dt: number, t: number, moving: number, working: boolean) => {
    const swing = Math.sin(t * 8) * 0.55 * moving;
    if (!o.robe) {
      lLeg.rotation.x = swing;
      rLeg.rotation.x = -swing;
    }
    lArm.rotation.x = -swing * 0.8;
    rArm.rotation.x = working ? -0.6 + Math.sin(t * 9) * 0.85 : swing * 0.8;
    body.position.y = Math.abs(Math.sin(t * 8)) * 0.035 * moving;
  };

  return { group: g, update };
}

// ——— animals ———

/** Wrap parts built facing +x so the finished model faces +z like everything else. */
function faceForward(g: THREE.Group, scale: number): THREE.Group {
  const inner = new THREE.Group();
  inner.add(...g.children.slice());
  inner.rotation.y = -Math.PI / 2;
  g.add(inner);
  g.scale.setScalar(scale);
  return g;
}

function buildCow(): CharModel {
  const g = new THREE.Group();
  const hide = 0xf0ead8;
  const legLen = 0.34;
  const bodyY = legLen + 0.2;

  const body = box(0.8, 0.44, 0.42, hide);
  body.position.y = bodyY;
  g.add(body);
  for (const [px, py, pz] of [[-0.2, 0.1, 0.21], [0.22, -0.05, -0.21], [0.02, 0.14, 0.21], [-0.15, -0.08, -0.21]] as const) {
    const patch = box(0.2, 0.16, 0.02, 0x2b2b2b);
    patch.position.set(px, py, pz);
    body.add(patch);
  }
  // head hangs forward off the shoulders, with a pale muzzle
  const head = box(0.24, 0.24, 0.24, hide);
  head.position.set(0.52, bodyY + 0.1, 0);
  g.add(head);
  const muzzle = box(0.12, 0.14, 0.18, 0xe0b8a8);
  muzzle.position.set(0.66, bodyY + 0.04, 0);
  g.add(muzzle);
  for (const side of [-1, 1]) {
    // floppy ears out to the sides
    const ear = box(0.06, 0.05, 0.12, hide);
    ear.position.set(0.5, bodyY + 0.2, side * 0.17);
    g.add(ear);
    // horns sweep outward, not up like cat ears
    const horn = cone(0.03, 0.14, 0xd8d2b8);
    horn.position.set(0.5, bodyY + 0.26, side * 0.12);
    horn.rotation.x = side * 1.1;
    g.add(horn);
    const eye = sphere(0.025, 0x1a1a1a);
    eye.position.set(0.62, bodyY + 0.14, side * 0.1);
    g.add(eye);
  }
  const udder = sphere(0.13, 0xe8b8b0);
  udder.scale.y = 0.65;
  udder.position.set(-0.12, bodyY - 0.24, 0);
  g.add(udder);
  // tail hangs down with a tuft
  const tail = cyl(0.018, 0.025, 0.36, hide);
  tail.position.set(-0.42, bodyY - 0.05, 0);
  tail.rotation.z = 0.18;
  g.add(tail);
  const tuft = sphere(0.04, 0x2b2b2b);
  tuft.position.set(-0.45, bodyY - 0.24, 0);
  g.add(tuft);

  const legs: THREE.Mesh[] = [];
  for (const [lx, lz] of [[-0.28, -0.13], [-0.28, 0.13], [0.28, -0.13], [0.28, 0.13]] as const) {
    const l = limb(0.09, legLen, hide);
    l.position.set(lx, legLen + 0.02, lz);
    g.add(l);
    legs.push(l);
  }

  faceForward(g, 1);
  const update = (_dt: number, t: number, moving: number) => {
    const swing = Math.sin(t * 7) * 0.4 * moving;
    legs[0].rotation.x = swing;
    legs[3].rotation.x = swing;
    legs[1].rotation.x = -swing;
    legs[2].rotation.x = -swing;
    tail.rotation.x = Math.sin(t * 2.2) * 0.3;
  };
  return { group: g, update };
}

function buildRat(): CharModel {
  const g = new THREE.Group();
  const fur = 0x8a7562;
  const legLen = 0.1;
  const bodyY = 0.2;

  // low, long, tapered body
  const body = sphere(0.22, fur);
  body.scale.set(1.8, 0.85, 1);
  body.position.y = bodyY;
  g.add(body);
  // pointed snout
  const snout = cone(0.12, 0.3, fur);
  snout.rotation.z = -Math.PI / 2;
  snout.position.set(0.48, bodyY + 0.02, 0);
  g.add(snout);
  const nose = sphere(0.025, 0xd89aa0);
  nose.position.set(0.63, bodyY + 0.02, 0);
  g.add(nose);
  for (const side of [-1, 1]) {
    // big round ears
    const ear = sphere(0.07, 0xa08a76);
    ear.scale.z = 0.4;
    ear.position.set(0.3, bodyY + 0.18, side * 0.1);
    g.add(ear);
    const eye = sphere(0.025, 0x1a1a1a);
    eye.position.set(0.42, bodyY + 0.08, side * 0.07);
    g.add(eye);
  }
  // long thin tail trailing behind, close to the ground
  const tail = cyl(0.01, 0.022, 0.55, 0xc4a090);
  tail.position.set(-0.6, bodyY - 0.06, 0);
  tail.rotation.z = Math.PI / 2 - 0.18;
  g.add(tail);

  const legs: THREE.Mesh[] = [];
  for (const [lx, lz] of [[-0.22, -0.12], [-0.22, 0.12], [0.24, -0.12], [0.24, 0.12]] as const) {
    const l = limb(0.045, legLen + 0.08, 0x6f5c4c);
    l.position.set(lx, legLen + 0.06, lz);
    g.add(l);
    legs.push(l);
  }

  faceForward(g, 0.85);
  const update = (_dt: number, t: number, moving: number) => {
    const scurry = Math.sin(t * 16) * 0.6 * moving;
    legs[0].rotation.x = scurry;
    legs[3].rotation.x = scurry;
    legs[1].rotation.x = -scurry;
    legs[2].rotation.x = -scurry;
    tail.rotation.y = Math.sin(t * 4) * 0.3;
  };
  return { group: g, update };
}

// ——— spider / tentacled ———

function buildSpider(o: { body: number; legs: number; scale?: number; hang?: boolean }): CharModel {
  const g = new THREE.Group();
  const bodyY = o.hang ? 0.55 : 0.32;
  const body = sphere(0.28, o.body);
  body.position.y = bodyY;
  body.scale.y = 0.8;
  g.add(body);
  const head = sphere(0.14, o.body);
  head.position.set(0, bodyY + 0.02, 0.3);
  g.add(head);
  for (const side of [-1, 1]) {
    const eye = sphere(0.035, 0xff4444, { emissive: 0xff2222, ei: 1 });
    eye.position.set(side * 0.06, bodyY + 0.06, 0.42);
    g.add(eye);
  }
  const legMeshes: { mesh: THREE.Mesh; baseX: number; baseZ: number }[] = [];
  const n = o.hang ? 5 : 3;
  for (let k = 0; k < n; k++) {
    for (const side of o.hang ? [1] : [-1, 1]) {
      const l = limb(0.045, o.hang ? 0.55 : 0.45, o.legs);
      let baseX = 0;
      let baseZ = 0;
      if (o.hang) {
        const a = (k / n) * Math.PI * 2;
        l.position.set(Math.cos(a) * 0.18, bodyY - 0.1, Math.sin(a) * 0.18);
        baseZ = Math.cos(a) * 0.35;
        baseX = -Math.sin(a) * 0.35;
      } else {
        l.position.set(side * 0.2, bodyY + 0.05, (k - 1) * 0.18);
        baseZ = side * 1.15;
      }
      l.rotation.set(baseX, 0, baseZ);
      g.add(l);
      legMeshes.push({ mesh: l, baseX, baseZ });
    }
  }
  g.scale.setScalar(o.scale ?? 1);
  const update = (_dt: number, t: number, moving: number) => {
    legMeshes.forEach((l, i) => {
      const sway = o.hang
        ? Math.sin(t * 3 + i * 1.3) * 0.2
        : Math.sin(t * 10 + i * 1.3) * (0.3 * moving + 0.05);
      l.mesh.rotation.x = l.baseX + sway;
      l.mesh.rotation.z = l.baseZ;
    });
  };
  return { group: g, update };
}

// ——— ghost ———

function buildGhost(o: { color: number; scale?: number }): CharModel {
  const g = new THREE.Group();
  const body = cone(0.3, 0.85, o.color, { opacity: 0.75 });
  body.position.y = 0.65;
  body.rotation.x = Math.PI; // point hangs down, wide shoulders up
  g.add(body);
  const head = sphere(0.17, o.color, { opacity: 0.85 });
  head.position.y = 1.12;
  g.add(head);
  for (const side of [-1, 1]) {
    const eye = sphere(0.035, 0xffffff, { emissive: 0xffffff, ei: 1 });
    eye.position.set(side * 0.07, 1.15, 0.14);
    g.add(eye);
  }
  g.scale.setScalar(o.scale ?? 1);
  const update = (_dt: number, t: number) => {
    g.position.y = Math.sin(t * 2.2) * 0.08 + 0.12;
    g.rotation.z = Math.sin(t * 1.7) * 0.06;
  };
  return { group: g, update };
}

// ——— dragon ———

function buildDragon(o: { body: number; belly?: number; scale?: number }): CharModel {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  const body = box(0.85, 0.4, 0.42, o.body);
  body.position.y = 0.5;
  inner.add(body);
  const belly = box(0.86, 0.16, 0.3, o.belly ?? 0xd8d2b8);
  belly.position.y = 0.36;
  inner.add(belly);
  const neck = cyl(0.09, 0.13, 0.5, o.body);
  neck.position.set(0.5, 0.82, 0);
  neck.rotation.z = -0.7;
  inner.add(neck);
  const head = box(0.34, 0.18, 0.2, o.body);
  head.position.set(0.72, 1.02, 0);
  inner.add(head);
  for (const side of [-1, 1]) {
    const eye = sphere(0.03, 0xffd24d, { emissive: 0xffb400, ei: 1 });
    eye.position.set(0.68, 1.08, side * 0.1);
    inner.add(eye);
  }
  const tail = cone(0.12, 0.7, o.body);
  tail.position.set(-0.65, 0.5, 0);
  tail.rotation.z = 1.35;
  inner.add(tail);
  const legs: THREE.Mesh[] = [];
  for (const [lx, lz] of [[-0.3, -0.16], [-0.3, 0.16], [0.3, -0.16], [0.3, 0.16]] as const) {
    const l = limb(0.09, 0.3, o.body);
    l.position.set(lx, 0.3, lz);
    inner.add(l);
    legs.push(l);
  }
  const wings: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const wing = box(0.55, 0.03, 0.4, o.body);
    wing.position.set(-0.05, 0.75, side * 0.32);
    inner.add(wing);
    wings.push(wing);
  }
  inner.rotation.y = -Math.PI / 2; // face +z
  g.add(inner);
  g.scale.setScalar(o.scale ?? 1);
  const update = (_dt: number, t: number, moving: number) => {
    wings.forEach((w, i) => {
      const side = i === 0 ? -1 : 1;
      w.rotation.x = side * (0.25 + Math.sin(t * 4) * (0.35 + moving * 0.3));
    });
    const swing = Math.sin(t * 8) * 0.4 * moving;
    legs[0].rotation.x = swing;
    legs[3].rotation.x = swing;
    legs[1].rotation.x = -swing;
    legs[2].rotation.x = -swing;
  };
  return { group: g, update };
}

// ——— orb (void horrors) ———

function buildOrb(o: { color: number; glow: number; eye?: boolean; tentacles?: number; scale?: number }): CharModel {
  const g = new THREE.Group();
  const body = sphere(0.42, o.color, { emissive: o.glow, ei: 0.35 });
  body.position.y = 1.0;
  g.add(body);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.035, 8, 24),
    mat(o.glow, { emissive: o.glow, ei: 0.9 }),
  );
  ring.position.y = 1.0;
  ring.rotation.x = Math.PI / 2.4;
  g.add(ring);
  if (o.eye) {
    const white = sphere(0.18, 0xf0ead8);
    white.position.set(0, 1.02, 0.32);
    white.scale.z = 0.55;
    g.add(white);
    const iris = sphere(0.08, 0x8a1520, { emissive: 0xff2233, ei: 0.8 });
    iris.position.set(0, 1.02, 0.44);
    g.add(iris);
  }
  const tents: THREE.Mesh[] = [];
  for (let k = 0; k < (o.tentacles ?? 0); k++) {
    const tnt = limb(0.05, 0.6, o.color);
    const a = (k / (o.tentacles ?? 1)) * Math.PI * 2;
    tnt.position.set(Math.cos(a) * 0.24, 0.75, Math.sin(a) * 0.24);
    g.add(tnt);
    tents.push(tnt);
  }
  g.scale.setScalar(o.scale ?? 1);
  const update = (_dt: number, t: number) => {
    g.position.y = Math.sin(t * 1.8) * 0.1;
    ring.rotation.z = t * 0.8;
    tents.forEach((tnt, i) => {
      tnt.rotation.x = Math.sin(t * 3 + i) * 0.3;
      tnt.rotation.z = Math.cos(t * 2.5 + i * 2) * 0.3;
    });
  };
  return { group: g, update };
}

// ——— monster registry ———

const SKIN = 0xd9a066;

export function buildMonsterModel(defId: string): CharModel {
  switch (defId) {
    case 'giant_rat':
      return buildRat();
    case 'cow':
      return buildCow();
    case 'goblin':
      return buildHumanoid({ skin: 0x6a9c3a, tunic: 0x7a5a30, scale: 0.75 });
    case 'skeleton':
      return buildHumanoid({ skin: 0xd8d2c0, tunic: 0xd8d2c0, thin: true });
    case 'zombie':
      return buildHumanoid({ skin: 0x7a8f6a, tunic: 0x4a4438 });
    case 'guard':
      return buildHumanoid({ skin: SKIN, tunic: 0x8a3030, hat: 'helmet', hatColor: 0x9aa0aa, sword: true });
    case 'hill_giant':
      return buildHumanoid({ skin: 0xc9985f, tunic: 0x6b5232, scale: 1.9 });
    case 'crawling_horror':
      return buildSpider({ body: 0x3a2a44, legs: 0x2a1e33 });
    case 'moss_giant':
      return buildHumanoid({ skin: 0x5f8a4a, tunic: 0x40602f, scale: 2.0 });
    case 'black_knight':
      return buildHumanoid({ skin: 0x2b2b30, tunic: 0x1f1f26, hat: 'helmet', hatColor: 0x121218, sword: true, scale: 1.05 });
    case 'ice_troll':
      return buildHumanoid({ skin: 0x9ac4d8, tunic: 0x6f95a8, scale: 1.5 });
    case 'dust_wraith':
      return buildGhost({ color: 0xb0a488, scale: 1.15 });
    case 'lesser_demon':
      return buildHumanoid({ skin: 0xb03a2a, tunic: 0x8a2a1e, horns: 0x3a1e14, wings: 0x5c1f16, scale: 1.3 });
    case 'fire_giant':
      return buildHumanoid({ skin: 0xc96b2e, tunic: 0x8a3a1a, emissiveAccent: 0xff6a00, scale: 1.9 });
    case 'greater_demon':
      return buildHumanoid({ skin: 0x8a1f1a, tunic: 0x5c1512, horns: 0x2b1510, wings: 0x40100c, scale: 1.6 });
    case 'blue_dragon':
      return buildDragon({ body: 0x4a72b8, scale: 1.2 });
    case 'abyssal_fiend':
      return buildSpider({ body: 0x2f4a4f, legs: 0x203538, hang: true, scale: 1.25 });
    // bosses
    case 'korgath':
      return buildHumanoid({ skin: 0xd8d2c0, tunic: 0xd8d2c0, thin: true, hat: 'crown', hatColor: 0x8a8272, scale: 1.8 });
    case 'embermaw':
      return buildHumanoid({ skin: 0x3a2a24, tunic: 0x2b1e1a, emissiveAccent: 0xff5500, scale: 2.2 });
    case 'frostfang':
      return buildDragon({ body: 0x9ac9e8, belly: 0xe8f2f8, scale: 1.9 });
    case 'fallen_king':
      return buildHumanoid({ skin: 0x6a6f78, tunic: 0x2b2b38, hat: 'crown', hatColor: 0xe8b64c, sword: true, scale: 1.7 });
    case 'voidheart':
      return buildOrb({ color: 0x1e1430, glow: 0x8a5fd0, scale: 1.6 });
    case 'nethrax':
      return buildOrb({ color: 0x2b1218, glow: 0xd0343f, eye: true, tentacles: 5, scale: 2.0 });
    default:
      return buildHumanoid({ skin: SKIN, tunic: 0x666666 });
  }
}

// ——— NPC registry ———

const NPC_STYLES: Record<string, HumanoidOpts> = {
  marla: { skin: SKIN, tunic: 0x6f8a3a, hat: 'cap', hatColor: 0x8a6a42 },
  boren: { skin: 0xb98a55, tunic: 0x5c4430, legs: 0x3a3430 },
  tam: { skin: SKIN, tunic: 0x8c5a3a },
  colette: { skin: SKIN, tunic: 0xe4e0d8, hat: 'chef', hatColor: 0xf2efe8 },
  aldous: { skin: 0xd9b68a, tunic: 0xe8e0d0, robe: true },
  hesta: { skin: SKIN, tunic: 0x8a6a42 },
  bram: { skin: SKIN, tunic: 0x5a3a6a, hat: 'cap', hatColor: 0x3a2a48 },
  elowen: { skin: SKIN, tunic: 0x6a3a9c, robe: true, hat: 'wizard', hatColor: 0x4a2a70, staff: 0x6b4a2f },
  vex: { skin: SKIN, tunic: 0x33333a, hat: 'hood', hatColor: 0x222228 },
  roderic: { skin: SKIN, tunic: 0x3a4a7c, legs: 0x2b3352 },
  mira: { skin: SKIN, tunic: 0x4a7c5a, sword: true },
  dorn: { skin: 0xb98a55, tunic: 0x555c66, hat: 'helmet', hatColor: 0x777f8a, sword: true },
  zyra: { skin: 0xd9c4d0, tunic: 0x4a2a3a, hat: 'hood', hatColor: 0x33202c },
  pick_urchin: { skin: SKIN, tunic: 0x7a7268, scale: 0.7 },
  pick_farmer: { skin: 0xb98a55, tunic: 0x8a7a3a, hat: 'straw', hatColor: 0xd8c67a },
  pick_merchant: { skin: SKIN, tunic: 0x9a4a7a, hat: 'cap', hatColor: 0x6a2f52 },
  pick_noble: { skin: SKIN, tunic: 0x7a2aa0, legs: 0x4a1a62 },
  pick_knight: { skin: SKIN, tunic: 0x8a8f99, hat: 'helmet', hatColor: 0xa8aeb8, sword: true },
  pick_elf: { skin: 0xe8d0b0, tunic: 0x3a7c4a },
};

export function buildNpcModel(npc: NpcDef): CharModel {
  return buildHumanoid(NPC_STYLES[npc.id] ?? { skin: SKIN, tunic: 0x666666 });
}

/** The player: a proper robed wizard with a staff. */
export function buildPlayerModel(): CharModel {
  const model = buildHumanoid({
    skin: 0xe0b58a,
    tunic: 0x3a4a8c,
    robe: true,
    hat: 'wizard',
    hatColor: 0x2c3a75,
    staff: 0x5c4430,
  });
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.42, 24),
    new THREE.MeshBasicMaterial({ color: 0xe8dcc0, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  model.group.add(ring);
  return model;
}
