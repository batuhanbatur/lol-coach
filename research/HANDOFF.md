# Handoff - lol-coach (nicecomp.gg)

Last updated 2026-11-17, about 05:00 Istanbul time. Live League patch: 26.22.
Written so any model or person can continue without the earlier chat.
Read `CLAUDE.md` first; its rules still apply. This file adds the state of the work.

## Start here: Batuhan's morning checklist
1. `git status`. One change is uncommitted on purpose: an `exception` line added to the `sylas-r-mordekaiser-r` entry in `src/data/interactions.json`. Check the wording, then commit it.
2. `npm test` (64 tests should pass), then `git push`.
3. Stamp and merge `research/candidates/batch-2-accepted.json` into `interactions.json` (108 entries, `patch_verified: null` until stamped). Run `npm run validate-data`. This is the highest-value step: pick suggestions are only as good as the data.
4. Apply the fixes in `research/reverify-existing-21.md` (3 wrong entries, 4 with inverted champion order).
5. Verdict the open candidate files with y / n / s: `batch-2b-recovered.md` (15 rows), `batch-3-projectile-second-layer.md` (48 rows), `batch-1-projectile-block-pool.md` (12 rows).
6. In-game tests owed:
   - Yone E inside Camille R: is the recast disabled, or does recasting end Camille R? The wiki says both.
   - Sylas with a stolen Kalista R: the wiki says it needs a Black Spear link and that the spear costs 0 gold, so he can probably buy it and bind an ally.
   - Milio R vs Cassiopeia W ground, Singed W ground, Soraka E silence.
   - Yasuo W vs Senna R: the existing entry says "not blocked"; the wiki says Senna R is a destroyable projectile.

## Rules that must not be broken
- Wiki text is the only source for ability facts. Never write a fact from model memory.
- AI does not edit `src/data/interactions.json` unless Batuhan asks for a specific edit. AI produces candidates and staged JSON; Batuhan verdicts, stamps `patch_verified`, validates and merges.
- An entry must (1) deviate from what the ability description predicts and (2) change a pick, ban, or how the matchup is played. Start strict.
- `champions` is `[actor, target]` and uses Data Dragon ids (`Khazix`, `Velkoz`, `MonkeyKing`), not display names. For `counters` the actor's team is shown an advantage; for `no_effect` the actor's team gets the warning.
- Descriptions use champion + key ("Yasuo W"), not ability names. Keys come from the wiki roster, never from memory.
- `npm run validate-data` must exit 0 before every commit. Commit messages are subject line only.
- Batuhan checks UI changes visually (also at 390px) before they are committed.
- Batuhan skips long reports. Keep answers short and lead with what he must do.

## What exists in the app (all committed unless noted)
- Champion picker, drag-swap, Blue/Red teams, ME tag, Bans row.
- Layer 1: `src/engine/matchInteractions.js` matches curated pairwise entries.
- Layer 2: `src/engine/compWarnings.js` tag-based comp warnings.
- Layer 3 (new, 2026-11-17): `src/engine/suggestPicks.js` pick suggestions.
  - The player saves a pick pool (browser storage, `src/utils/pickPool.js`).
  - Each candidate is placed in the player's slot and the two existing engines are re-run; the score is a tally of the resulting cards. No separate scoring model.
  - Up to two champions from outside the pool are suggested, limited to the player's role and to a positive score. Roles come from `src/data/champion_positions.json` (wiki roster, client and external positions combined).
  - `src/data/ult_steal_tiers.json` is EDITORIAL data: Batuhan's own rating of how good each ult is for Sylas to steal (great / good / situational / useless, optional note). Not wiki-verified, read only by the suggestion ranking, never to be copied into `interactions.json`. Only Batuhan adds ratings. Unrated champions are neutral.
  - UI: `src/components/PickSuggestions/`.
- Optional `exception` field on interaction entries: one sentence on when the interaction does not hold, rendered as an always-visible line on the card.
- Team header colors and higher-contrast labels.
- `champion_tags.json` keys were fixed to Data Dragon ids on 2026-11-16.

## Research pipeline
1. `node scripts/fetch-wiki-corpus.js` dumps every current ability's wiki notes to `research/wiki-corpus/` (gitignored; re-run each patch). It needs a machine that can reach the wiki; Batuhan runs it.
   - `abilities.json`: 1,073 abilities with notes, `projectile` / `spellshield` flags, revision date.
   - `mentions.json`: 846 note lines where one champion's ability names another champion.
2. A model filters the dump into `research/candidates/batch-N-*.md` with a verdict column. Every row says what the wiki states and an evidence tier (N explicit note, F flag only, I inferred).
3. Batuhan verdicts each row.
4. Accepted rows are expanded to pairwise schema JSON with `patch_verified: null` (`batch-N-accepted.json`). Multi-champion rows become one entry per pair.
5. Batuhan stamps the patch, merges, validates, commits.

## Research state
- `interactions.json`: 21 entries, all stamped 26.14.
- Batch 2: 60 rows accepted -> 108 staged entries, validated with a test stamp and smoke-tested against the engine. Not staged: #11 (reworded as a batch 3 seed), #12, #61, #65 (in-game tests), #16 (true, excluded by choice).
- Batches 1, 2b, 3: waiting for verdicts.
- `mordekaiser-r-tahmkench-r` (staged) shares its pair with the existing `morde-r-tahm-r`; they state different facts. Decide whether to merge the text.

## Known problems, not fixed
- `src/config/patch.js` still says 26.14, and so does the header.
- The ME button only appears on hover, so it is effectively hidden on touch screens. Pick suggestions depend on it; make it always visible on touch.
- The Bans row is shown although the roadmap once removed it. It is now needed (suggestions respect bans), so the roadmap is what is stale.
- "How it works" and "About" in the footer are generic.
- Mel W: patch 26.22 coverage says her reflect was removed, but the wiki still lists it as a projectile blocker.

## Next work, in suggested order
1. "Try an example draft" button: one click fills both teams and shows real cards. No backend. Do this after batch 2 is merged so the example looks good.
2. Replace "How it works" with one real example card; make "About" the trust signal (wiki-verified, entry count, verified patch).
3. Deploy. Portfolio value saturates early; shipping matters more than more data.
4. Cross suggestions (design first): an enemy Sylas inherits the ult entries of champions on the player's team, so e.g. Milio is a good pick when the player's Lillia can be stolen.
5. Screenshot import for picks and bans (needs a backend):
   - A Supabase Edge Function holds the AI key, takes the image, returns champion ids; the user confirms before locking in.
   - Limits agreed: about three reads per 30 minutes per hashed IP, a global daily cap, and a spending limit at the AI provider.
   - AI must not enter keys or change settings in Batuhan's Supabase account; it writes the function and SQL, he deploys.
6. Per-card feedback (after launch): green / neutral / red plus optional comment on each card, session id in the URL, one insert-only Supabase table. No email flow. A "most useful" ranking comes from that table later.
7. Research: batch 4 on spell shields and cleanses; then the second reader (give another model `mentions.json` plus the two-part filter and diff its list against batch 2).
8. Open design decision: an ability-family schema for "N abilities vs one blocker" and for the 5 entries in `src/data/_pending_schema.json`. Pairwise expansion is the stopgap in use.

## Decisions made on 2026-11-16/17 (so they are not re-argued)
- Corpus first, LLM second: models filter and phrase wiki text, they never supply facts.
- Pairwise expansion of multi-champion rows is acceptable until a family schema exists.
- Pick suggestions reuse the existing engines by simulation.
- Steal ratings use four tiers, not a 0-10 scale; item advice lives in the note, not the model.
- Exceptions are always visible, never hover-only.
- Feedback is collected in-session, not by post-game email.
- Monetization is unproven; the realistic payoff is the job the project helps win. Ship small and test demand before building premium features.
