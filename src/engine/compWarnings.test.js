import { describe, it, expect } from 'vitest'
import { analyzeCompWarnings } from './compWarnings.js'

const ROLE_ORDER = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']

// Builds team slots in role order. `picks` maps role -> championId;
// omitted roles are left unfilled.
function makeTeamSlots(picks) {
  return ROLE_ORDER.map((role) => ({ championId: picks[role] ?? null, role }))
}

function makeDraft({ blue = {}, red = {}, mySlot = null } = {}) {
  return {
    blue: makeTeamSlots(blue),
    red: makeTeamSlots(red),
    bans: Array(10).fill(null),
    mySlot,
  }
}

function tag(overrides = {}) {
  return {
    damageType: 'physical',
    durability: 'squishy',
    engage: 'none',
    cc: 'none',
    range: 'melee',
    scaling: 'mid',
    ...overrides,
  }
}

function findEntry(results, idPrefix) {
  return results.find((r) => r.entry.id.startsWith(idPrefix))
}

describe('no engage', () => {
  it('warns when 4+ locked and none have strong engage', () => {
    const tags = { A: tag(), B: tag(), C: tag(), D: tag() }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D' } })
    const results = analyzeCompWarnings(draft, tags)
    const entry = findEntry(results, 'comp-no-engage-blue')
    expect(entry).toBeDefined()
    expect(entry.entry.severity).toBe('medium')
    expect(entry.isComp).toBe(true)
  })

  it('does not warn when fewer than 4 are locked', () => {
    const tags = { A: tag(), B: tag(), C: tag() }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B', Mid: 'C' } })
    const results = analyzeCompWarnings(draft, tags)
    expect(findEntry(results, 'comp-no-engage')).toBeUndefined()
  })

  it('does not warn when at least one locked champion has strong engage', () => {
    const tags = { A: tag({ engage: 'strong' }), B: tag(), C: tag(), D: tag() }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D' } })
    const results = analyzeCompWarnings(draft, tags)
    expect(findEntry(results, 'comp-no-engage')).toBeUndefined()
  })

  it('sets involvesMe based on mySlot team', () => {
    const tags = { A: tag(), B: tag(), C: tag(), D: tag() }
    const draft = makeDraft({
      blue: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D' },
      mySlot: { team: 'red', index: 0 },
    })
    const results = analyzeCompWarnings(draft, tags)
    expect(findEntry(results, 'comp-no-engage-blue').involvesMe).toBe(false)
  })
})

describe('no tank (top/jungle/support)', () => {
  it('nudges toward the open role when only 2 of 3 are filled, high severity when nothing is durable', () => {
    const tags = { A: tag(), B: tag() }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B' } })
    const results = analyzeCompWarnings(draft, tags)
    const entry = findEntry(results, 'comp-no-tank-blue')
    expect(entry).toBeDefined()
    expect(entry.entry.severity).toBe('high')
    expect(entry.entry.description).toContain('Support could still fill it')
  })

  it('is medium severity when at least one filled slot is durable but none is tank', () => {
    const tags = { A: tag({ durability: 'durable' }), B: tag() }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B' } })
    const results = analyzeCompWarnings(draft, tags)
    const entry = findEntry(results, 'comp-no-tank-blue')
    expect(entry.entry.severity).toBe('medium')
  })

  it('phrases a firm gap once all 3 roles are filled and still no tank', () => {
    const tags = { A: tag(), B: tag(), C: tag({ durability: 'durable' }) }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B', Support: 'C' } })
    const results = analyzeCompWarnings(draft, tags)
    const entry = findEntry(results, 'comp-no-tank-blue')
    expect(entry.entry.description).not.toContain('could still fill it')
    expect(entry.entry.description).toContain('frontline is thin')
  })

  it('does not warn when one of the filled slots is a tank', () => {
    const tags = { A: tag({ durability: 'tank' }), B: tag() }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B' } })
    const results = analyzeCompWarnings(draft, tags)
    expect(findEntry(results, 'comp-no-tank')).toBeUndefined()
  })

  it('does not warn when fewer than 2 of the 3 roles are filled', () => {
    const tags = { A: tag() }
    const draft = makeDraft({ blue: { Top: 'A' } })
    const results = analyzeCompWarnings(draft, tags)
    expect(findEntry(results, 'comp-no-tank')).toBeUndefined()
  })

  it('ignores Mid and ADC picks entirely', () => {
    const tags = { A: tag(), B: tag(), C: tag({ durability: 'tank' }), D: tag({ durability: 'tank' }) }
    const draft = makeDraft({ blue: { Top: 'A', Support: 'B', Mid: 'C', ADC: 'D' } })
    const results = analyzeCompWarnings(draft, tags)
    // Mid/ADC are tanks but shouldn't count; only Top+Support are checked.
    const entry = findEntry(results, 'comp-no-tank-blue')
    expect(entry).toBeDefined()
  })
})

describe('damage imbalance', () => {
  it('warns when 4+ of the locked picks are physical', () => {
    const tags = {
      A: tag({ damageType: 'physical' }),
      B: tag({ damageType: 'physical' }),
      C: tag({ damageType: 'physical' }),
      D: tag({ damageType: 'physical' }),
    }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D' } })
    const results = analyzeCompWarnings(draft, tags)
    const entry = findEntry(results, 'comp-damage-imbalance-blue')
    expect(entry).toBeDefined()
    expect(entry.entry.severity).toBe('medium')
    expect(entry.entry.description).toContain('physical')
  })

  it('warns on magic dominance and ignores mixed entries in the count', () => {
    const tags = {
      A: tag({ damageType: 'magic' }),
      B: tag({ damageType: 'magic' }),
      C: tag({ damageType: 'magic' }),
      D: tag({ damageType: 'magic' }),
      E: tag({ damageType: 'mixed' }),
    }
    const draft = makeDraft({
      blue: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D', Support: 'E' },
    })
    const results = analyzeCompWarnings(draft, tags)
    const entry = findEntry(results, 'comp-damage-imbalance-blue')
    expect(entry).toBeDefined()
    expect(entry.entry.description).toContain('magic')
  })

  it('does not warn when fewer than 4 are locked', () => {
    const tags = {
      A: tag({ damageType: 'physical' }),
      B: tag({ damageType: 'physical' }),
      C: tag({ damageType: 'physical' }),
    }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B', Mid: 'C' } })
    const results = analyzeCompWarnings(draft, tags)
    expect(findEntry(results, 'comp-damage-imbalance')).toBeUndefined()
  })

  it('phrases the message diagnostically when the triggering team is my own', () => {
    const tags = {
      A: tag({ damageType: 'physical' }),
      B: tag({ damageType: 'physical' }),
      C: tag({ damageType: 'physical' }),
      D: tag({ damageType: 'physical' }),
    }
    const draft = makeDraft({
      blue: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D' },
      mySlot: { team: 'blue', index: 0 },
    })
    const results = analyzeCompWarnings(draft, tags)
    const entry = findEntry(results, 'comp-damage-imbalance-blue')
    expect(entry.entry.severity).toBe('medium')
    expect(entry.entry.description).toContain('Your team')
    expect(entry.entry.description).not.toContain('prioritize')
  })

  it('phrases the message actionably when the triggering team is the enemy', () => {
    const tags = {
      A: tag({ damageType: 'magic' }),
      B: tag({ damageType: 'magic' }),
      C: tag({ damageType: 'magic' }),
      D: tag({ damageType: 'magic' }),
    }
    const draft = makeDraft({
      blue: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D' },
      mySlot: { team: 'red', index: 0 },
    })
    const results = analyzeCompWarnings(draft, tags)
    const entry = findEntry(results, 'comp-damage-imbalance-blue')
    expect(entry.entry.severity).toBe('medium')
    expect(entry.entry.description).toContain('Enemy team')
    expect(entry.entry.description).toContain('prioritize magic resist')
  })

  it('does not warn when damage types are balanced', () => {
    const tags = {
      A: tag({ damageType: 'physical' }),
      B: tag({ damageType: 'physical' }),
      C: tag({ damageType: 'magic' }),
      D: tag({ damageType: 'magic' }),
    }
    const draft = makeDraft({ blue: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D' } })
    const results = analyzeCompWarnings(draft, tags)
    expect(findEntry(results, 'comp-damage-imbalance')).toBeUndefined()
  })
})

describe('per-team independence', () => {
  it('evaluates blue and red separately, both can warn at once', () => {
    const tags = { A: tag(), B: tag(), C: tag(), D: tag() }
    const draft = makeDraft({
      blue: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D' },
      red: { Top: 'A', Jungle: 'B', Mid: 'C', ADC: 'D' },
    })
    const results = analyzeCompWarnings(draft, tags)
    expect(findEntry(results, 'comp-no-engage-blue')).toBeDefined()
    expect(findEntry(results, 'comp-no-engage-red')).toBeDefined()
  })
})
