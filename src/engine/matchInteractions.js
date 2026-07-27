// Interaction matching engine. Pure functions — no React, no fetching.
//
// Entries are PERSPECTIVE-NEUTRAL (see CLAUDE.md). Team-relative meaning
// (warning vs advantage) is derived here at runtime from the draft.
//
// champions[] order convention: the FIRST champion listed is the ACTOR
// (the one doing the countering / negating / enabling), the SECOND is the
// TARGET. All directional derivation below relies on this ordering.

const SEVERITY_RANKS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function severityRank(severity) {
  return SEVERITY_RANKS[severity] ?? 0;
}

// Builds championId -> "blue" | "red" for every non-null pick.
function buildTeamMap(draft) {
  const teams = new Map();
  for (const teamName of ['blue', 'red']) {
    for (const slot of draft[teamName] ?? []) {
      if (slot && slot.championId != null) {
        teams.set(slot.championId, teamName);
      }
    }
  }
  return teams;
}

// Derives the perspective-relative kind for one active entry, or null if
// the entry does not apply to this draft (e.g. synergy split across teams).
function deriveKind(entry, champTeams, myTeam) {
  const [actor, target] = entry.champions;
  const actorTeam = champTeams.get(actor);
  const targetTeam = target != null ? champTeams.get(target) : undefined;

  switch (entry.interaction_type) {
    case 'counters':
      if (actorTeam === targetTeam) return 'info'; // inert, but worth knowing
      return actorTeam === myTeam ? 'advantage' : 'warning';

    case 'no_effect':
      // The actor's ability does NOT work on the target. If the actor is
      // mine, I might waste the ability believing it works → warning.
      // If the actor is the enemy's, it's just useful to know → info.
      return actorTeam === myTeam ? 'warning' : 'info';

    case 'synergy':
    case 'amplifies':
    case 'enables':
      // Synergy requires both champions on the same team.
      if (actorTeam !== targetTeam) return null;
      return actorTeam === myTeam ? 'advantage' : 'warning';

    case 'warning':
      return entry.champions.some((id) => champTeams.get(id) === myTeam)
        ? 'warning'
        : 'info';

    default:
      return 'info';
  }
}

export function analyzeInteractions(draft, interactions) {
  const champTeams = buildTeamMap(draft);
  const myTeam = draft.mySlot?.team ?? 'blue';
  const myChampionId = draft.mySlot
    ? draft[draft.mySlot.team]?.[draft.mySlot.index]?.championId ?? null
    : null;

  const results = [];
  for (const entry of interactions) {
    const active = entry.champions.every((id) => champTeams.has(id));
    if (!active) continue;

    const kind = deriveKind(entry, champTeams, myTeam);
    if (kind === null) continue;

    results.push({
      entry,
      kind,
      involvesMe:
        myChampionId != null && entry.champions.includes(myChampionId),
    });
  }

  // Array.prototype.sort is stable: equal comparisons keep input order.
  results.sort((a, b) => {
    const bySeverity =
      severityRank(b.entry.severity) - severityRank(a.entry.severity);
    if (bySeverity !== 0) return bySeverity;
    return Number(b.involvesMe) - Number(a.involvesMe);
  });

  return results;
}
