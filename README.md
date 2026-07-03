# Roonscep

A silly, lovingly dumbed-down RuneScape-like in the browser: a low-poly semi-3D world you walk around and click on. Chop the trees, mine the rocks, pickpocket the townsfolk, die to a giant rat, and tell everyone it was a skill issue.

## The world

A 72×48 tile overworld rendered in three.js — angled camera (drag or Q/E to spin, scroll to zoom), click-to-walk pathfinding with proper diagonal strolling, WASD if you insist:

- **Havenbrook** — home town: general store, smithy (furnace + anvil), inn (cooking range), chapel, quest givers, and Mira the slayer master
- **Westwood & the Elder Grove** — trees from normal to magic, herbs, an elf with deep pockets
- **Willowmere Lake** — fishing spots (shrimp → lobster), willows
- **Greenfields & Copperhill** — cows (that look like cows), goblins, copper and tin
- **Darkspine Mountains** — iron through runite the deeper you climb; hill giants, dust wraiths, Dorn's slayer camp
- **Duskmire Swamp** — undead, herbs, and the Sunken Crypt where Korgath waits
- **The Frozen Reach** — ice trolls, blue dragons, shark fishing, Frostfang's lair
- **The Ruined Castle** — black knights, rich pickpocketing, the Fallen King's throne
- **Emberdeep** — demons and fire giants around Embermaw's forge-heart; Zyra the slayer master
- **The Void Rift** — abyssal fiends, Voidheart, and Nethrax, Devourer of Souls

Everything is a real low-poly model — articulated humanoids with hats and swinging limbs, horned cows with udders, scurrying rats, winged dragons, floating void orbs. Resource nodes visibly deplete into stumps and rubble, monsters wander their territory, combat happens in the world with hit splats and overhead HP bars.

## The game

- **18 skills** on the classic exponential 1–99 XP curve
- **Turn-based combat** — accuracy/max-hit rolls from stats and gear; four melee attack styles; eat mid-fight (enemy gets a free swing); prayers drain per round; opt-in chain combat
- **Slayer contracts** from three masters, with a points shop and slayer-gated monsters
- **11 quests** with prereq chains, given by NPCs in the world
- **6 bosses** in world lairs with unique best-in-slot drops across all three combat styles
- **Interlocking economy** — ores → bars → gear, logs + flax → bows, fish → food, herbs → potions, hides → armour, gems → amulets
- **Auto-eat, offline progress** (up to 6 h), 20 achievements, stats, save export/import
- **Local-first** — autosaves to localStorage every tick

## Run it

```sh
npm install
npm run dev
```
