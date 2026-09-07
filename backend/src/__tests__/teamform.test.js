'use strict';

// buildTeamForm über den echten Export testen (kein Copy-Paste der Logik).
const { buildTeamForm } = require('../routes/games');

function match(team1, team2, gf, ga, finished = true, date = '2026-08-01T15:30:00Z', md = '1') {
  return {
    matchDateTime: date,
    group: { groupOrderID: md },
    team1: { teamName: team1, shortName: team1 },
    team2: { teamName: team2, shortName: team2 },
    matchIsFinished: finished,
    matchResults: finished
      ? [{ resultTypeID: 2, pointsTeam1: gf, pointsTeam2: ga }]
      : [],
  };
}

describe('buildTeamForm()', () => {
  test('Heim- und Auswärtssiege werden mit Punkten/Ergebnis bewertet', () => {
    const all = [
      match('Bayern', 'BVB',  2, 0, true, '2026-08-01T15:30:00Z'),
      match('BVB',    'Bayern', 1, 3, true, '2026-08-08T15:30:00Z'),
    ];
    const form = buildTeamForm('bl1', all, 'Bayern');
    expect(form).toHaveLength(2);
    expect(form[0]).toMatchObject({ opponent: 'BVB', result: 'S', goalsFor: 2, goalsAgainst: 0, points: 3, isHome: true });
    expect(form[1]).toMatchObject({ opponent: 'BVB', result: 'S', goalsFor: 3, goalsAgainst: 1, points: 3, isHome: false });
  });

  test('Unentschieden → 1 Punkt, Niederlage → 0 Punkte', () => {
    const all = [
      match('Bayern', 'BVB', 1, 1, true),
      match('BVB', 'Bayern', 2, 0, true),
    ];
    const form = buildTeamForm('bl1', all, 'Bayern');
    expect(form[0].result).toBe('U');
    expect(form[0].points).toBe(1);
    expect(form[1]).toMatchObject({ result: 'N', points: 0 });
  });

  test('BBL vergibt 1 Punkt pro Sieg (kein Unentschieden-Szenario im Test)', () => {
    const all = [match('ALBA', 'Bayern BB', 80, 95, true)];
    const form = buildTeamForm('bbl', all, 'ALBA');
    expect(form[0]).toMatchObject({ result: 'N', points: 0 });
  });

  test('Nicht beendete Spiele werden ignoriert', () => {
    const all = [match('Bayern', 'BVB', 2, 0, false)];
    expect(buildTeamForm('bl1', all, 'Bayern')).toHaveLength(0);
  });

  test('Aufsteigend chronologisch sortiert, max. 10 Spiele', () => {
    const all = Array.from({ length: 14 }, (_, i) =>
      match('A', 'B', 1, 0, true, `2026-08-${String(i + 1).padStart(2, '0')}T15:30:00Z`)
    ).map(m => ({ ...m, team1: { teamName: 'Team', shortName: 'Team' }, team2: { teamName: 'X', shortName: 'X' } }));
    const form = buildTeamForm('bl1', all, 'Team');
    const dates = form.map(f => f.date);
    expect(form).toHaveLength(10);
    expect([...dates].sort()).toEqual(dates);
  });

  test('Teamnamen-Teilmatch über shortName (wie teamwindow)', () => {
    const all = [match('FC Bayern München', 'BVB', 2, 0, true, '2026-08-01T15:30:00Z')];
    const form = buildTeamForm('bl1', all, 'Bayern');
    expect(form).toHaveLength(1);
  });
});
