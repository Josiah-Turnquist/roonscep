export type SkillId =
  | 'attack' | 'strength' | 'defence' | 'hitpoints' | 'ranged' | 'magic' | 'prayer'
  | 'woodcutting' | 'mining' | 'fishing' | 'foraging' | 'thieving'
  | 'smithing' | 'cooking' | 'crafting' | 'fletching' | 'alchemy' | 'slayer';

export type EquipSlot = 'weapon' | 'helmet' | 'body' | 'legs' | 'shield' | 'amulet' | 'cape';

export type CombatStyle = 'melee' | 'ranged' | 'magic';

export type AttackStyle = 'accurate' | 'aggressive' | 'defensive' | 'controlled';

export type BoostSkill = 'attack' | 'strength' | 'defence' | 'ranged' | 'magic';

export interface Item {
  id: string;
  name: string;
  icon: string;
  value: number;
  slot?: EquipSlot;
  combatStyle?: CombatStyle;
  attackBonus?: number;
  strengthBonus?: number;
  rangedBonus?: number;
  magicBonus?: number;
  defenceBonus?: number;
  heals?: number;
  boost?: { skill: BoostSkill; amount: number };
  restorePrayer?: number;
  /** Prayer xp / prayer point restore when buried. */
  bury?: { xp: number; points: number };
  levelReq?: { skill: SkillId; level: number };
}

export interface GatherAction {
  id: string;
  name: string;
  icon: string;
  skill: SkillId;
  level: number;
  xp: number;
  output: string;
}

export interface ThieveAction {
  id: string;
  name: string;
  icon: string;
  level: number;
  xp: number;
  gold: [number, number];
  loot?: Drop[];
  failDamage: [number, number];
}

export interface Recipe {
  id: string;
  name: string;
  icon: string;
  skill: SkillId;
  level: number;
  xp: number;
  inputs: Record<string, number>;
  goldCost?: number;
  output: string;
  outputQty?: number;
  /** Must stand near this station in the world to make it. */
  station?: 'furnace' | 'anvil' | 'range';
  /** Base chance to ruin the attempt (cooking); shrinks as level rises. */
  burnChance?: number;
}

export interface Drop {
  itemId: string;
  min: number;
  max: number;
  chance: number;
}

export interface Monster {
  id: string;
  name: string;
  icon: string;
  hp: number;
  attack: number;
  defence: number;
  maxHit: number;
  gold: [number, number];
  drops: Drop[];
  boss?: boolean;
  /** Required combat level to challenge (bosses only). */
  levelReq?: number;
  /** Required Slayer level to harm this creature. */
  slayerReq?: number;
  flavor?: string;
}

export type LogKind = 'info' | 'combat' | 'loot' | 'levelup' | 'danger' | 'quest';

/** Transient combat event used by the renderer to draw hit splats. */
export interface FxEvent {
  id: number;
  target: 'player' | 'monster';
  /** Damage dealt; null = a miss. */
  amount: number | null;
}

export interface LogEntry {
  id: number;
  text: string;
  kind: LogKind;
}

export type Activity =
  | { type: 'gather'; actionId: string; nodeKey?: string }
  | { type: 'thieve'; targetId: string }
  | { type: 'craft'; recipeId: string }
  | { type: 'combat'; monsterId: string; monsterHp: number; entityUid?: number }
  | null;

export interface MonsterEntity {
  uid: number;
  defId: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  /** Ticks until this entity returns; 0 = alive. */
  respawn: number;
}

export interface WorldState {
  px: number;
  py: number;
  /** Successful gathers taken from a node since it last respawned. */
  nodeUses: Record<string, number>;
  /** Ticks until a depleted node returns. */
  nodeRespawn: Record<string, number>;
  entities: MonsterEntity[];
}

export interface SlayerTask {
  monsterId: string;
  remaining: number;
  total: number;
  masterId: string;
}

export type QuestObjective =
  | { type: 'kill'; monsterId: string; count: number }
  | { type: 'item'; itemId: string; qty: number }
  | { type: 'stat'; stat: StatKey; count: number };

export interface Quest {
  id: string;
  name: string;
  icon: string;
  flavor: string;
  reqQuests?: string[];
  reqCombat?: number;
  objectives: QuestObjective[];
  rewards: {
    gold?: number;
    xp?: { skill: SkillId; amount: number }[];
    items?: { itemId: string; qty: number }[];
  };
}

export interface QuestProgress {
  status: 'active' | 'done';
  killSnapshot: Record<string, number>;
  statSnapshot: Partial<Record<StatKey, number>>;
}

export type StatKey =
  | 'totalKills' | 'deaths' | 'damageDealt' | 'damageTaken'
  | 'foodEaten' | 'potionsDrunk' | 'bonesBuried' | 'pickpockets'
  | 'goldEarned' | 'goldSpent' | 'itemsGathered' | 'itemsCrafted'
  | 'tasksCompleted' | 'questsCompleted';

export interface Settings {
  autoEat: boolean;
  /** Auto-eat when HP falls below this fraction of max. */
  autoEatThreshold: number;
  /** After a kill, automatically engage the nearest monster of the same kind. */
  chainCombat: boolean;
}

export interface GameState {
  world: WorldState;
  xp: Record<SkillId, number>;
  currentHp: number;
  prayerPoints: number;
  activePrayers: string[];
  attackStyle: AttackStyle;
  gold: number;
  inventory: Record<string, number>;
  equipment: Partial<Record<EquipSlot, string>>;
  boosts: Record<BoostSkill, number>;
  activity: Activity;
  autoCombat: boolean;
  stunnedTicks: number;
  kills: Record<string, number>;
  slayerTask: SlayerTask | null;
  slayerPoints: number;
  quests: Record<string, QuestProgress>;
  achievements: string[];
  stats: Record<StatKey, number>;
  settings: Settings;
  log: LogEntry[];
  logCounter: number;
  fx: FxEvent[];
  savedAt?: number;
}
