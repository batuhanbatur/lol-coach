import { describe, it, expect } from 'vitest'
import { suggestPicks, MAX_OUTSIDE_POOL } from './suggestPicks.js'

const ROLE_ORDER = ['Top', 'Jungle', 'Mid', 'ADC', 'Support']

// Builds team slots in role order. `picks` maps role -> championId;
// omitted roles are left unfilled.
function makeTeamSlots(picks) {
  return ROLE_ORDER.map((role) => ({ championId: picks[role] ?? null, role }))
}

function makeDraft({ blue = {}, red = {}, bans = [], mySlot = null } = {}) {
  return {
    blue: makeTeamSlots(blue),
    red: makeTeamSlots(red),
    bans: [...bans, ...Array(10).fill(null)].slice(0, 10),
    mySlot,
  }
}

function makeEntry(overrides = {}) {
  return {
    id: 'test-entry',
    champions: ['Actor', 'Target'],
    abilities: [],
    interaction_type: 'counters',
    description: 'test',
    severity: 'medium',
    tags: [],
    patch_verified: '16.1',
    ...overrides,
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

// Everything suggestPicks reads besides the draft and the pool.
function data(overrides = {}) {
  return { interactions: [], championTags: {}, ...overrides }
}

// I am blue Mid (index 2) in every test unless stated otherwise.
const MY_MID = { team: 'blue', index: 2 }

describe('suggestPicks', () => {
  it('returns nothing when the player has not marked their slot', () => {
    const draft = makeDraft({ red: { Top: 'Mordekaiser' } })
    expect(suggestPicks(draft, ['Sylas'], data())).toEqual([])
  })

  it('returns nothing when the player has already picked', () => {
    const draft = makeDraft({ blue: { Mid: 'Lux' }, mySlot: MY_MID })
    expect(suggestPicks(draft, ['Sylas'], data())).toEqual([])
  })

  it('ranks a champion that counters an enemy above one with no data', () => {
    const draft = makeDraft({ red: { Top: 'Mordekaiser' }, mySlot: MY_MID })
    const interactions = [
      makeEntry({ id: 'sylas-morde', champions: ['Sylas', 'Mordekaiser'], severity: 'critical' }),
    ]

    const result = suggestPicks(draft, ['Lux', 'Sylas'], data({ interactions }))

    expect(result.map((s) => s.championId)).toEqual(['Sylas', 'Lux'])
    expect(result[0].score).toBe(4)
    expect(result[0].interactionCards.map((c) => c.entry.id)).toEqual(['sylas-morde'])
    expect(result[1].score).toBe(0)
    expect(result[1].interactionCards).toEqual([])
  })

  it('scores a champion that an enemy counters below zero', () => {
    const draft = makeDraft({ red: { Mid: 'Yasuo' }, mySlot: MY_MID })
    const interactions = [
      makeEntry({ id: 'yasuo-lux', champions: ['Yasuo', 'Lux'], severity: 'high' }),
    ]

    const [lux] = suggestPicks(draft, ['Lux'], data({ interactions }))

    expect(lux.score).toBe(-3)
    expect(lux.interactionCards[0].kind).toBe('warning')
  })

  it('counts same-team synergy with an ally already picked', () => {
    const draft = makeDraft({ blue: { Support: 'Nami' }, mySlot: MY_MID })
    const interactions = [
      makeEntry({
        id: 'nami-yasuo',
        champions: ['Nami', 'Yasuo'],
        interaction_type: 'enables',
        severity: 'high',
      }),
    ]

    const [yasuo] = suggestPicks(draft, ['Yasuo'], data({ interactions }))

    expect(yasuo.score).toBe(3)
  })

  it('ignores cards that do not involve the candidate', () => {
    const draft = makeDraft({
      blue: { Top: 'Sivir' },
      red: { Top: 'Mordekaiser' },
      mySlot: MY_MID,
    })
    const interactions = [
      makeEntry({ id: 'sivir-morde', champions: ['Sivir', 'Mordekaiser'], severity: 'high' }),
    ]

    const [lux] = suggestPicks(draft, ['Lux'], data({ interactions }))

    expect(lux.score).toBe(0)
    expect(lux.interactionCards).toEqual([])
  })

  it('lists banned and already-picked pool champions last, unscored', () => {
    const draft = makeDraft({
      red: { Mid: 'Yasuo' },
      bans: ['Sylas'],
      mySlot: MY_MID,
    })

    const result = suggestPicks(draft, ['Sylas', 'Yasuo', 'Lux'], data())

    expect(result.map((s) => s.championId)).toEqual(['Lux', 'Sylas', 'Yasuo'])
    expect(result[1]).toMatchObject({ available: false, unavailableReason: 'banned', score: null })
    expect(result[2]).toMatchObject({ available: false, unavailableReason: 'picked', score: null })
  })

  it('keeps pool order when scores are tied', () => {
    const draft = makeDraft({ mySlot: MY_MID })
    const result = suggestPicks(draft, ['Lux', 'Yasuo', 'Sylas'], data())
    expect(result.map((s) => s.championId)).toEqual(['Lux', 'Yasuo', 'Sylas'])
  })

  it('penalises a pick that leaves the team heavy on one damage type', () => {
    // Three physical allies locked; my pick makes it four.
    const draft = makeDraft({
      blue: { Top: 'A', Jungle: 'B', ADC: 'C' },
      mySlot: MY_MID,
    })
    const championTags = {
      A: tag({ durability: 'tank', engage: 'strong' }),
      B: tag(),
      C: tag(),
      PhysMid: tag(),
      MagicMid: tag({ damageType: 'magic' }),
    }

    const result = suggestPicks(draft, ['PhysMid', 'MagicMid'], data({ championTags }))

    expect(result.map((s) => s.championId)).toEqual(['MagicMid', 'PhysMid'])
    expect(result[0].score).toBe(0)
    expect(result[1].score).toBe(-2)
    expect(result[1].compGaps.map((g) => g.entry.id)).toEqual(['comp-damage-imbalance-blue'])
  })

  it('does not count the enemy team\'s comp gaps against my pick', () => {
    const draft = makeDraft({
      red: { Top: 'A', Jungle: 'B', ADC: 'C', Support: 'D' },
      mySlot: MY_MID,
    })
    const championTags = { A: tag(), B: tag(), C: tag(), D: tag(), Lux: tag() }

    const [lux] = suggestPicks(draft, ['Lux'], data({ championTags }))

    expect(lux.compGaps).toEqual([])
    expect(lux.score).toBe(0)
  })

  describe('champions outside the pool', () => {
    const interactions = [
      makeEntry({ id: 'liss-morde', champions: ['Lissandra', 'Mordekaiser'], severity: 'high' }),
      makeEntry({ id: 'sylas-morde', champions: ['Sylas', 'Mordekaiser'], severity: 'critical' }),
    ]
    const draft = makeDraft({ red: { Top: 'Mordekaiser' }, mySlot: MY_MID })

    it('suggests an outside champion the draft gives a reason for, flagged as such', () => {
      const result = suggestPicks(
        draft,
        ['Lux', 'Sylas'],
        data({ interactions, roleCandidates: ['Lissandra', 'Lux', 'Sylas', 'Ahri'] })
      )

      expect(result.map((s) => s.championId)).toEqual(['Sylas', 'Lissandra', 'Lux'])
      expect(result.map((s) => s.inPool)).toEqual([true, false, true])
    })

    it('never suggests an outside champion without a positive score', () => {
      const result = suggestPicks(draft, ['Lux'], data({ interactions, roleCandidates: ['Ahri', 'Zoe'] }))
      expect(result.map((s) => s.championId)).toEqual(['Lux'])
    })

    it('does not suggest an outside champion that is banned or picked', () => {
      const bannedDraft = makeDraft({
        red: { Top: 'Mordekaiser' },
        bans: ['Lissandra'],
        mySlot: MY_MID,
      })
      const result = suggestPicks(
        bannedDraft,
        ['Lux'],
        data({ interactions, roleCandidates: ['Lissandra'] })
      )
      expect(result.map((s) => s.championId)).toEqual(['Lux'])
    })

    it('caps outside suggestions and keeps the strongest', () => {
      const many = ['A', 'B', 'C', 'D'].map((id, i) =>
        makeEntry({
          id: `${id}-morde`,
          champions: [id, 'Mordekaiser'],
          severity: ['low', 'critical', 'medium', 'high'][i],
        })
      )
      const result = suggestPicks(
        draft,
        [],
        data({ interactions: many, roleCandidates: ['A', 'B', 'C', 'D'] })
      )

      expect(result).toHaveLength(MAX_OUTSIDE_POOL)
      expect(result.map((s) => s.championId)).toEqual(['B', 'D'])
    })

    it('ranks a pool champion ahead of an outside one on a tie', () => {
      const tied = [
        makeEntry({ id: 'liss-morde', champions: ['Lissandra', 'Mordekaiser'], severity: 'high' }),
        makeEntry({ id: 'lux-morde', champions: ['Lux', 'Mordekaiser'], severity: 'high' }),
      ]
      const result = suggestPicks(
        draft,
        ['Lux'],
        data({ interactions: tied, roleCandidates: ['Lissandra'] })
      )
      expect(result.map((s) => s.championId)).toEqual(['Lux', 'Lissandra'])
    })
  })

  describe('ult steal tiers', () => {
    const ultStealTiers = {
      Rakan: { tier: 'great' },
      Lillia: { tier: 'situational', note: 'Needs several targets.' },
      Zoe: { tier: 'useless' },
      Mordekaiser: { tier: 'great' },
    }

    it('adds tier points to Sylas for rated enemy ultimates', () => {
      const draft = makeDraft({
        red: { Support: 'Rakan', Jungle: 'Lillia', Mid: 'Zoe' },
        mySlot: MY_MID,
      })

      const [sylas] = suggestPicks(draft, ['Sylas'], data({ ultStealTiers }))

      expect(sylas.score).toBe(4) // great 3 + situational 1 + useless 0
      expect(sylas.steals.map((s) => [s.championId, s.tier])).toEqual([
        ['Lillia', 'situational'],
        ['Zoe', 'useless'],
        ['Rakan', 'great'],
      ])
      expect(sylas.steals[0].note).toBe('Needs several targets.')
    })

    it('ignores rated ultimates on my own team', () => {
      const draft = makeDraft({ blue: { Support: 'Rakan' }, mySlot: MY_MID })
      const [sylas] = suggestPicks(draft, ['Sylas'], data({ ultStealTiers }))
      expect(sylas.steals).toEqual([])
      expect(sylas.score).toBe(0)
    })

    it('gives no steal points to any other champion', () => {
      const draft = makeDraft({ red: { Support: 'Rakan' }, mySlot: MY_MID })
      const [lux] = suggestPicks(draft, ['Lux'], data({ ultStealTiers }))
      expect(lux.steals).toEqual([])
      expect(lux.score).toBe(0)
    })

    it('does not double count an enemy that already has an interaction card', () => {
      const draft = makeDraft({ red: { Top: 'Mordekaiser' }, mySlot: MY_MID })
      const interactions = [
        makeEntry({ id: 'sylas-morde', champions: ['Sylas', 'Mordekaiser'], severity: 'critical' }),
      ]

      const [sylas] = suggestPicks(draft, ['Sylas'], data({ interactions, ultStealTiers }))

      expect(sylas.score).toBe(4)
      expect(sylas.steals).toEqual([])
    })
  })
})
