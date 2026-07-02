export type SkillId =
  | 'attack' | 'strength' | 'defence' | 'hitpoints' | 'ranged' | 'magic'
  | 'woodcutting' | 'mining' | 'fishing' | 'foraging'
  | 'smithing' | 'cooking' | 'crafting' | 'fletching' | 'alchemy';

export type EquipSlot = 'weapon' | 'helmet' | 'body' | 'legs' | 'shield' | 'amulet';

export type CombatStyle = 'melee' | 'ranged' | 'magic';

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
  boost?: { skill: 'attack' | 'strength' | 'defence'; amount: number };
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
  flavor?: string;
}

export type LogKind = 'info' | 'combat' | 'loot' | 'levelup' | 'danger';

export interface LogEntry {
  id: number;
  text: string;
  kind: LogKind;
}

export type Activity =
  | { type: 'gather'; actionId: string }
  | { type: 'craft'; recipeId: string }
  | { type: 'combat'; monsterId: string; monsterHp: number }
  | null;

export interface GameState {
  xp: Record<SkillId, number>;
  currentHp: number;
  gold: number;
  inventory: Record<string, number>;
  equipment: Partial<Record<EquipSlot, string>>;
  boosts: { attack: number; strength: number; defence: number };
  activity: Activity;
  autoCombat: boolean;
  kills: Record<string, number>;
  log: LogEntry[];
  logCounter: number;
}
