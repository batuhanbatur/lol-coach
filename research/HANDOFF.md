# Research handoff - interaction data

Last updated 2026-11-16 (live patch 26.22). Written so any model or person can continue.
Read `CLAUDE.md` first: its data-model and pipeline rules still apply.

## Rules that must not be broken
- Wiki text is the only source for ability facts. Never write a fact from model memory.
- No AI edits `src/data/interactions.json`. AI produces candidates and staged JSON; Batuhan verdicts, stamps `patch_verified`, validates and merges.
- An entry must (1) deviate from what the ability description predicts and (2) change a pick, ban, or how the matchup is played. Start strict.
- `champions` is `[actor, target]` and uses Data Dragon ids (`Khazix`, `Velkoz`, `MonkeyKing`...), not display names.
- Descriptions use champion + key ("Yasuo W"), not ability names. Keys come from the wiki roster, never from memory.
- `npm run validate-data` must exit 0 before every commit. Commit messages are subject line only.

## The pipeline
1. `node scripts/fetch-wiki-corpus.js` dumps every current ability's wiki notes to `research/wiki-corpus/` (gitignored; re-run each patch).
   - `abilities.json`: 1,073 abilities with notes, `projectile` / `spellshield` flags, revision date.
   - `mentions.json`: note lines where one champion's ability names another champion.
   - The notes parser was fixed on 2026-11-16 (it cut 20 abilities' notes short at the first multi-line template). RE-RUN the script: the corpus on disk predates the fix. Expect about 846 mentions instead of 702.
2. An LLM filters the dump into a candidates file with a Verdict column (`research/candidates/batch-N-*.md`). Every row cites what the wiki says and an evidence tier.
3. Batuhan marks each row: accept / edit / reject / test in game.
4. Accepted rows are expanded to pairwise schema JSON with `patch_verified: null` (`batch-N-accepted.json`). Multi-champion rows become one entry per pair, following the existing `morde-r-spell-shields` precedent.
5. Batuhan stamps the patch, merges into `interactions.json`, validates, commits.

## State
- `interactions.json`: 21 entries, all stamped 26.14 (eight patches old).
- Batch 1 (projectile block, 10-champion pool): 12 candidates, NOT yet verdicted. See `batch-1-projectile-block-pool.md`.
- Batch 2 (cross-champion mentions): 65 candidates, verdicted. 60 accepted -> 108 staged entries in `batch-2-accepted.json`, ordered by row number. They pass the validator once stamped and were smoke-tested against the matching engine.
- Batch 2b (15 candidates from lines recovered by the parser fix, mostly Death Realm): NOT yet verdicted. See `batch-2b-recovered.md`.
- Not staged from batch 2: #11 (needs clarification), #12, #61, #65 (in-game tests), #16 (accepted as true, excluded by choice).

## Waiting on Batuhan
1. Stamp and merge `batch-2-accepted.json` (or reject individual entries).
2. In-game tests:
   - #12 Yone E inside Camille R: is the recast disabled, or does recasting end Camille R? The wiki says both.
   - #61 Sylas with a stolen Kalista R: the wiki says it is "only castable with a Black Spear link" and that the spear is purchasable in the shop for 0 gold, so Sylas can probably buy it and bind an ally. Confirm.
   - #65 Does Milio R remove Cassiopeia W's ground, Singed W's ground, and Soraka E's silence? Wiki calls them non-dispellable by "most cleanses"; Milio R is not named.
3. Verdict batch 1 and batch 2b.
4. Re-run `node scripts/fetch-wiki-corpus.js` (parser fix).

## Known problems found during research (not fixed)
- `braum-unbreakable-blocks-ally-heal` is wrong twice. It lists `Soraka W`; Starcall is Soraka Q. And the wiki says the Rejuvenation projectile travels back to Soraka and can be intercepted, so Braum E denies the ENEMY Soraka's heal; it is not friendly fire.
- `yasuo-w-senna-r` says Yasuo W does not block Senna R. The wiki says the opposite: Senna R is flagged as a projectile and "the broad wave is a singular projectile that can be destroyed; the narrow wave is destroyed with it". Test, then fix or remove.
- `champion_tags.json` has 9 keys that do not match Data Dragon ids, so those champions silently get no Layer 2 tags: BelVeth, ChoGath, KaiSa, KhaZix, LeBlanc, NunuWillump, RenataGlasc, VelKoz, Wukong should be Belveth, Chogath, Kaisa, Khazix, Leblanc, Nunu, Renata, Velkoz, MonkeyKing. (Checked against Data Dragon 16.22.1.)
- `src/config/patch.js` still says 26.14.
- `mordekaiser-r-tahmkench-r` (staged) shares its champion and ability pair with the existing `morde-r-tahm-r`. They state different facts; decide whether to merge the text.
- Mel W: patch 26.22 coverage says her reflect was removed, but the wiki still lists it as a projectile blocker. Any Mel note is suspect.
- The existing 21 entries have not been re-verified since 26.14.

## Next research, in order
1. Re-verify the 21 existing entries against the fresh corpus.
2. Batch 3 seeds:
   - Jarvan IV R with Vayne E / Poppy E / Nautilus Q. The wiki says each of those "can interact with player-generated terrain" (general rule; Jarvan R is not named). Batuhan suggested this on row 39.
   - #11 Vi R vs Camille R, reworded: a Vi trapped in Camille R who casts R on a target outside keeps charging at the border until the zone ends, hitting others in her path repeatedly.
3. Second layer: interactions the wiki does not state as a named pair. Start from the 286 abilities flagged `projectile` true/special in `abilities.json`, by mechanic cluster (projectile block, spell shield, untargetability, cleanse, stealth / true sight).
4. Second reader: give another model `mentions.json` plus the two-part filter above, ask for its own candidate list, and diff it against batch 2. Disagreements need wiki or Practice Tool.
5. Design decision still open: an ability-family schema for "N abilities vs one blocker" and for the 5 entries in `src/data/_pending_schema.json`. Pairwise expansion is the stopgap.

## Product note
Portfolio value saturates early. After batch 2 merges (about 129 entries) the data is enough to deploy; shipping matters more than more data.
