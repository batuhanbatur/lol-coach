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

function scoreCandidate(draft, championId, interactions, championTags) {
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

  return { score, interactionCards, compGaps }
}

// Returns one suggestion per pool champion:
//   { championId, available, unavailableReason, score, interactionCards, compGaps }
// Available champions come first, best score first (ties keep pool
// order). Banned or already-picked champions follow, unscored, so the
// player can see why a favourite is missing.
//
// Returns [] when the player has not marked their slot, or has already
// picked in it — there is nothing to suggest in either case.
export function suggestPicks(draft, pool, interactions, championTags) {
  const mySlot = draft.mySlot
  if (!mySlot) return []
  if (draft[mySlot.team]?.[mySlot.index]?.championId != null) return []

  const unavailable = unavailableReasons(draft)
  const available = []
  const blocked = []

  for (const championId of pool) {
    const reason = unavailable.get(championId)
    if (reason) {
      blocked.push({
        championId,
        available: false,
        unavailableReason: reason,
        score: null,
        interactionCards: [],
        compGaps: [],
      })
      continue
    }
    available.push({
      championId,
      available: true,
      unavailableReason: null,
      ...scoreCandidate(draft, championId, interactions, championTags),
    })
  }

  // Array.prototype.sort is stable: equal scores keep pool order.
  available.sort((a, b) => b.score - a.score)

  return [...available, ...blocked]
}
