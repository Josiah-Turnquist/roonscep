import { GameState } from './types';
import { levelForXp } from './xp';
import { QUESTS } from './quests';
import { BOSSES } from './monsters';

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  check: (s: GameState) => boolean;
}

const anyLevel = (s: GameState, n: number) => Object.values(s.xp).some((xp) => levelForXp(xp) >= n);
const totalLevel = (s: GameState) => Object.values(s.xp).reduce((sum, xp) => sum + levelForXp(xp), 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_blood', name: 'First Blood', icon: '🩸', desc: 'Defeat your first monster', check: (s) => s.stats.totalKills >= 1 },
  { id: 'century', name: 'Centurion', icon: '💯', desc: 'Defeat 100 monsters', check: (s) => s.stats.totalKills >= 100 },
  { id: 'massacre', name: 'Walking Calamity', icon: '☄️', desc: 'Defeat 1,000 monsters', check: (s) => s.stats.totalKills >= 1000 },
  { id: 'boss_slayer', name: 'Bossed Up', icon: '👑', desc: 'Defeat any boss', check: (s) => BOSSES.some((b) => (s.kills[b.id] ?? 0) > 0) },
  { id: 'pantheon_faller', name: 'Pantheon Faller', icon: '🏆', desc: 'Defeat every boss at least once', check: (s) => BOSSES.every((b) => (s.kills[b.id] ?? 0) > 0) },
  { id: 'half_century', name: 'Halfway There', icon: '🌗', desc: 'Reach level 50 in any skill', check: (s) => anyLevel(s, 50) },
  { id: 'elite', name: 'Elite', icon: '🎖️', desc: 'Reach level 75 in any skill', check: (s) => anyLevel(s, 75) },
  { id: 'the_summit', name: 'The Summit', icon: '⛰️', desc: 'Reach level 99 in any skill', check: (s) => anyLevel(s, 99) },
  { id: 'well_rounded', name: 'Well Rounded', icon: '🧩', desc: 'Reach total level 500', check: (s) => totalLevel(s) >= 500 },
  { id: 'renaissance', name: 'Renaissance Adventurer', icon: '🎨', desc: 'Reach total level 1000', check: (s) => totalLevel(s) >= 1000 },
  { id: 'legend', name: 'Living Legend', icon: '🌟', desc: 'Reach total level 1500', check: (s) => totalLevel(s) >= 1500 },
  { id: 'moneybags', name: 'Moneybags', icon: '💰', desc: 'Hold 10,000 gold at once', check: (s) => s.gold >= 10000 },
  { id: 'goldsmith', name: 'Goldsmith', icon: '🪙', desc: 'Earn 100,000 gold in total', check: (s) => s.stats.goldEarned >= 100000 },
  { id: 'dragon_hoard', name: "Dragon's Hoard", icon: '🐲', desc: 'Earn 1,000,000 gold in total', check: (s) => s.stats.goldEarned >= 1000000 },
  { id: 'glutton', name: 'Glutton', icon: '🍽️', desc: 'Eat 100 pieces of food', check: (s) => s.stats.foodEaten >= 100 },
  { id: 'gravekeeper', name: 'Gravekeeper', icon: '⚰️', desc: 'Bury 100 bones', check: (s) => s.stats.bonesBuried >= 100 },
  { id: 'sticky_fingers', name: 'Sticky Fingers', icon: '🎭', desc: '100 successful pickpockets', check: (s) => s.stats.pickpockets >= 100 },
  { id: 'taskmaster', name: 'Taskmaster', icon: '📋', desc: 'Complete 10 slayer tasks', check: (s) => s.stats.tasksCompleted >= 10 },
  { id: 'learning_experience', name: 'Learning Experience', icon: '💀', desc: 'Die 10 times', check: (s) => s.stats.deaths >= 10 },
  { id: 'hero_of_the_realm', name: 'Hero of the Realm', icon: '🛡️', desc: 'Complete every quest', check: (s) => QUESTS.every((q) => s.quests[q.id]?.status === 'done') },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
