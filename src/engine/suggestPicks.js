// Layer 3: pick suggestions. Pure functions — no React, no fetching.
//
// Ranks the champions in the player's pool against the current draft.
// There is no separate scoring model: each candidate is placed in the
// player's slot and the two existing engines (matchInteractions,
// compWarnings) are run on that hypothetical draft. The score is just a
// tally of the cards that pick would produce, so every suggestion can
// show exactly why it ranked where it did.

import { analyzeInteractions, severityRank } from './matchInteractions.js'
import { analyzeCompWarnings } from './compWarnings.js'

// The one champion whose value depends on which ultimates the enemy has.
const ULT_THIEF = 'Sylas'

// How much an enemy ultimate is worth to the thief, by editorial tier
// (see data/ult_steal_tiers.json). "useless" scores nothing but is still
// shown, because knowing a steal is dead is useful.
export const STEAL_TIER_POINTS = {
  great: 3,
  good: 2,
  situational: 1,
  useless: 0,
}

// Every champion id that can no longer be picked: locked in or banned.
function unavailableReasons(draft) {
  const reasons = new Map()
  for (const championId of draft.bans ?? []) {
    if (championId != null) reasons.set(championId, 'banned')
  }
  for (const team of ['blue', 'red']) {
    for (const slot of draft[team] ?? []) {
      if (slot.championId != null) reasons.set(slot.championId, 'picked')
    }
  }
  return reasons
}

// The same draft with `championId` placed in the player's own slot.
function draftWithMyPick(draft, championId) {
  const { team, index } = draft.mySlot
  return {
    ...draft,
    [team]: draft[team].map((slot, i) =>
      i === index ? { ...slot, championId } : slot
    ),
  }
}

// Rated enemy ultimates the thief could steal. An enemy that already has
// an interaction card with the thief is skipped, so one matchup is never
// counted twice.
function findSteals(draft, championId, interactionCards, ultStealTiers) {
  if (championId !== ULT_THIEF) return []

  const alreadyCovered = new Set(
    interactionCards.flatMap((card) => card.entry.champions)
  )
  const enemyTeam = draft.mySlot.team === 'blue' ? 'red' : 'blue'
  const steals = []
  for (const slot of draft[enemyTeam] ?? []) {
    const rating = ultStealTiers[slot.championId]
    if (!rating || alreadyCovered.has(slot.championId)) continue
    steals.push({
      championId: slot.championId,
      tier: rating.tier,
      note: rating.note ?? null,
      points: STEAL_TIER_POINTS[rating.tier] ?? 0,
    })
  }
  return steals
}

function scoreCandidate(draft, championId, data) {
  const { interactions, championTags, ultStealTiers = {} } = data
  const hypothetical = draftWithMyPick(draft, championId)
  const myTeam = draft.mySlot.team

  // Only cards this pick would add: the ones that involve the candidate.
  const interactionCards = analyzeInteractions(hypothetical, interactions).filter(
    (result) => result.entry.champions.includes(championId)
  )

  // Comp gaps my team would still have after this pick. A candidate that
  // fills a gap simply avoids the penalty the others take.
  const compGaps = analyzeCompWarnings(hypothetical, championTags).filter(
    (result) => result.entry.team === myTeam
  )

  let score = 0
  for (const { kind, entry } of interactionCards) {
    if (kind === 'advantage') score += severityRank(entry.severity)
    else if (kind === 'warning') score -= severityRank(entry.severity)
    // 'info' cards are worth knowing but do not move the score.
  }
  for (const { entry } of compGaps) {
    score -= severityRank(entry.severity)
  }

  const steals = findSteals(draft, championId, interactionCards, ultStealTiers)
  for (const steal of steals) {
    score += steal.points
  }

  return { score, interactionCards, compGaps, steals }
}

// How many champions from outside the pool may be suggested at once.
export const MAX_OUTSIDE_POOL = 2

// `data` is everything the ranking reads:
//   { interactions, championTags, roleCandidates?, ultStealTiers? }
//
// Returns a ranked list of suggestions:
//   { championId, inPool, available, unavailableReason, score,
//     interactionCards, compGaps, steals }
//
// - Every pool champion is listed. Available ones are scored and ranked;
//   banned or already-picked ones follow, unscored, so the player can see
//   why a favourite is missing.
// - `roleCandidates` are champions playable in the player's role. Those
//   outside the pool are only suggested when the draft gives a concrete
//   reason (score above zero), and at most MAX_OUTSIDE_POOL of them.
// - Ranking is by score, best first. On a tie, pool champions come first.
//
// Returns [] when the player has not marked their slot, or has already
// picked in it — there is nothing to suggest in either case.
export function suggestPicks(draft, pool, data) {
  const { roleCandidates = [] } = data
  const mySlot = draft.mySlot
  if (!mySlot) return []
  if (draft[mySlot.team]?.[mySlot.index]?.championId != null) return []

  const unavailable = unavailableReasons(draft)
  const score = (championId) => scoreCandidate(draft, championId, data)

  const fromPool = []
  const blocked = []
  for (const championId of pool) {
    const reason = unavailable.get(championId)
    if (reason) {
      blocked.push({
        championId,
        inPool: true,
        available: false,
        unavailableReason: reason,
        score: null,
        interactionCards: [],
        compGaps: [],
        steals: [],
      })
      continue
    }
    fromPool.push({
      championId,
      inPool: true,
      available: true,
      unavailableReason: null,
      ...score(championId),
    })
  }

  const poolIds = new Set(pool)
  const outsidePool = roleCandidates
    .filter((championId) => !poolIds.has(championId) && !unavailable.has(championId))
    .map((championId) => ({
      championId,
      inPool: false,
      available: true,
      unavailableReason: null,
      ...score(championId),
    }))
    .filter((suggestion) => suggestion.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_OUTSIDE_POOL)

  // Array.prototype.sort is stable: on equal scores, pool champions stay
  // ahead of outside ones, and pool order is kept within the pool.
  const ranked = [...fromPool, ...outsidePool].sort((a, b) => b.score - a.score)

  return [...ranked, ...blocked]
}
