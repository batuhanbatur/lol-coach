import { describe, it, expect } from 'vitest';
import { analyzeInteractions, severityRank } from './matchInteractions.js';

// Minimal draft builder. Champions are plain string ids; roles are
// irrelevant to the engine, so they're omitted from slots.
function makeDraft({ blue = [], red = [], mySlot = null } = {}) {
  const slots = (ids) => {
    const team = [];
    for (let i = 0; i < 5; i++) {
      team.push({ championId: ids[i] ?? null, role: null });
    }
    return team;
  };
  return {
    blue: slots(blue),
    red: slots(red),
    bans: Array(10).fill(null),
    mySlot,
  };
}

function makeEntry(overrides = {}) {
  return {
    id: 'test-entry',
    champions: ['Actor', 'Target'],
    abilities: [],
    interaction_type: 'counters',
    description: 'test',
    severity: 'medium',
    timing_note: '',
    tags: [],
    patch_verified: '16.1',
    ...overrides,
  };
}

describe('severityRank', () => {
  it('ranks critical > high > medium > low > unknown', () => {
    expect(severityRank('critical')).toBeGreaterThan(severityRank('high'));
    expect(severityRank('high')).toBeGreaterThan(severityRank('medium'));
    expect(severityRank('medium')).toBeGreaterThan(severityRank('low'));
    expect(severityRank('low')).toBeGreaterThan(severityRank('nonsense'));
  });
});

describe('counters derivation', () => {
  const entry = makeEntry({ interaction_type: 'counters' });

  it('actor on enemy team, target on mine → warning', () => {
    const draft = makeDraft({ blue: ['Target'], red: ['Actor'] });
    const [result] = analyzeInteractions(draft, [entry]);
    expect(result.kind).toBe('warning');
  });

  it('actor on my team, target on enemy → advantage', () => {
    const draft = makeDraft({ blue: ['Actor'], red: ['Target'] });
    const [result] = analyzeInteractions(draft, [entry]);
    expect(result.kind).toBe('advantage');
  });

  it('both on same team → info', () => {
    const draft = makeDraft({ blue: ['Actor', 'Target'] });
    const [result] = analyzeInteractions(draft, [entry]);
    expect(result.kind).toBe('info');
  });
});

describe('mySlot on red team', () => {
  it('flips counters derivation', () => {
    const entry = makeEntry({ interaction_type: 'counters' });
    const draft = makeDraft({
      blue: ['Target'],
      red: ['Actor'],
      mySlot: { team: 'red', index: 0 },
    });
    // Actor is on red (my team) countering Target on blue → advantage.
    const [result] = analyzeInteractions(draft, [entry]);
    expect(result.kind).toBe('advantage');
  });
});

describe('no_effect derivation', () => {
  const entry = makeEntry({ interaction_type: 'no_effect' });

  it('my actor → warning (I might waste the ability)', () => {
    const draft = makeDraft({ blue: ['Actor'], red: ['Target'] });
    const [result] = analyzeInteractions(draft, [entry]);
    expect(result.kind).toBe('warning');
  });

  it('enemy actor → info', () => {
    const draft = makeDraft({ blue: ['Target'], red: ['Actor'] });
    const [result] = analyzeInteractions(draft, [entry]);
    expect(result.kind).toBe('info');
  });
});

describe('synergy-family types', () => {
  it.each(['synergy', 'amplifies', 'enables'])(
    '%s split across teams → inactive',
    (type) => {
      const entry = makeEntry({ interaction_type: type });
      const draft = makeDraft({ blue: ['Actor'], red: ['Target'] });
      expect(analyzeInteractions(draft, [entry])).toEqual([]);
    },
  );

  it('synergy on my team → advantage, on enemy team → warning', () => {
    const entry = makeEntry({ interaction_type: 'synergy' });

    const mine = makeDraft({ blue: ['Actor', 'Target'] });
    expect(analyzeInteractions(mine, [entry])[0].kind).toBe('advantage');

    const theirs = makeDraft({ red: ['Actor', 'Target'] });
    expect(analyzeInteractions(theirs, [entry])[0].kind).toBe('warning');
  });
});

describe('activation', () => {
  it('entry with an unpicked champion is inactive', () => {
    const entry = makeEntry();
    const draft = makeDraft({ blue: ['Actor'] }); // Target never picked
    expect(analyzeInteractions(draft, [entry])).toEqual([]);
  });
});

describe('sorting', () => {
  it('sorts by severity rank descending', () => {
    const low = makeEntry({ id: 'low', severity: 'low' });
    const critical = makeEntry({ id: 'critical', severity: 'critical' });
    const draft = makeDraft({ blue: ['Actor'], red: ['Target'] });
    const results = analyzeInteractions(draft, [low, critical]);
    expect(results.map((r) => r.entry.id)).toEqual(['critical', 'low']);
  });

  it('boosts involvesMe above same-severity peers', () => {
    const other = makeEntry({
      id: 'other',
      champions: ['A', 'B'],
      severity: 'high',
    });
    const mine = makeEntry({
      id: 'mine',
      champions: ['Me', 'B'],
      severity: 'high',
    });
    const draft = makeDraft({
      blue: ['Me', 'A'],
      red: ['B'],
      mySlot: { team: 'blue', index: 0 },
    });
    const results = analyzeInteractions(draft, [other, mine]);
    expect(results.map((r) => r.entry.id)).toEqual(['mine', 'other']);
    expect(results[0].involvesMe).toBe(true);
    expect(results[1].involvesMe).toBe(false);
  });

  it('is stable for equal severity and involvesMe', () => {
    const first = makeEntry({ id: 'first', severity: 'medium' });
    const second = makeEntry({
      id: 'second',
      champions: ['Actor', 'Target'],
      severity: 'medium',
    });
    const draft = makeDraft({ blue: ['Actor'], red: ['Target'] });
    const results = analyzeInteractions(draft, [first, second]);
    expect(results.map((r) => r.entry.id)).toEqual(['first', 'second']);
  });
});
