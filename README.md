# Skillbound

A RuneScape-inspired, turn-based browser idle/skilling game. Train 18 skills from level 1 to 99, gather resources, smith gear, brew potions, take slayer contracts, finish quests, and bring down 6 bosses for unique drops.

## Features

- **18 skills** on the classic exponential 1–99 XP curve: Attack, Strength, Defence, Hitpoints, Ranged, Magic, Prayer, Slayer, Woodcutting, Mining, Fishing, Foraging, Thieving, Smithing, Cooking, Crafting, Fletching, Alchemy
- **Turn-based combat** — accuracy and max-hit rolls driven by stats and equipment; four melee attack styles direct your xp; eat mid-fight (enemy gets a free swing), drink potions, or flee
- **Prayer** — bury bones for xp, then activate prayers (accuracy, damage, damage reduction) that drain prayer points each combat round
- **Slayer** — three masters assign kill contracts scaled to your combat level; earn slayer xp per on-task kill, redeem points for resource packs and the Slayer Cape; slayer levels unlock exclusive monsters and the final boss
- **11 quests** with kill, delivery and deed objectives, gated behind each other RS-style
- **6 bosses** gated by combat level, from Korgath the Bonelord to Nethrax, Devourer of Souls (Slayer 90), each with unique best-in-slot drops
- **Interlocking economy** — ores → bars → 6 tiers of gear; logs + flax → bows; fish → food; herbs → 11 potions; hides → leather and dragonhide armour; gems → amulets
- **Three combat styles** with full gear paths: melee plate, dragonhide for rangers, mystic robes for mages
- **Auto-eat** (configurable threshold), **offline progress** (up to 6 h of gathering/thieving/crafting), **20 achievements**, lifetime statistics, and save export/import
- **Local-first** — progress autosaves to localStorage every tick

## Run it

```sh
npm install
npm run dev
```

## Beta notes

- Save format: single JSON blob under the `skillbound-save-v1` localStorage key. Export/import lives in the Character tab.
- Death costs 10% of carried gold; you respawn at home with full HP. Auto-eat only saves you while you still have food.
- Offline simulation pauses combat and caps at 6 hours.
