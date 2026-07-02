export const MAX_LEVEL = 99;

// xpTable[l] = total xp required to reach level l+1 (classic RuneScape curve)
const xpTable: number[] = [0];
{
  let points = 0;
  for (let lvl = 1; lvl < MAX_LEVEL; lvl++) {
    points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    xpTable[lvl] = Math.floor(points / 4);
  }
}

export function levelForXp(xp: number): number {
  let level = 1;
  for (let l = 1; l < MAX_LEVEL; l++) {
    if (xp >= xpTable[l]) level = l + 1;
    else break;
  }
  return level;
}

/** Total xp required to be the given level. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return xpTable[Math.min(level, MAX_LEVEL) - 1];
}

/** Progress [0,1] through the current level. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  if (level >= MAX_LEVEL) return 1;
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return (xp - cur) / (next - cur);
}
