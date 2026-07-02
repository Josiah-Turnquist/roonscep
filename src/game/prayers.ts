export interface PrayerDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  /** Prayer points drained per combat round while active. */
  drain: number;
  desc: string;
  accMult?: number;
  dmgMult?: number;
  /** Fraction of incoming damage prevented. */
  reduce?: number;
}

export const PRAYERS: PrayerDef[] = [
  { id: 'clarity', name: 'Clarity of Thought', icon: '👁️', level: 5, drain: 1, desc: '+10% accuracy', accMult: 1.1 },
  { id: 'burst_of_strength', name: 'Burst of Strength', icon: '✊', level: 15, drain: 1, desc: '+10% damage', dmgMult: 1.1 },
  { id: 'stone_skin', name: 'Stone Skin', icon: '🪨', level: 30, drain: 2, desc: '−20% damage taken', reduce: 0.2 },
  { id: 'zeal', name: 'Zeal', icon: '🔥', level: 45, drain: 3, desc: '+15% accuracy and damage', accMult: 1.15, dmgMult: 1.15 },
  { id: 'iron_will', name: 'Iron Will', icon: '⚙️', level: 60, drain: 3, desc: '−35% damage taken', reduce: 0.35 },
];

export const PRAYER_MAP = Object.fromEntries(PRAYERS.map((p) => [p.id, p]));
