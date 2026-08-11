// Layer 2: team composition rule evaluator. Pure functions — no React,
// no fetching. Separate from the Layer 1 champion-pair matching engine
// in matchInteractions.js; reuses only its severity ranking.
//
// Each rule is independent, with its own trigger threshold, and is
// evaluated fresh against the current draft on every call — there is
// no "lobby full" gate shared across rules.

import { severityRank } from './matchInteractions.js'

const TANK_ROLES = new Set(['Top', 'Jungle', 'Support'])

function teamLabel(team) {
  return team === 'blue' ? 'Blue' : 'Red'
}

function lockedSlots(teamSlots) {
  return teamSlots.filter((slot) => slot.championId != null)
}

function tagsFor(championId, championTags) {
  return championTags[championId] ?? {}
}

function makeResult(team, myTeam, id, description, severity) {
  return {
    entry: { id: `${id}-${team}`, team, description, severity },
    kind: 'warning',
    involvesMe: myTeam === team,
    isComp: true,
  }
}

function checkNoEngage(team, teamSlots, championTags, myTeam) {
  const locked = lockedSlots(teamSlots)
  if (locked.length < 4) return null

  const hasStrongEngage = locked.some(
    (slot) => tagsFor(slot.championId, championTags).engage === 'strong'
  )
  if (hasStrongEngage) return null

  return makeResult(
    team,
    myTeam,
    'comp-no-engage',
    `No strong engage on ${teamLabel(team)}'s side — this comp can be poked or split apart without a way to force a fight.`,
    'medium'
  )
}

function checkNoTank(team, teamSlots, championTags, myTeam) {
  const roleSlots = teamSlots.filter((slot) => TANK_ROLES.has(slot.role))
  const filled = roleSlots.filter((slot) => slot.championId != null)
  if (filled.length < 2) return null

  const tagsList = filled.map((slot) => tagsFor(slot.championId, championTags))
  const hasTank = tagsList.some((tags) => tags.durability === 'tank')
  if (hasTank) return null

  const hasDurable = tagsList.some((tags) => tags.durability === 'durable')
  const severity = hasDurable ? 'medium' : 'high'

  const openRole = roleSlots.find((slot) => slot.championId == null)
  const description = openRole
    ? `No tank yet — ${openRole.role} could still fill it.`
    : `No tank among ${teamLabel(team)}'s top/jungle/support — the frontline is thin.`

  return makeResult(team, myTeam, 'comp-no-tank', description, severity)
}

function checkDamageImbalance(team, teamSlots, championTags, myTeam) {
  const locked = lockedSlots(teamSlots)
  if (locked.length < 4) return null

  let physical = 0
  let magic = 0
  for (const slot of locked) {
    const damageType = tagsFor(slot.championId, championTags).damageType
    if (damageType === 'physical') physical++
    else if (damageType === 'magic') magic++
  }

  const dominant = physical >= 4 ? 'physical' : magic >= 4 ? 'magic' : null
  if (!dominant) return null

  const mitigation = dominant === 'physical' ? 'armor' : 'magic resist'
  let description
  if (myTeam === team) {
    description = `Your team is heavy ${dominant} damage — the enemy can itemize against a single resistance.`
  } else if (myTeam != null) {
    description = `Enemy team is heavy ${dominant} — prioritize ${mitigation}.`
  } else {
    description = `${teamLabel(team)} is almost all ${dominant} damage — a single ${mitigation} item swing can blunt the whole team.`
  }

  return makeResult(team, myTeam, 'comp-damage-imbalance', description, 'medium')
}

const RULES = [checkNoEngage, checkNoTank, checkDamageImbalance]

export function analyzeCompWarnings(draft, championTags) {
  const myTeam = draft.mySlot?.team ?? null
  const results = []

  for (const team of ['blue', 'red']) {
    const teamSlots = draft[team] ?? []
    for (const rule of RULES) {
      const result = rule(team, teamSlots, championTags, myTeam)
      if (result) results.push(result)
    }
  }

  results.sort((a, b) => severityRank(b.entry.severity) - severityRank(a.entry.severity))

  return results
}
