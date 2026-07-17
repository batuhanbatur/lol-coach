# CLAUDE.md — [WORKING TITLE — pending]

## What this is
Pre-game coaching web app for League of Legends. Runs in a browser
window beside the League client. User manually inputs the 10 picks
during champ select; app surfaces curated, cross-champion coaching
insights. Differentiator: contextual interaction reasoning, NOT stats.

## Stack (v1)
- Vite + React. No SSR, no Next.js. [PROPOSED]
- No backend, no Supabase, no auth. All data is static JSON shipped
  with the app. (One serverless function arrives with the voice
  layer, not before.)
- Champion static data (names, icons, abilities): Data Dragon CDN.
  No API key. No Riot API, no LCU in v1.
- Styling: CSS Modules. [PROPOSED — do not carry over Pizza God's
  inline-style convention.]

## Workflow — non-negotiable
- Claude chat = architecture, critique, decisions, terminal prompts.
  Claude Code (this session) = implementation only.
- Implement ONLY what the prompt specifies. Do not touch other files.
  Do not refactor unrelated code. Do not add features.
- NEVER commit. Batuhan verifies visually (DevTools, iPhone 12 Pro,
  390px) and commits himself. Commit messages: subject line only.
- No Playwright. No browser automation. Visual verification is manual.

## Architecture principles
- Maintainable > clever. Readable > compact. No premature abstraction.
- Components stay focused and understandable. Critical logic stays
  visible — no burying it in abstractions.

## Data model — protect these decisions
- Interaction entries are PERSPECTIVE-NEUTRAL. Entries store neutral
  facts about champion/ability relationships. The app derives
  warning-vs-advantage from team assignment at runtime. Never encode
  team/perspective into interaction data. (Make bugs unrepresentable.)
- Four data files: interactions.json, champion_tags.json,
  summoner_interactions.json, comp_warnings.json.
- Interaction schema: id, champions[], abilities[], interaction_type
  (counters | synergy | amplifies | enables | warning), description,
  severity, timing_note, tags[], patch_verified.
- timing_note is presentational text only. No structured condition
  field until the voice layer needs prioritization.
- patch_verified is required from day one. Entries without it do not
  ship.

## Data pipeline (context — happens outside Claude Code)
- LLM (Gemini) generates CANDIDATE interactions via targeted
  archetype sweeps (e.g., projectile ults vs. projectile blockers).
  LLM output is never trusted directly.
- Batuhan verifies every entry as expert (Practice Tool when unsure).
- Claude chat converts verified analysis into schema JSON.
- Claude Code only ever consumes finished JSON. Never generate or
  edit interaction data content in the terminal.

## Build order
1. Ability interaction engine + manual pick input
2. Team comp analysis (tag-based — this is where tag rules live;
   interaction warnings stay curated)
3. Strategic coaching (rule-based, thin)
4. ElevenLabs voice summary (last; brings the one serverless function)

## Scope discipline
- v1 champion coverage: depth over breadth. [Initial set: TBD —
  scope decision pending.]
- If a task sprawls, stop and flag it instead of improvising.
