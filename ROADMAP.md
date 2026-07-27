# ROADMAP — lol-coach

Canonical parking lot. Chat decides, this file remembers.
v1 scope discipline: nothing moves up a tier without a chat decision.

## v1 — remaining before launch

- [ ] Interaction database growth: champion-centered sweeps over the
      10-champion pool (Mordekaiser, Sylas, Lillia, Milio, Yasuo,
      Aurelion Sol, Lulu, Vayne, Samira, Illaoi). Yasuo windwall
      batch in review.
- [ ] Layer 2: team comp analysis (tag-based; champion_tags.json,
      comp_warnings.json). Tag rules live HERE, not in interaction
      warnings.
- [ ] Layer 3: strategic coaching (rule-based, deliberately thin).
- [ ] Layer 4: ElevenLabs voice summary (top 5-7 priorities, loading
      screen length). Brings the project's first serverless function.
- [ ] Snapshot share links: draft state serialized into URL hash,
      renders full analysis client-side. Zero backend. Build AFTER
      results display matured. Doubles as organic marketing.
- [ ] Data validation script in CI or pre-commit (script exists;
      wiring optional).
- [ ] Champion coverage indicator: show users which champions are
      "fully mapped" — turns depth-over-breadth into a visible
      trust guarantee.
- [ ] Row order matches pick order: drag role labels to reorder
      rows (display-only, roles stay bound to slots, engine
      untouched). Mirrors client layout for positional copying.

## V2 — committed direction

- [ ] LCU integration: local client API (/lol-champ-select/v1/session)
      for automatic live draft detection. Kills manual entry. Riot
      dev account exists.
- [ ] Scouting reports (likely premium anchor): per-player behavioral
      tendencies from Riot Match API — invade frequency, roam rate,
      etc. Needs: backend proxy, API approval, rate-limit design,
      statistical verification thresholds (a wrong scouting claim
      burns trust like a wrong interaction would). Stacks with
      interaction layer.
- [ ] Live shared sessions: shared link with realtime draft sync
      (Supabase realtime or similar). Expensive version of share
      links.
- [ ] Community interaction submissions: users report missing
      interactions -> same review queue as LLM candidates. Batuhan
      remains sole verifier. "Your submission was added" = retention
      loop. v1-cheap variant: GitHub issue template / form link.
- [ ] Per-card usefulness feedback (thumbs during use, not post-game
      surveys). Needs backend to store.

## Ideas — unranked, undecided

- Monetization: free = full analysis; premium = voice, LCU
  auto-detect, scouting. No on-page ads ever. No payment infra
  before real users.
- AI "explain more" button per interaction (opt-in LLM expansion,
  latency-tolerant, premium-adjacent).
- Pick-order display (B-RR-BB-RR-BB-R) — only meaningful once LCU
  provides live draft phase.
- Item interactions (QSS etc.) — currently out of scope entirely.
- summoner_interactions.json content sweep (file planned, unstarted).

## Rejected — with reasons, so they stay rejected

- Screenshot OCR of champ select: obsoleted by LCU, needs backend +
  vision API, saves ~30s over a search bar that already works.
- LLM-at-runtime coaching: slow, hallucination-prone, per-query cost.
  AI generates candidates offline; the shipped app is deterministic.
- Tag-rules as primary warning engine: generic output = stat-wrapper
  competitors. Tags belong to comp analysis (layer 2) only.
