'use strict';

const BaseAdapter = require('../BaseAdapter');

const LEAGUE_ID = 2; // UEFA Champions League
const SEASON    = process.env.FOOTBALL_SEASON || 2025;

class ChampionsLeagueAdapter extends BaseAdapter {
  async getLive() {
    const r = await this.client.get(`/fixtures?live=all&league=${LEAGUE_ID}&season=${SEASON}`);
    return r.data;
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
}

module.exports = ChampionsLeagueAdapter;
