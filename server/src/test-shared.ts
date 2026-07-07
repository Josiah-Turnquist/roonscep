// Headless proof of the shared-world combat + ground-loot rules, no browser:
// two players tag one monster, the monster targets the higher-combat one, the
// killing blow drops loot owned by the killer for 1 minute, then it goes public.
import {
  createSharedWorld, tickSharedWorld, visibleLoot, pickUpLoot, LOOT_OWNER_TICKS,
} from '../../src/game/shared.ts';
import { initialState } from '../../src/game/engine.ts';
import { setRng } from '../../src/game/rng.ts';
import { xpForLevel } from '../../src/game/xp.ts';

// deterministic RNG for a reproducible run
let seed = 12345;
setRng(() => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
});

const world = createSharedWorld();
const m = world.monsters[0];
m.hp = 40; // inflate so both players get to contribute before it dies
const def = m.defId;

const alice = initialState(); // low combat (level 1)
const bob = initialState(); // high combat
for (const sk of ['attack', 'strength', 'defence', 'hitpoints'] as const) bob.xp[sk] = xpForLevel(40);
alice.inventory.shrimp = 99;
bob.inventory.shrimp = 99;
alice.world.px = m.x;
alice.world.py = m.y + 1;
bob.world.px = m.x;
bob.world.py = m.y - 1;
alice.activity = { type: 'combat', monsterId: def, monsterHp: m.hp, entityUid: m.uid };
bob.activity = { type: 'combat', monsterId: def, monsterHp: m.hp, entityUid: m.uid };

const players = new Map([
  ['alice', alice],
  ['bob', bob],
]);

let ticks = 0;
while (m.respawn === 0 && ticks < 80) {
  tickSharedWorld(world, players);
  ticks++;
}

const killerId = (alice.kills[def] ?? 0) > 0 ? 'alice' : 'bob';
const nonKiller = killerId === 'alice' ? 'bob' : 'alice';

console.log(`fight ended in ${ticks} ticks — killer: ${killerId}`);
console.log(`  alice: dealt ${alice.stats.damageDealt}, took ${alice.stats.damageTaken}`);
console.log(`  bob:   dealt ${bob.stats.damageDealt}, took ${bob.stats.damageTaken}`);
console.log(`  ground loot: ${world.loot.length} item(s)`);

const bothTagged = alice.stats.damageDealt > 0 && bob.stats.damageDealt > 0;
const lowerNeverTargeted = alice.stats.damageTaken === 0; // alice is lower combat than bob
const lootDropped = world.loot.length > 0;
const lootOwnedByKiller = world.loot.every((l) => l.owner === killerId);
const ownerSees = visibleLoot(world, killerId).length === world.loot.length;
const nonKillerBlind = visibleLoot(world, nonKiller).length === 0;

console.log(`✓ both players damaged shared HP: ${bothTagged}`);
console.log(`✓ lower-combat player never targeted: ${lowerNeverTargeted} (higher-combat took ${bob.stats.damageTaken})`);
console.log(`✓ loot dropped & owned by killer: ${lootDropped && lootOwnedByKiller}`);
console.log(`✓ owner sees loot, others blind during 1-min window: ${ownerSees && nonKillerBlind}`);

// advance past the ownership window → loot becomes public
world.tickCount += LOOT_OWNER_TICKS + 1;
const nonKillerSeesNow = visibleLoot(world, nonKiller).length === world.loot.length;
console.log(`✓ after 1 minute, non-killer sees the loot: ${nonKillerSeesNow}`);

// the non-killer can now walk over and take the (public) loot
const nk = players.get(nonKiller)!;
const first = world.loot[0];
nk.world.px = first.x;
nk.world.py = first.y;
const took = pickUpLoot(world, nk, nonKiller, first.id);
console.log(`✓ non-killer picks up now-public loot: ${took}`);

const pass =
  bothTagged && lowerNeverTargeted && lootDropped && lootOwnedByKiller &&
  ownerSees && nonKillerBlind && nonKillerSeesNow && took;
console.log(pass ? '\n✅ ALL SHARED-WORLD RULES VERIFIED' : '\n❌ a rule failed');
process.exit(pass ? 0 : 1);
