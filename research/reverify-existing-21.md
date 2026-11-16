# Re-verification of the original 21 entries

Checked 2026-11-16 against the fresh wiki corpus (live patch 26.22; entries are stamped 26.14).
The corpus holds ability notes and flags, not description text, so "not checkable" means the claim lives in the ability description.

## Wrong or contradicted by the wiki (2)
- `yasuo-w-senna-r` - says Yasuo W does not block Senna R. Wiki: Senna R is flagged a projectile; "the broad wave is a singular projectile that can be destroyed; the narrow wave is destroyed with it".
- `braum-unbreakable-blocks-ally-heal` - lists `Soraka W` (Starcall is Q), and the wiki says the Rejuvenation projectile travels back to Soraka, so Braum E blocks the enemy Soraka's heal. Not friendly fire.

## Fact is right, but the champion order looks inverted (4)
The engine treats `champions[0]` as the actor. For `counters`, the actor's team gets "advantage"; for `no_effect`, the actor's team gets the warning.
- `morde-r-spell-shields` and `morde-r-spell-shields2` - `[Mordekaiser, Sivir]` / `[Mordekaiser, Nocturne]` as `counters`. The shield holder is the one countering, so Mordekaiser's team is currently shown an advantage. Should be `[Sivir, Mordekaiser]` / `[Nocturne, Mordekaiser]`.
- `morde-r-tahm-r` - `[Mordekaiser, TahmKench]` as `no_effect`, but it is Tahm Kench R that fails. Should be `[TahmKench, Mordekaiser]`.
- `asol-q-yasuo-w` - `[AurelionSol, Yasuo]` as `no_effect`, but it is Yasuo W that fails (every other `yasuo-w-*` entry lists Yasuo first). Should be `[Yasuo, AurelionSol]`.

## Supported by the wiki (13)
- `mordekaiser-r-illaoi-e` - note: Illaoi E's tether is destroyed if her target switches realms; the target is not made a Vessel.
- `sylas-r-mordekaiser-r` - note: Sylas can steal Realm of Death.
- `morde-r-karthus-r` - note: Karthus R damages enemies in all realms.
- `morde-r-kalista-r` - note: Kalista R cannot be cast if her Oathsworn is in another realm.
- `morde-r-yasuo-r` - note: Yasuo R is interrupted if its target switches realms, unless the target is Mordekaiser.
- `morde-r-tahm-r` - note: Tahm Kench R can carry a target outside the circle, but they are displaced back when spat out. (Order issue above.)
- `morde-r-spell-shields` (x2) - note: the cast is cancelled if the target is protected by a spell shield. (Order issue above.)
- `yasuo-w-illaoi-e` - note: the tendril can be blocked by projectile-destroying effects.
- `yasuo-w-sylas-e`, `yasuo-w-vayne-e` - flag only: both abilities are flagged projectiles.
- `asol-q-yasuo-w`, `yasuo-w-asol-r`, `yasuo-w-lux-r`, `yasuo-w-velkoz-r`, `yasuo-w-mordekaiser-e` - flag only: all flagged non-projectile.
- `yasuo-w-xerath-split` - flag only: Q and R non-projectile, E projectile. Xerath W carries no flag either way.

## Not checkable from the corpus (2)
- `milio-r-lillia-r` - no wiki note mentions Milio R against drowsy or sleep.
- `lulu-e-vayne-r` - the true-sight claim is description text.
