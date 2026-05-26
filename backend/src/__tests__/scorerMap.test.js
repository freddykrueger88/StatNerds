'use strict';

// buildScorerMap isoliert testen
function buildScorerMap(matches) {
  const scorerMap = {};
  matches.forEach(match => {
    (match.goals || []).forEach(goal => {
      if (!goal.goalGetterName?.trim()) return;
      const name = goal.goalGetterName;
      const team = match.team1?.shortName || match.team1?.teamName;
      if (!scorerMap[name]) scorerMap[name] = { name, team, goals: 0, penalties: 0, ownGoals: 0 };
      if (goal.isOwnGoal) scorerMap[name].ownGoals++;
      else { scorerMap[name].goals++; if (goal.isPenalty) scorerMap[name].penalties++; }
    });
  });
  return scorerMap;
}

const MATCH = {
  team1: { shortName: 'Bayern', teamIconUrl: null },
  team2: { shortName: 'BVB' },
  matchIsFinished: true,
  goals: [
    { goalGetterName: 'Kane',   isOwnGoal: false, isPenalty: false },
    { goalGetterName: 'Kane',   isOwnGoal: false, isPenalty: true  },
    { goalGetterName: 'Müller', isOwnGoal: false, isPenalty: false },
    { goalGetterName: 'Hummels',isOwnGoal: true,  isPenalty: false },
    { goalGetterName: '',       isOwnGoal: false, isPenalty: false }, // leer – ignorieren
  ],
};

describe('buildScorerMap()', () => {
  let map;
  beforeEach(() => { map = buildScorerMap([MATCH]); });

  test('Leerer Name wird ignoriert', () => {
    expect(Object.keys(map)).not.toContain('');
  });

  test('Kane: 2 Tore, 1 Elfmeter', () => {
    expect(map['Kane'].goals).toBe(2);
    expect(map['Kane'].penalties).toBe(1);
    expect(map['Kane'].ownGoals).toBe(0);
  });

  test('Müller: 1 Tor, kein Elfmeter', () => {
    expect(map['Müller'].goals).toBe(1);
    expect(map['Müller'].penalties).toBe(0);
  });

  test('Eigentor wird als ownGoal gezählt, nicht als goal', () => {
    expect(map['Hummels'].ownGoals).toBe(1);
    expect(map['Hummels'].goals).toBe(0);
  });

  test('Eigentor-Schütze ist team1 zugeordnet (hat ins eigene Tor geschossen)', () => {
    expect(map['Hummels'].team).toBe('Bayern');
  });

  test('Team-Zuordnung korrekt für normale Tore', () => {
    expect(map['Kane'].team).toBe('Bayern');
  });

  test('Mehrere Spiele werden akkumuliert', () => {
    const map2 = buildScorerMap([MATCH, MATCH]);
    expect(map2['Kane'].goals).toBe(4);
  });

  test('Leere goals-Array – kein Fehler', () => {
    expect(() => buildScorerMap([{ ...MATCH, goals: [] }])).not.toThrow();
  });

  test('Kein goals-Feld – kein Fehler', () => {
    expect(() => buildScorerMap([{ team1: { shortName: 'X' } }])).not.toThrow();
  });
});
