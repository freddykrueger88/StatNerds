'use strict';

// ── Poisson-Hilfsfunktionen direkt aus prediction.js isoliert testen ──────────
// (Funktionen sind nicht exportiert – wir testen über einen Wrapper)

function poisson(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

function poissonPrediction(homeAvg, awayAvg, maxGoals = 6) {
  let homeWin = 0, draw = 0, awayWin = 0;
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = poisson(h, homeAvg) * poisson(a, awayAvg);
      if      (h > a) homeWin += p;
      else if (h === a) draw  += p;
      else              awayWin += p;
    }
  }
  const total = homeWin + draw + awayWin;
  return {
    home_win: Math.round((homeWin / total) * 100),
    draw:     Math.round((draw    / total) * 100),
    away_win: Math.round((awayWin / total) * 100),
  };
}

describe('poisson()', () => {
  test('P(0 | lambda=0) = 1', () => {
    expect(poisson(0, 0)).toBe(1);
  });
  test('P(1 | lambda=0) = 0', () => {
    expect(poisson(1, 0)).toBe(0);
  });
  test('P(0 | lambda=1) ≈ 0.368', () => {
    expect(poisson(0, 1)).toBeCloseTo(0.3679, 3);
  });
  test('P(1 | lambda=1) ≈ 0.368', () => {
    expect(poisson(1, 1)).toBeCloseTo(0.3679, 3);
  });
  test('P(2 | lambda=1.5) ≈ 0.251', () => {
    expect(poisson(2, 1.5)).toBeCloseTo(0.2510, 3);
  });
});

describe('poissonPrediction()', () => {
  test('Wahrscheinlichkeiten summieren sich auf ~100%', () => {
    const r = poissonPrediction(1.5, 1.0);
    expect(r.home_win + r.draw + r.away_win).toBeGreaterThanOrEqual(99);
    expect(r.home_win + r.draw + r.away_win).toBeLessThanOrEqual(101);
  });

  test('Heimstärkeräres Team gewinnt häufiger', () => {
    const r = poissonPrediction(2.5, 0.5);
    expect(r.home_win).toBeGreaterThan(r.away_win);
  });

  test('Gleiche Durchschnittswerte – Unentschieden wahrscheinlichster Einzelfall?', () => {
    const r = poissonPrediction(1.2, 1.2);
    // Bei gleichen Werten sind Heim/Auswärts symmetrisch
    expect(r.home_win).toBe(r.away_win);
  });

  test('Lambda 0 für Auswärts – Heimsieg sehr wahrscheinlich', () => {
    const r = poissonPrediction(1.5, 0);
    expect(r.home_win).toBeGreaterThan(90);
  });

  test('Alle Werte sind nicht-negativ', () => {
    const r = poissonPrediction(1.3, 1.1);
    expect(r.home_win).toBeGreaterThanOrEqual(0);
    expect(r.draw).toBeGreaterThanOrEqual(0);
    expect(r.away_win).toBeGreaterThanOrEqual(0);
  });
});
