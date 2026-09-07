'use strict';

const BaseAdapter = require('../BaseAdapter');

const LEAGUE_ID = 78;  // Bundesliga
const BL2_ID    = 79;  // 2. Bundesliga
const SEASON    = process.env.FOOTBALL_SEASON || 2025;

class BundesligaAdapter extends BaseAdapter {
  async getLive() {
    const r = await this.client.get(`/fixtures?live=all&league=${LEAGUE_ID}&season=${SEASON}`);
    return r.data;
  }

  async getTeams(leagueId) {
    const r = await this.client.get('/teams', { params: { league: leagueId || LEAGUE_ID, season: SEASON } });
    return (r.data?.response || []).map(t => ({
      id: t.team.id, name: t.team.name, shortName: t.team.code,
      logo: t.team.logo, country: t.team.country, founded: t.team.founded,
      venue: t.venue?.name, venueCity: t.venue?.city, venueCapacity: t.venue?.capacity,
    }));
  }

  async getSquad(teamId) {
    const r = await this.client.get(`/players/squads?team=${teamId}`);
    return (r.data?.response || []).map(p => ({
      id: p.player.id, name: p.player.name, number: p.player.number,
      position: p.player.position, photo: p.player.photo, age: p.player.age,
    }));
  }

  async getPlayer(playerId) {
    const r = await this.client.get(`/players?id=${playerId}&season=${SEASON}`);
    const p = r.data?.response?.[0];
    if (!p) return null;
    const s = p.statistics?.[0] || {};
    return {
      id: playerId, name: p.player?.name, photo: p.player?.photo, age: p.player?.age,
      birthDate: p.player?.birth?.date, birthPlace: p.player?.birth?.place,
      nationality: p.player?.nationality, position: p.player?.position,
      height: p.player?.height, weight: p.player?.weight,
      team: s.team?.name, teamId: s.team?.id, number: s.games?.number ?? null,
      games: s.games?.appearences ?? null, minutes: s.games?.minutes ?? null,
      goals: s.goals?.total ?? null, assists: s.goals?.assists ?? null,
      yellowCards: s.cards?.yellow ?? null, redCards: s.cards?.red ?? null,
      rating: s.games?.rating ?? null,
    };
  }

  async searchPlayers(q, leagueId) {
    const r = await this.client.get('/players', { params: { search: q, league: leagueId || LEAGUE_ID, season: SEASON } });
    return (r.data?.response || []).map(({ player, statistics }) => ({
      id: player?.id, name: player?.name, photo: player?.photo,
      position: player?.position, age: player?.age,
      team: statistics?.[0]?.team || null,
    }));
  }

  async getSchedule(round) {
    const params = { league: LEAGUE_ID, season: SEASON };
    if (round) params.round = round;
    const r = await this.client.get('/fixtures', { params });
    return (r.data?.response || []).map(f => ({
      fixtureId: f.fixture.id,
      date:      f.fixture.date,
      referee:   f.fixture.referee,
      home:      f.teams.home.name,
      away:      f.teams.away.name,
      homeLogo:  f.teams.home.logo,
      awayLogo:  f.teams.away.logo,
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      status:    f.fixture.status.short,
      round:     f.league.round,
      venue:     f.fixture.venue?.name,
    }));
  }

  async getFixtureStats(fixtureId) {
    const [statsRes, eventsRes, lineupRes] = await Promise.all([
      this.client.get(`/fixtures/statistics?fixture=${fixtureId}`),
      this.client.get(`/fixtures/events?fixture=${fixtureId}`),
      this.client.get(`/fixtures/lineups?fixture=${fixtureId}`),
    ]);
    const stats = statsRes.data?.response || [];
    const parse = (t, n) => t?.statistics?.find(s => s.type === n)?.value ?? null;
    const side = i => ({
      name:          stats[i]?.team?.name,
      logo:          stats[i]?.team?.logo,
      xG:            parse(stats[i], 'expected_goals'),
      shots:         parse(stats[i], 'Total Shots'),
      shotsOnTarget: parse(stats[i], 'Shots on Goal'),
      possession:    parse(stats[i], 'Ball Possession'),
      corners:       parse(stats[i], 'Corner Kicks'),
      fouls:         parse(stats[i], 'Fouls'),
      yellowCards:   parse(stats[i], 'Yellow Cards'),
      redCards:      parse(stats[i], 'Red Cards'),
      passes:        parse(stats[i], 'Total passes'),
      passAccuracy:  parse(stats[i], 'Passes %'),
    });
    return {
      home:    side(0),
      away:    side(1),
      events:  eventsRes.data?.response || [],
      lineups: lineupRes.data?.response || [],
    };
  }

  async getFixture(fixtureId) {
    const r = await this.client.get(`/fixtures?id=${fixtureId}`);
    const f = r.data?.response?.[0];
    if (!f) throw Object.assign(new Error('Spiel nicht gefunden'), { status: 404 });
    return {
      referee:   f.fixture?.referee || null,
      venue:     { name: f.fixture?.venue?.name, city: f.fixture?.venue?.city },
      broadcast: f.fixture?.periods || [],
    };
  }

  // ── getHeatmap (Issue #22) ────────────────────────────────────────────────
  // Positions-Heatmap eines Spielers: echte Startelf-Koordinaten (grid) aus
  // den Aufstellungen der letzten beendeten Spiele seines Teams. API-Football
  // liefert pro Spieler pro Spiel eine Position im Raster (z.B. "3:7" →
  // Zeile:Spalte), die wir auf Spielfeld-Prozentkoordinaten mappen. Jeder
  // Auftritt erzeugt 1 Heatpoint; mehrere Spiele bilden die Dichte.
  // grid→Feld: Zeile 1 = Torwart (y≈8%), letzte Zeile = Sturm (y≈92%),
  // Spalten quadratisch über die Breite (y wird zusätzlich leicht zufällig
  // gestreut, um eine realistische "Heat"-Fläche statt Einzelpunkten zu zeigen).
  async getHeatmap(playerId, playername) {
    const pl = await this.getPlayer(playerId);
    if (!pl?.teamId) return { playerId, name: playername || pl?.name || null, team: pl?.team, points: [] };

    const sched   = await this.getSchedule().catch(() => []);
    const finished = (sched || []).filter(f => f.fixtureId && f.status === 'FT' && (f.homeScore != null || f.awayScore != null));
    const last    = finished.slice(-8);

    const points = [];
    for (const f of last) {
      const lr = await this.client.get(`/fixtures/lineups?fixture=${f.fixtureId}`).catch(() => null);
      const lineup = (lr?.data?.response || []).find(l => l.team?.id === pl.teamId);
      if (!lineup) continue;
      const both = [...(lineup.startXI || []), ...(lineup.substitutes || [])];
      const slot = both.find(s => String(s.player?.id) === String(playerId));
      if (!slot?.grid) continue;
      const [row, col] = String(slot.grid).split(':').map(Number);
      if (!row || !col) continue;
      const rows = lineup.formation ? lineup.formation.split('-').length + 1 : 6;
      const cols = Math.max(4, Number(lineup.formation?.split('-')[0]) || 4);
      const y = 8 + ((row - 1) / rows) * 84;
      const spread = (Math.sin((f.fixtureId * 1.7) + playerId) + 1) / 2; // deterministisch, kein Zufall pro Anfrage
      const x = (col - 1.5) * (88 / (cols - 1)) + 6 + (spread - 0.5) * 4;
      points.push({ x, y, minute: 90, fixtureId: f.fixtureId, status: f.status });
    }
    return { playerId, name: playername || pl?.name || null, team: pl?.team, teamId: pl.teamId, points };
  }
}

module.exports = BundesligaAdapter;
