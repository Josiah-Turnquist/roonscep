# Skillbound

A RuneScape-inspired browser RPG with an explorable overworld. Walk the realm, chop the actual trees, mine the actual rocks, pickpocket the actual townsfolk — then bring down six bosses in their lairs.

## The world

A 72×48 tile overworld rendered on canvas, with click-to-walk pathfinding and WASD/arrow movement:

- **Havenbrook** — home town: general store, smithy (furnace + anvil), inn (cooking range), chapel, quest givers, and Mira the slayer master
- **Westwood & the Elder Grove** — trees from normal to magic, herbs, the elf emissary
- **Willowmere Lake** — fishing spots (shrimp → lobster), willows
- **Greenfields & Copperhill** — cows, goblins, copper and tin for new smiths
- **Darkspine Mountains** — iron through runite the deeper you climb; hill giants, dust wraiths, Dorn's slayer camp
- **Duskmire Swamp** — undead, herbs, and the Sunken Crypt where Korgath waits
- **The Frozen Reach** — ice trolls, blue dragons, shark fishing, Frostfang's lair
- **The Ruined Castle** — black knights, rich pickpocketing, the Fallen King's throne
- **Emberdeep** — demons and fire giants around Embermaw's forge-heart; Zyra the slayer master
- **The Void Rift** — abyssal fiends, Voidheart, and Nethrax, Devourer of Souls

Resource nodes deplete and respawn (trees fall, veins exhaust). Monsters wander their territory and respawn after death. Quests are given and turned in by talking to NPCs. Smelting needs a furnace, forging an anvil, cooking a range.

## The game

- **18 skills** on the classic exponential 1–99 XP curve
- **Turn-based combat** — accuracy/max-hit rolls from stats and gear; four melee attack styles; eat mid-fight (enemy gets a free swing); prayers drain per round
- **Slayer contracts** from three masters, with points shop and slayer-gated monsters
- **11 quests** with prereq chains, given by NPCs in the world
- **6 bosses** with unique best-in-slot drops across all three combat styles
- **Interlocking economy** — ores → bars → gear, logs + flax → bows, fish → food, herbs → potions, hides → armour, gems → amulets
- **Auto-eat, offline progress** (up to 6 h), 20 achievements, stats, save export/import
- **Local-first** — autosaves to localStorage every tick

## Run it

```sh
npm install
npm run dev
```
