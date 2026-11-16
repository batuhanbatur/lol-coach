# Candidates - batch 2: cross-champion wiki mentions

Source: `research/wiki-corpus/mentions.json`, fetched 2026-11-14 (live patch 26.22).
Triage: 420 distinct note lines -> 65 candidates. Strict filter: deviates from the ability description AND would change a pick, ban, or how the matchup is played.

Tier: **N** explicit wiki note | **N-bug** explicit, wiki-flagged bug or special case | **N?** wiki contradicts itself | **I** inferred.
Keys come from the wiki roster, not from memory. Type/severity are suggestions. Nothing here is in `interactions.json`.

Verdict column: ✓ accept / ✎ edit / ✗ reject.

## Death Realm (Mordekaiser R)

| #        | A   | B             | Claim        | Tier                                                                                                                                                   | Type / sev | Verdict           |
| -------- | --- | ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ----------------- | --- |
| ✓ accept | 1   | Mordekaiser R | Pantheon R   | Pantheon R's first channel is interrupted if Pantheon enters or leaves the Death Realm. (This is M9.)                                                  | N          | counters / high   |     |
| ✓ accept | 2   | Mordekaiser R | Kayn R       | If Kayn's target is sent to the Death Realm while Kayn is attached, the channel is cancelled and Kayn pops out. Applies same-team too (M6).            | N          | counters / high   |
| ✓ accept | 3   | Mordekaiser R | Briar R      | Briar loses her frenzy if she enters the Death Realm without her target. If her target is taken instead, the mark is removed but she keeps the frenzy. | N          | counters / medium |     |
| ✓ accept | 4   | Mordekaiser R | Tahm Kench R | A realm transition removes Devour's suppression, so a swallowed enemy is released.                                                                     | N          | counters / medium |     |
| ✓ accept | 5   | Mordekaiser R | Yone E       | Yone E's recast is disabled inside the Death Realm and deferred until it ends.                                                                         | N          | counters / medium |     |
| ✓ accept | 6   | Mordekaiser R | Taric W      | Taric W's link effects are disabled while Taric and his partner are in different realms; the tether itself does not break.                             | N          | warning / low     |     |

## Hextech Ultimatum (Camille R)

| #                                       | A   | B         | Claim      | Tier                                                                                                                                          | Type / sev | Verdict           |
| --------------------------------------- | --- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------- | --- |
| ✓ accept                                | 7   | Camille R | Urgot R    | Camille R ends immediately if her target is dragged by Urgot R's recast.                                                                      | N          | counters / high   |     |
| ✓ accept                                | 8   | Camille R | Sett R     | Sett R cannot carry a target out and ends at the border - unless Sett grabs Camille's own target, who then passes through with him.           | N          | counters / medium |     |
| ✓ accept                                | 9   | Camille R | Kayn R     | Kayn can cast R on a target outside the area and attach through the border, though he still cannot escape.                                    | N          | counters / medium |     |
| ✓ accept                                | 10  | Camille R | Tristana W | Tristana W does not get her out, but still applies its damage and slow.                                                                       | N          | no_effect / low   |     |
| REJECT - this one needs a clarification | 11  | Camille R | Vi R       | Vi R on a target outside the area keeps charging until Camille R ends, hitting secondary targets repeatedly.                                  | N          | warning / low     |     |
| REJECT - I'll check this one            | 12  | Camille R | Yone E     | Wiki is contradictory: one note says Yone E's recast is disabled inside Camille R, another says Camille R ends if Yone recasts. Needs a test. | N?         | counters / medium |     |

## Fate's Call (Kalista R)

| #                                            | A   | B         | Claim                                          | Tier                                                                                           | Type / sev | Verdict          |
| -------------------------------------------- | --- | --------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------- | ---------------- | --- |
| ✓ accept                                     | 13  | Kalista R | Warwick R                                      | Warwick R's channel is special-cased to be interrupted when its target is pulled by Kalista R. | N          | counters / high  |     |
| ✓ accept                                     | 14  | Kalista R | Tahm Kench R                                   | A Devoured target is automatically regurgitated if Kalista R pulls them.                       | N          | counters / high  |     |
| ✓ accept                                     | 15  | Kalista R | Twisted Fate R / Pantheon R / Galio R / Shen R | Same-team: Kalista R cannot be cast while her Oathsworn is channeling any of these.            | N          | warning / medium |     |
| ✓ accept no need to include this one though. | 16  | Kalista R | Sion P                                         | Zombie Sion does not lose health while carried by Kalista R.                                   | N          | synergy / low    |     |

## Executes and death denial

| #        | A   | B            | Claim            | Tier                                                                                                                                              | Type / sev | Verdict           |
| -------- | --- | ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------- | --- |
| ✓ accept | 17  | Tryndamere R | Urgot R          | Urgot R's execute does not kill Tryndamere during R; it only drops him to 1 health.                                                               | N          | counters / high   |     |
| ✓ accept | 18  | Fiora W      | Pyke R           | Fiora cannot be executed by Pyke R during W.                                                                                                      | N          | counters / high   |     |
| ✓ accept | 19  | Fiora W      | Kayn R           | Kayn R cast on Fiora during W fails entirely and goes on full cooldown (same against a spell shield).                                             | N          | counters / high   |     |
| ✓ accept | 20  | Braum E      | Urgot R          | If Braum E intercepts Urgot R's recast chains and Braum is not the target, the chains are destroyed. If Braum is the target he is still executed. | N          | counters / medium |     |
| ✓ accept | 21  | Sion P       | Kayn R / Fiora R | Neither ult can be cast on zombie Sion.                                                                                                           | N          | no_effect / low   |     |

## CC immunity and shields

| #        | A   | B          | Claim                           | Tier                                                                                                                                                                   | Type / sev | Verdict            |
| -------- | --- | ---------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | --- |
| ✓ accept | 22  | Morgana E  | Illaoi E                        | Morgana E blocks the spirit pull even though it is not a crowd-control effect (wiki: special case).                                                                    | N-bug      | counters / high    |     |
| ✓ accept | 23  | Morgana E  | Fizz R                          | Morgana E does not stop Fizz R from attaching.                                                                                                                         | N-bug      | no_effect / medium |     |
| ✓ accept | 24  | Morgana E  | Camille R / Twisted Fate R      | Morgana E does not prevent Camille R's tether or the Twisted Fate R reveal.                                                                                            | N          | no_effect / medium |     |
| ✓ accept | 25  | Malzahar P | Fizz R                          | Fizz R's lure will not attach to Malzahar with his passive up (the passive is consumed).                                                                               | N          | counters / medium  |     |
| ✓ accept | 26  | Malzahar P | Zoe E                           | Malzahar's passive does not prevent drowsy from the Zoe E trap.                                                                                                        | N-bug      | no_effect / low    |     |
| ✓ accept | 27  | Olaf R     | Thresh Q                        | Thresh Q does not stun a CC-immune target, but still marks them and lets Thresh recast to fly in. (Wiki states the general rule; Malzahar's passive is the exception.) | N          | no_effect / medium |     |
| ✓ accept | 28  | Sivir E    | Fizz R / Zilean Q               | Sivir E still blocks these delayed area effects even after they have already been applied to her.                                                                      | N          | counters / medium  |     |
| ✓ accept | 29  | Poppy W    | Malphite R / Zed R / Volibear R | Poppy W does not stop these dashes (the dasher is CC-immune, displacement-immune or untargetable).                                                                     | N          | no_effect / high   |     |
| ✓ accept | 30  | Xin Zhao R | Zed R / Tristana E / Vladimir R | Delayed damage from these does not hit Xin Zhao if their caster is outside his R circle when it applies.                                                               | N          | counters / medium  |     |
| ✓ accept | 31  | Warwick R  | Urgot E / Rell W                | Warwick is not immune to these during his R suppression (he is special-cased immune only to Singed E).                                                                 | N-bug      | counters / medium  |     |
| ✓ accept | 32  | Nocturne R | Twisted Fate R                  | Nocturne R's nearsight overrides Twisted Fate R's reveal regardless of cast order.                                                                                     | N          | counters / medium  |     |
| ✓ accept | 33  | Evelynn W  | Morgana E                       | Evelynn W's magic resistance shred still applies when the charm itself is resisted.                                                                                    | N          | no_effect / low    |     |

## Dodge, blind and block vs on-hit abilities

| #        | A   | B       | Claim                        | Tier                                                            | Type / sev | Verdict            |
| -------- | --- | ------- | ---------------------------- | --------------------------------------------------------------- | ---------- | ------------------ | --- |
| ✓ accept | 34  | Jax E   | Ezreal Q / Gangplank Q       | Jax E dodges these abilities because they apply on-hit effects. | N          | counters / medium  |     |
| ✓ accept | 35  | Teemo Q | Ezreal Q / Gangplank Q       | Teemo Q's blind does not make these miss.                       | N          | no_effect / medium |     |
| ✓ accept | 36  | Shen W  | Ezreal Q / Yasuo Q / Fiora Q | Shen W blocks these abilities, not just basic attacks.          | N          | counters / medium  |     |
| ✓ accept | 37  | Jax E   | Master Yi Q / Senna Q        | Jax E does not dodge these, only the on-hit damage they carry.  | N          | no_effect / low    |     |

## Flat damage reduction vs multi-hit

| #        | A   | B                          | Claim           | Tier                                                                                                                     | Type / sev | Verdict           |
| -------- | --- | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------- | ----------------- | --- |
| ✓ accept | 38  | Amumu E / Fizz P / Leona W | Ashe Q / Zeri Q | Flat damage reduction applies to every arrow / every one of the 7 instances, making it far more effective against these. | N          | counters / medium |     |

## Synergies

| #                                                | A   | B                                | Claim                          | Tier                                                                                                      | Type / sev | Verdict            |
| ------------------------------------------------ | --- | -------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | --- |
| ✓ accept Same Goes for Jarvan R I guess this one | 39  | Azir R                           | Vayne E / Poppy E / Nautilus Q | Azir R's wall counts as terrain for 'into terrain' effects against enemies.                               | N          | synergy / high     |     |
| ✓ accept                                         | 40  | Nami Q                           | Yasuo R                        | Nami Q's bubble counts as airborne for Yasuo R even though it is a stun.                                  | N          | enables / high     |     |
| ✓ accept                                         | 41  | Taliyah R / Trundle E            | Yasuo R                        | Terrain that displaces enemies counts as airborne for Yasuo R.                                            | N          | enables / medium   |     |
| ✓ accept Anivia W Also stops Sion R.             | 42  | Anivia W / Taliyah R / Trundle E | Qiyana R                       | Player-made terrain touching map terrain is treated as one piece, so Qiyana R's shockwave wraps along it. | N          | amplifies / medium |     |
| ✓ accept                                         | 43  | Thresh W                         | Lucian R / Xerath R            | Both can take Thresh W mid-channel without interrupting their R.                                          | N          | synergy / low      |     |

## Same-team anti-synergy

| #        | A   | B            | Claim                                   | Tier                                                                   | Type / sev | Verdict          |
| -------- | --- | ------------ | --------------------------------------- | ---------------------------------------------------------------------- | ---------- | ---------------- | --- |
| ✓ accept | 44  | Tahm Kench R | Anivia R                                | Tahm Kench R on an allied Anivia interrupts her R (Zhonya's does not). | N          | warning / medium |     |
| ✓ accept | 45  | Ryze R       | Caitlyn R / Galio R / Jhin R / Xerath R | Allies channeling these are not teleported by Ryze R.                  | N          | warning / low    |     |

## Isolation (Kha'Zix Q)

| #        | A   | B         | Claim                                                            | Tier                                                                                       | Type / sev | Verdict            |
| -------- | --- | --------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------- | ------------------ | --- |
| ✓ accept | 46  | Kha'Zix Q | Illaoi P / Gangplank E / Teemo R / Yorick W / Jhin E / Nidalee W | These summoned units do not count as allies of the target, so they do not break Isolation. | N          | no_effect / medium |     |

## Projectile-block family (needs the family schema)

| #        | A   | B                            | Claim                   | Tier                                                                                                                               | Type / sev | Verdict            |
| -------- | --- | ---------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | --- |
| ✓ accept | 47  | Yasuo W                      | Irelia E                | If Yasuo W stops the blades converging, Irelia E neither stuns nor damages.                                                        | N          | counters / high    |     |
| ✓ accept | 48  | Yasuo W / Samira W           | Taliyah R               | Stops the wall forming further (existing terrain stays). A surfing Taliyah is stunned 0.25s and knocked off.                       | N          | counters / high    |     |
| ✓ accept | 49  | Yasuo W / Samira W           | Fizz R                  | The lure is not destroyed: it stops at the wall and the eruption forms there.                                                      | N          | warning / medium   |     |
| ✓ accept | 50  | Yasuo W / Samira W           | Lux W                   | Both destroy Lux W's shield wand. Braum E does not.                                                                                | N          | counters / medium  |     |
| ✓ accept | 51  | Braum E                      | Graves Q                | Braum E counts as terrain for Graves Q, triggering its early second detonation. Yasuo W removes the whole ability, trail included. | N          | warning / medium   |     |
| ✓ accept | 52  | Yasuo W / Braum E            | Olaf Q                  | The axe is not destroyed; it stops and stays on the ground for Olaf to pick up.                                                    | N          | no_effect / medium |     |
| ✓ accept | 53  | Yasuo W                      | Syndra E                | Yasuo W blocks the part of Syndra E it touches; pushed spheres stop at the wall.                                                   | N          | counters / medium  |     |
| ✓ accept | 54  | Yasuo W / Samira W / Braum E | Azir R                  | Azir R's charge ends early when the soldiers hit any of these.                                                                     | N          | counters / medium  |     |
| ✓ accept | 55  | Yasuo W                      | Cassiopeia W / Singed W | Both are projectiles on the way out and can be blocked by Yasuo W.                                                                 | N          | counters / low     |     |
| ✓ accept | 56  | Yasuo W                      | Sion E                  | A minion or monster thrown by Sion E is not blocked (the initial projectile is).                                                   | N          | no_effect / low    |     |
| ✓ accept | 57  | Yasuo W                      | Seraphine W             | Yasuo W can block a missile of Seraphine W, but the heal is unaffected.                                                            | N          | no_effect / low    |     |
| ✓ accept | 58  | Yasuo W / Braum E            | Aphelios Q              | With Severum, Aphelios's turret attacks cannot be intercepted.                                                                     | N          | no_effect / medium |     |
| ✓ accept | 59  | Yasuo W / Braum E            | Swain R / Galio Q       | Only the intercepted portion is blocked.                                                                                           | N          | counters / low     |     |

## Sylas R steals

| #                                                                                                            | A   | B       | Claim     | Tier                                                                                         | Type / sev | Verdict            |
| ------------------------------------------------------------------------------------------------------------ | --- | ------- | --------- | -------------------------------------------------------------------------------------------- | ---------- | ------------------ | --- |
| ✓ accept                                                                                                     | 60  | Sylas R | Samira R  | Sylas can cast a stolen Samira R without any Style grade.                                    | N          | enables / medium   |     |
| hmm - this one is suspicious. what if sylas purchases a spear of oathsworn and binds someone? I'll test this | 61  | Sylas R | Kalista R | A stolen Kalista R only works if Sylas has an Oathsworn link, so it is usually a dead steal. | N          | no_effect / medium |     |
| ✓ accept                                                                                                     | 62  | Sylas R | Neeko P   | Sylas always steals Neeko's real R, whoever she is disguised as.                             | N          | warning / low      |     |

## Neeko disguise

| #        | A   | B        | Claim    | Tier                                                                          | Type / sev | Verdict        |
| -------- | --- | -------- | -------- | ----------------------------------------------------------------------------- | ---------- | -------------- | --- |
| ✓ accept | 63  | Akshan R | Neeko P  | Akshan R breaks Neeko's disguise before damaging her and puts it on cooldown. | N          | counters / low |     |
| ✓ accept | 64  | Neeko P  | Darius R | Disguising as a non-champion interrupts Darius R's cast time on her.          | N          | counters / low |     |

## Inferred - test before trusting

| #                     | A   | B       | Claim                              | Tier                                                                                                                                                    | Type / sev | Verdict            |
| --------------------- | --- | ------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ | --- |
| i'll test ingame soon | 65  | Milio R | Cassiopeia W / Singed W / Soraka E | Wiki says these debuffs are non-dispellable and survive 'most cleanses' (Olaf R is the named exception). Milio R is not named, so this is my inference. | I          | no_effect / medium |     |
