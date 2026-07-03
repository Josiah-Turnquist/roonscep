import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useDispatch, useGame } from '../state/store';
import {
  BOSS_LAIRS, MAP_W, NPCS, STATIONS, StationType, isWalkable, zoneName,
} from '../game/world';
import { MONSTER_MAP } from '../game/monsters';
import { GATHER_MAP } from '../game/actions';
import { GameState, MonsterEntity } from '../game/types';
import { buildWorld, tilePos, WorldHandles } from './three/worldBuilder';
import { buildMonsterModel, buildPlayerModel, CharModel } from './three/models';
import { NpcDialog, StationDialog } from './Dialogs';
import CombatHud from './CombatHud';
import TickBar from './TickBar';

/** 0→1→0 attack-lunge envelope over 260ms. */
function lungePulse(msSince: number): number {
  return msSince >= 0 && msSince < 260 ? Math.sin((msSince / 260) * Math.PI) : 0;
}

// ——— tile pathfinding (identical rules to the reducer) ———

function findPath(
  sx: number,
  sy: number,
  isGoal: (x: number, y: number) => boolean,
): [number, number][] | null {
  if (isGoal(sx, sy)) return [];
  const key = (x: number, y: number) => y * MAP_W + x;
  const prev = new Map<number, number>();
  const seen = new Set([key(sx, sy)]);
  const queue: [number, number][] = [[sx, sy]];
  // diagonals first so open ground favours the direct line
  const DIRS: [number, number][] = [
    [1, 1], [1, -1], [-1, 1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];
  let goal: [number, number] | null = null;
  for (let qi = 0; qi < queue.length && qi < 4000 && !goal; qi++) {
    const [cx, cy] = queue[qi];
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (seen.has(key(nx, ny)) || !isWalkable(nx, ny)) continue;
      // same corner rule as the reducer
      if (dx !== 0 && dy !== 0 && (!isWalkable(cx + dx, cy) || !isWalkable(cx, cy + dy))) continue;
      seen.add(key(nx, ny));
      prev.set(key(nx, ny), key(cx, cy));
      if (isGoal(nx, ny)) {
        goal = [nx, ny];
        break;
      }
      queue.push([nx, ny]);
    }
  }
  if (!goal) return null;
  const tiles: [number, number][] = [];
  let cur = key(goal[0], goal[1]);
  const start = key(sx, sy);
  while (cur !== start) {
    tiles.unshift([cur % MAP_W, Math.floor(cur / MAP_W)]);
    cur = prev.get(cur)!;
  }
  const steps: [number, number][] = [];
  let [lx, ly] = [sx, sy];
  for (const [tx, ty] of tiles) {
    steps.push([tx - lx, ty - ly]);
    [lx, ly] = [tx, ty];
  }
  return steps;
}

type DialogState =
  | { kind: 'npc'; npcId: string }
  | { kind: 'station'; station: StationType }
  | null;

/** Visual walk speed in tiles/sec — this IS the pace; steps are consumed as the model arrives. */
const PLAYER_SPEED = 3.4;
const MONSTER_SPEED = 1.6;
/** Dispatch the next path step when the model is this close to its current tile. */
const STEP_TRIGGER = 0.28;

/** Move at constant speed toward target; returns remaining distance. */
function moveTowards(obj: THREE.Object3D, target: THREE.Vector3, speed: number, dt: number): number {
  const delta = target.clone().sub(obj.position);
  const dist = delta.length();
  if (dist > 6) {
    obj.position.copy(target); // teleport (death, respawn)
    return 0;
  }
  if (dist > 1e-4) {
    // catch up faster when trailing badly (e.g. long diagonal chains)
    const boosted = speed * (1 + Math.max(0, dist - 1.2));
    const step = Math.min(dist, boosted * dt);
    obj.position.add(delta.multiplyScalar(step / dist));
  }
  return Math.max(0, dist - speed * dt);
}

/** Smoothly turn to face a point (shortest arc). */
function faceTowards(obj: THREE.Object3D, target: THREE.Vector3, dt: number) {
  const dx = target.x - obj.position.x;
  const dz = target.z - obj.position.z;
  if (dx * dx + dz * dz < 1e-4) return;
  const desired = Math.atan2(dx, dz);
  let diff = desired - obj.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  obj.rotation.y += diff * Math.min(1, dt * 10);
}

interface Splat {
  sprite: THREE.Sprite;
  born: number;
}

function makeSplatSprite(amount: number | null): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.beginPath();
  ctx.arc(48, 48, 34, 0, Math.PI * 2);
  ctx.fillStyle = amount === null ? '#2f5f9a' : '#b22222';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(amount === null ? '0' : String(amount), 48, 50);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(0.55, 0.55, 1);
  s.renderOrder = 5;
  return s;
}

function makeHpBarSprite(): { sprite: THREE.Sprite; draw: (frac: number) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 20;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(1.0, 0.16, 1);
  sprite.renderOrder = 4;
  let last = -1;
  const draw = (frac: number) => {
    if (Math.abs(frac - last) < 0.01) return;
    last = frac;
    ctx.clearRect(0, 0, 128, 20);
    ctx.fillStyle = '#8a1f1f';
    ctx.fillRect(0, 0, 128, 20);
    ctx.fillStyle = '#3fae35';
    ctx.fillRect(0, 0, Math.max(0, Math.round(128 * frac)), 20);
    tex.needsUpdate = true;
  };
  return { sprite, draw };
}

export default function WorldView() {
  const s = useGame();
  const dispatch = useDispatch();
  const stateRef = useRef(s);
  stateRef.current = s;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [hover, setHover] = useState<string | null>(null);
  const hoverRef = useRef<string | null>(null);

  const pathRef = useRef<[number, number][]>([]);
  const pendingRef = useRef<(() => void) | null>(null);
  const camRef = useRef({ yaw: 0.2, pitch: 0.95, dist: 13 });

  const stopWalking = useCallback(() => {
    pathRef.current = [];
    pendingRef.current = null;
  }, []);

  // Steps are consumed by the frame loop as the model nears each tile,
  // so walking is one continuous glide instead of timed hops.
  const startWalking = useCallback(
    (steps: [number, number][], onArrive: (() => void) | null) => {
      stopWalking();
      pathRef.current = steps;
      pendingRef.current = onArrive;
      if (steps.length === 0) {
        onArrive?.();
        pendingRef.current = null;
      }
    },
    [stopWalking],
  );

  useEffect(() => {
    const container = containerRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'world-canvas3d';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8fb2d4);
    scene.fog = new THREE.Fog(0x8fb2d4, 28, 62);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0xdfeaff, 0x3a4a2c, 0.95));
    const sun = new THREE.DirectionalLight(0xfff2d0, 1.35);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    sun.shadow.camera.far = 120;
    sun.shadow.bias = -0.002;
    scene.add(sun);
    scene.add(sun.target);

    const world: WorldHandles = buildWorld(scene);

    // player
    const playerModel = buildPlayerModel();
    const player = playerModel.group;
    const st0 = stateRef.current;
    player.position.copy(tilePos(st0.world.px, st0.world.py));
    scene.add(player);
    let playerMoving = 0;

    // monster entities
    const entityModels = new Map<number, CharModel>();
    for (const e of st0.world.entities) {
      const def = MONSTER_MAP[e.defId];
      const model = buildMonsterModel(e.defId);
      model.group.position.copy(tilePos(e.x, e.y));
      const data = {
        kind: 'monster', uid: e.uid,
        label: `${def.name} (❤️ ${def.hp}${def.slayerReq ? `, slayer ${def.slayerReq}` : ''}) — click to attack`,
      };
      model.group.userData = data;
      model.group.traverse((o) => (o.userData = data));
      world.interactables.add(model.group);
      entityModels.set(e.uid, model);
    }

    // fight visuals: shared hp bar + target ring + lazy boss sprite
    const hpBar = makeHpBarSprite();
    hpBar.sprite.visible = false;
    scene.add(hpBar.sprite);
    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.52, 24),
      new THREE.MeshBasicMaterial({ color: 0xd9534f, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
    );
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.visible = false;
    scene.add(targetRing);
    let bossModel: CharModel | null = null;
    let bossFor: string | null = null;

    // transient effects
    const splats: Splat[] = [];
    const markers: { mesh: THREE.Mesh; born: number }[] = [];
    let lastFxId = stateRef.current.fx.reduce((m, f) => Math.max(m, f.id), 0);
    let playerSwungAt = -1000;
    let foeSwungAt = -1000;

    // camera state
    const cam = camRef.current;
    const focus = player.position.clone();
    const keys = new Set<string>();
    let dragging = false;
    let dragButton = -1;
    let dragAccum = 0;
    let suppressClick = false;
    let lastMouse: { x: number; y: number } | null = null;
    let dragLast = { x: 0, y: 0 };

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    function pick(clientX: number, clientY: number): { kind: string; [k: string]: unknown } | null {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(world.pickables, true);
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object;
        while (o && !o.userData?.kind) o = o.parent;
        if (!o) continue;
        if (o.userData.kind === 'terrain') {
          return { kind: 'terrain', x: Math.floor(h.point.x), y: Math.floor(h.point.z), point: h.point };
        }
        if (!(o as THREE.Object3D & { visible: boolean }).visible) continue;
        return o.userData as { kind: string };
      }
      return null;
    }

    function spawnMarker(point: THREE.Vector3) {
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.16, 0.26, 20),
        new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.95, side: THREE.DoubleSide }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(point.x, point.y + 0.05, point.z);
      scene.add(mesh);
      markers.push({ mesh, born: performance.now() });
    }

    function fightTargetPos(st: GameState): THREE.Vector3 | null {
      if (st.activity?.type !== 'combat') return null;
      if (st.activity.entityUid !== undefined) {
        const m = entityModels.get(st.activity.entityUid);
        return m ? m.group.position : null;
      }
      const lair = BOSS_LAIRS[st.activity.monsterId];
      return lair ? tilePos(lair.x, lair.y).add(new THREE.Vector3(0, 0.2, 0)) : null;
    }

    // ——— input ———

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (suppressClick) {
        suppressClick = false; // this click was a camera drag
        return;
      }
      const st = stateRef.current;
      if (st.activity?.type === 'combat') return;
      const hit = pick(e.clientX, e.clientY);
      if (!hit) return;
      const adj = (x: number, y: number) => (gx: number, gy: number) =>
        Math.max(Math.abs(gx - x), Math.abs(gy - y)) <= 1 && isWalkable(gx, gy);
      const goAdj = (x: number, y: number, act: () => void) => {
        const path = findPath(st.world.px, st.world.py, adj(x, y));
        if (path) {
          spawnMarker(tilePos(x, y));
          startWalking(path, act);
        }
      };
      if (hit.kind === 'monster') {
        const uid = hit.uid as number;
        const ent = st.world.entities.find((en) => en.uid === uid);
        if (ent && ent.respawn === 0) goAdj(ent.x, ent.y, () => dispatch({ type: 'START_COMBAT_ENTITY', uid }));
      } else if (hit.kind === 'npc') {
        const npc = NPCS.find((n) => n.id === hit.id)!;
        goAdj(npc.x, npc.y, () => setDialog({ kind: 'npc', npcId: npc.id }));
      } else if (hit.kind === 'resource') {
        const x = hit.x as number;
        const y = hit.y as number;
        goAdj(x, y, () => dispatch({ type: 'START_GATHER_NODE', x, y }));
      } else if (hit.kind === 'station') {
        const type = hit.station as StationType;
        const found = stationTile(type, st);
        if (found) goAdj(found.x, found.y, () => setDialog({ kind: 'station', station: type }));
      } else if (hit.kind === 'lair') {
        const lair = BOSS_LAIRS[hit.bossId as string];
        goAdj(lair.x, lair.y, () => dispatch({ type: 'START_COMBAT', id: hit.bossId as string }));
      } else if (hit.kind === 'terrain') {
        const x = hit.x as number;
        const y = hit.y as number;
        if (isWalkable(x, y)) {
          const path = findPath(st.world.px, st.world.py, (gx, gy) => gx === x && gy === y);
          if (path) {
            spawnMarker(hit.point as THREE.Vector3);
            startWalking(path, null);
          }
        }
      }
    };

    // Nearest station tile of a type to the player (for walking to it)
    function stationTile(type: StationType, st: GameState): { x: number; y: number } | null {
      let best: { x: number; y: number } | null = null;
      let bestD = Infinity;
      for (const stn of STATIONS) {
        if (stn.type !== type) continue;
        const d = Math.abs(stn.x - st.world.px) + Math.abs(stn.y - st.world.py);
        if (d < bestD) {
          bestD = d;
          best = stn;
        }
      }
      return best;
    }

    const onMouseMove = (e: MouseEvent) => {
      if (dragButton >= 0) {
        const dx = e.clientX - dragLast.x;
        const dy = e.clientY - dragLast.y;
        dragLast = { x: e.clientX, y: e.clientY };
        if (!dragging) {
          // left button only becomes a camera drag after a little travel,
          // so plain clicks still walk/interact
          dragAccum += Math.abs(dx) + Math.abs(dy);
          if (dragAccum > 6) dragging = true;
        }
        if (dragging) {
          cam.yaw -= dx * 0.008;
          cam.pitch = Math.min(1.35, Math.max(0.35, cam.pitch + dy * 0.005));
          return;
        }
      }
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onPointerDown = (e: MouseEvent) => {
      if (e.button > 2) return;
      dragButton = e.button;
      dragAccum = 0;
      dragging = e.button !== 0; // middle/right rotate immediately, left needs travel
      dragLast = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => {
      if (dragging && dragButton === 0) suppressClick = true;
      dragging = false;
      dragButton = -1;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cam.dist = Math.min(24, Math.max(6, cam.dist * (1 + e.deltaY * 0.001)));
    };
    const onContext = (e: Event) => e.preventDefault();

    // WASD walks; arrow keys are the camera, RS-style
    const KEYMAP: Record<string, [number, number]> = {
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    };
    const CAM_KEYS = new Set(['q', 'e', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    let lastKeyStep = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (KEYMAP[k] || CAM_KEYS.has(k)) {
        e.preventDefault();
        if (KEYMAP[k]) stopWalking();
        keys.add(k);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      keys.delete(k);
    };

    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', onContext);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Hidden tabs suspend requestAnimationFrame entirely — keep consuming path
    // steps on a timer so click-to-walk still finishes while backgrounded.
    const hiddenWalker = window.setInterval(() => {
      if (!document.hidden) return;
      if (pathRef.current.length > 0) {
        const step = pathRef.current.shift()!;
        dispatch({ type: 'MOVE_STEP', dx: step[0], dy: step[1] });
      }
      if (pathRef.current.length === 0 && pendingRef.current) {
        const act = pendingRef.current;
        pendingRef.current = null;
        act();
      }
    }, 350);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ——— frame loop ———

    let raf = 0;
    let prev = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      const t = now / 1000;
      const st = stateRef.current;

      // keyboard movement, rotated to face the camera
      // camera keys: Q/E or ←/→ orbit, ↑/↓ tilt
      if (keys.has('q') || keys.has('ArrowLeft')) cam.yaw += dt * 2.0;
      if (keys.has('e') || keys.has('ArrowRight')) cam.yaw -= dt * 2.0;
      if (keys.has('ArrowUp')) cam.pitch = Math.min(1.35, cam.pitch + dt * 1.2);
      if (keys.has('ArrowDown')) cam.pitch = Math.max(0.35, cam.pitch - dt * 1.2);

      // player: constant-speed glide; the next step fires just before arrival
      const target = tilePos(st.world.px, st.world.py);
      const distToTile = player.position.distanceTo(target);
      if (pathRef.current.length > 0 && distToTile < STEP_TRIGGER) {
        const step = pathRef.current.shift()!;
        dispatch({ type: 'MOVE_STEP', dx: step[0], dy: step[1] });
      }
      if (pathRef.current.length === 0 && pendingRef.current && distToTile < 0.35) {
        const act = pendingRef.current;
        pendingRef.current = null;
        act();
      }
      // held WASD keys walk continuously, rotated to the camera (W+D = diagonal)
      if (distToTile < STEP_TRIGGER && now - lastKeyStep > 90) {
        let kdx = 0;
        let kdy = 0;
        for (const k of keys) {
          if (KEYMAP[k]) {
            kdx += KEYMAP[k][0];
            kdy += KEYMAP[k][1];
          }
        }
        kdx = Math.sign(kdx);
        kdy = Math.sign(kdy);
        if (kdx !== 0 || kdy !== 0) {
          lastKeyStep = now;
          const quad = ((Math.round(cam.yaw / (Math.PI / 2)) % 4) + 4) % 4;
          for (let i = 0; i < quad; i++) [kdx, kdy] = [kdy, -kdx];
          dispatch({ type: 'MOVE_STEP', dx: kdx, dy: kdy });
        }
      }
      const remaining = moveTowards(player, target, PLAYER_SPEED, dt);
      const working =
        st.activity?.type === 'gather' || st.activity?.type === 'thieve' || st.activity?.type === 'craft';
      playerMoving += (Math.min(1, remaining * 6) - playerMoving) * Math.min(1, dt * 10);
      if (remaining > 0.02) faceTowards(player, target, dt);
      playerModel.update(dt, t, playerMoving, working);

      // camera follows
      focus.lerp(target, Math.min(1, dt * 5));
      const cp = Math.cos(cam.pitch);
      camera.position.set(
        focus.x + Math.sin(cam.yaw) * cp * cam.dist,
        focus.y + Math.sin(cam.pitch) * cam.dist,
        focus.z + Math.cos(cam.yaw) * cp * cam.dist,
      );
      camera.lookAt(focus.x, focus.y + 0.6, focus.z);
      sun.position.set(focus.x + 18, focus.y + 32, focus.z + 10);
      sun.target.position.copy(focus);

      // monsters
      const fightingUid = st.activity?.type === 'combat' ? st.activity.entityUid : undefined;
      for (const e of st.world.entities) {
        const model = entityModels.get(e.uid);
        if (!model) continue;
        const alive = e.respawn === 0;
        model.group.visible = alive;
        if (!alive) continue;
        const etarget = tilePos(e.x, e.y);
        const erem = moveTowards(model.group, etarget, MONSTER_SPEED, dt);
        if (e.uid === fightingUid) {
          faceTowards(model.group, player.position, dt);
        } else if (erem > 0.02) {
          faceTowards(model.group, etarget, dt);
        }
        model.update(dt, t + e.uid * 0.77, Math.min(1, erem * 4), false);
      }

      // node depletion swaps
      world.nodeVisuals.forEach((v, key) => {
        const depleted = !!st.world.nodeRespawn[key];
        v.full.visible = !depleted;
        v.depleted.visible = depleted;
      });

      // fight hp bar / target ring / boss stand-in
      const fight = st.activity?.type === 'combat' ? st.activity : null;
      if (fight && fight.entityUid === undefined) {
        if (bossFor !== fight.monsterId) {
          if (bossModel) scene.remove(bossModel.group);
          bossModel = buildMonsterModel(fight.monsterId);
          const lair = BOSS_LAIRS[fight.monsterId];
          if (lair) bossModel.group.position.copy(tilePos(lair.x, lair.y));
          scene.add(bossModel.group);
          bossFor = fight.monsterId;
        }
        if (bossModel) {
          faceTowards(bossModel.group, player.position, dt);
          bossModel.update(dt, t, 0, false);
        }
      } else if (bossModel) {
        scene.remove(bossModel.group);
        bossModel = null;
        bossFor = null;
      }
      // face your opponent; lunge on each swing
      player.rotation.x = -lungePulse(now - playerSwungAt) * 0.3;
      if (fight) {
        const ft = fightTargetPos(st);
        if (ft) faceTowards(player, ft, dt);
        const foePulse = -lungePulse(now - foeSwungAt) * 0.3;
        if (fight.entityUid !== undefined) {
          const em = entityModels.get(fight.entityUid);
          if (em) em.group.rotation.x = foePulse;
        } else if (bossModel) {
          bossModel.group.rotation.x = foePulse;
        }
      }
      const tpos = fight ? fightTargetPos(st) : null;
      if (fight && tpos) {
        const def = MONSTER_MAP[fight.monsterId];
        const modelScale =
          fight.entityUid !== undefined
            ? entityModels.get(fight.entityUid)?.group.scale.x ?? 1
            : bossModel?.group.scale.x ?? 2;
        hpBar.sprite.visible = true;
        hpBar.sprite.position.set(tpos.x, tpos.y + 1.2 * modelScale + 0.5, tpos.z);
        hpBar.draw(fight.monsterHp / def.hp);
        targetRing.visible = true;
        targetRing.position.set(tpos.x, tpos.y + 0.05, tpos.z);
      } else {
        hpBar.sprite.visible = false;
        targetRing.visible = false;
      }

      // hit splats from fx events
      for (const fx of st.fx) {
        if (fx.id <= lastFxId) continue;
        lastFxId = fx.id;
        // whoever dealt this hit lunges forward
        if (fx.target === 'monster') playerSwungAt = now;
        else foeSwungAt = now;
        const base = fx.target === 'player' ? player.position : tpos ?? player.position;
        const sp = makeSplatSprite(fx.amount);
        sp.position.set(
          base.x + (Math.random() - 0.5) * 0.4,
          base.y + 1.1 + Math.random() * 0.3,
          base.z + (Math.random() - 0.5) * 0.4,
        );
        scene.add(sp);
        splats.push({ sprite: sp, born: now });
      }
      for (let i = splats.length - 1; i >= 0; i--) {
        const sp = splats[i];
        const age = (now - sp.born) / 900;
        if (age >= 1) {
          scene.remove(sp.sprite);
          splats.splice(i, 1);
        } else {
          sp.sprite.position.y += dt * 0.5;
          sp.sprite.material.opacity = 1 - age * age;
        }
      }
      for (let i = markers.length - 1; i >= 0; i--) {
        const mk = markers[i];
        const age = (now - mk.born) / 500;
        if (age >= 1) {
          scene.remove(mk.mesh);
          markers.splice(i, 1);
        } else {
          mk.mesh.scale.setScalar(1 - age * 0.6);
          (mk.mesh.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - age);
        }
      }

      // world animations
      for (const fn of world.animated) fn(t);

      // hover hint
      if (lastMouse && !dragging) {
        const hit = pick(lastMouse.x, lastMouse.y);
        const label = hit && hit.kind !== 'terrain' ? ((hit.label as string) ?? null) : null;
        renderer.domElement.style.cursor = label ? 'pointer' : 'default';
        if (label !== hoverRef.current) {
          hoverRef.current = label;
          setHover(label);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(hiddenWalker);
      ro.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('contextmenu', onContext);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      stopWalking();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="world-wrap" ref={containerRef}>
      <div className="zone-label">{zoneName(s.world.px, s.world.py)}</div>
      {hover && <div className="hover-chip">{hover}</div>}
      <button
        className="compass-btn"
        title="Reset camera — drag, arrow keys or Q/E to rotate, scroll to zoom"
        onClick={() => {
          camRef.current.yaw = 0.2;
          camRef.current.pitch = 0.95;
          camRef.current.dist = 13;
        }}
      >
        🧭
      </button>
      {s.activity && s.activity.type !== 'combat' && (
        <button className="activity-chip" onClick={() => dispatch({ type: 'STOP' })} title="Click to stop">
          <span>{activityLabel(s)}</span>
          <TickBar />
        </button>
      )}
      <CombatHud />
      {dialog?.kind === 'npc' && (
        <NpcDialog npc={NPCS.find((n) => n.id === dialog.npcId)!} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'station' && (
        <StationDialog station={dialog.station} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}

function activityLabel(s: GameState): string {
  if (s.activity?.type === 'gather') {
    const a = GATHER_MAP[s.activity.actionId];
    return `${a.icon} ${a.name}…`;
  }
  if (s.activity?.type === 'thieve') return '🎭 Pickpocketing…';
  if (s.activity?.type === 'craft') return '🔨 Working…';
  return '';
}
