import { SkillId } from './types';

export type SkillCategory = 'Combat' | 'Gathering' | 'Artisan';

export interface SkillDef {
  id: SkillId;
  name: string;
  icon: string;
  category: SkillCategory;
  blurb: string;
}

export const SKILLS: SkillDef[] = [
  { id: 'attack', name: 'Attack', icon: '⚔️', category: 'Combat', blurb: 'Accuracy with melee weapons. Unlocks better swords.' },
  { id: 'strength', name: 'Strength', icon: '💪', category: 'Combat', blurb: 'Raises your melee max hit.' },
  { id: 'defence', name: 'Defence', icon: '🛡️', category: 'Combat', blurb: 'Reduces enemy accuracy. Unlocks better armour.' },
  { id: 'hitpoints', name: 'Hitpoints', icon: '❤️', category: 'Combat', blurb: 'Your life total. Trained passively by all combat.' },
  { id: 'ranged', name: 'Ranged', icon: '🏹', category: 'Combat', blurb: 'Accuracy and damage with bows. Equip a bow to train.' },
  { id: 'magic', name: 'Magic', icon: '✨', category: 'Combat', blurb: 'Accuracy and damage with staves. Equip a staff to train.' },
  { id: 'woodcutting', name: 'Woodcutting', icon: '🪓', category: 'Gathering', blurb: 'Chop trees for logs, used in Fletching and more.' },
  { id: 'mining', name: 'Mining', icon: '⛏️', category: 'Gathering', blurb: 'Mine ores and coal for Smithing. Rarely finds gems.' },
  { id: 'fishing', name: 'Fishing', icon: '🎣', category: 'Gathering', blurb: 'Catch raw fish to cook into food.' },
  { id: 'foraging', name: 'Foraging', icon: '🌿', category: 'Gathering', blurb: 'Gather herbs, flax and wild food from the land.' },
  { id: 'smithing', name: 'Smithing', icon: '🔨', category: 'Artisan', blurb: 'Smelt bars and forge weapons and armour.' },
  { id: 'cooking', name: 'Cooking', icon: '🍳', category: 'Artisan', blurb: 'Cook raw fish into healing food. You might burn some.' },
  { id: 'crafting', name: 'Crafting', icon: '🧵', category: 'Artisan', blurb: 'Work leather, spin bowstrings, cut gem amulets.' },
  { id: 'fletching', name: 'Fletching', icon: '🪃', category: 'Artisan', blurb: 'Carve logs and string them into bows.' },
  { id: 'alchemy', name: 'Alchemy', icon: '⚗️', category: 'Artisan', blurb: 'Brew combat potions and healing elixirs from herbs.' },
];

export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, SkillDef>;

export const COMBAT_SKILLS: SkillId[] = ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic'];
