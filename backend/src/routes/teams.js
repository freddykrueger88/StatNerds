const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// 1. Bundesliga 2025/26
const BL1_TEAMS = [
  { id: '133613', name: 'FC Bayern München',        short: 'Bayern',     liga: 'bl1' },
  { id: '133614', name: 'Borussia Dortmund',          short: 'BVB',        liga: 'bl1' },
  { id: '133615', name: 'Bayer 04 Leverkusen',        short: 'Leverkusen', liga: 'bl1' },
  { id: '133616', name: 'RB Leipzig',                 short: 'Leipzig',    liga: 'bl1' },
  { id: '133617', name: 'Eintracht Frankfurt',        short: 'Frankfurt',  liga: 'bl1' },
  { id: '133618', name: 'VfL Wolfsburg',              short: 'Wolfsburg',  liga: 'bl1' },
  { id: '133619', name: 'Borussia Mönchengladbach',  short: 'Gladbach',   liga: 'bl1' },
  { id: '133620', name: 'TSG 1899 Hoffenheim',        short: 'Hoffenheim', liga: 'bl1' },
  { id: '133621', name: 'VfB Stuttgart',              short: 'Stuttgart',  liga: 'bl1' },
  { id: '133622', name: 'SC Freiburg',                short: 'Freiburg',   liga: 'bl1' },
  { id: '134',    name: 'Werder Bremen',              short: 'Bremen',     liga: 'bl1' },
  { id: '133624', name: 'FC Augsburg',                short: 'Augsburg',   liga: 'bl1' },
  { id: '133625', name: 'Union Berlin',               short: 'Union',      liga: 'bl1' },
  { id: '133627', name: 'FSV Mainz 05',               short: 'Mainz',      liga: 'bl1' },
  { id: '133628', name: '1. FC Heidenheim',           short: 'Heidenheim', liga: 'bl1' },
  { id: '133630', name: 'VfL Bochum',                 short: 'Bochum',     liga: 'bl1' },
  { id: '134349', name: 'Holstein Kiel',              short: 'Kiel',       liga: 'bl1' },
  { id: '134354', name: 'FC St. Pauli',               short: 'St. Pauli',  liga: 'bl1' },
];

// 2. Bundesliga 2025/26
const BL2_TEAMS = [
  { id: '133645', name: 'Hamburger SV',               short: 'HSV',        liga: 'bl2' },
  { id: '133646', name: 'Fortuna Düsseldorf',         short: 'Düsseldorf', liga: 'bl2' },
  { id: '133647', name: 'Hannover 96',                short: 'Hannover',   liga: 'bl2' },
  { id: '133648', name: 'Karlsruher SC',              short: 'KSC',        liga: 'bl2' },
  { id: '133649', name: 'Hertha BSC',                 short: 'Hertha',     liga: 'bl2' },
  { id: '133650', name: '1. FC Nürnberg',            short: 'Nürnberg',   liga: 'bl2' },
  { id: '133651', name: 'SpVgg Greuther Fürth',      short: 'Fürth',      liga: 'bl2' },
  { id: '133652', name: 'SC Paderborn 07',            short: 'Paderborn',  liga: 'bl2' },
  { id: '133653', name: 'Eintracht Braunschweig',     short: 'Braunschweig',liga: 'bl2' },
  { id: '133654', name: 'SSV Ulm 1846',               short: 'Ulm',        liga: 'bl2' },
  { id: '133655', name: 'FC Schalke 04',              short: 'Schalke',    liga: 'bl2' },
  { id: '133656', name: 'SV Elversberg',              short: 'Elversberg', liga: 'bl2' },
  { id: '133657', name: 'Darmstadt 98',               short: 'Darmstadt',  liga: 'bl2' },
  { id: '133658', name: '1. FC Köln',                short: 'Köln',       liga: 'bl2' },
  { id: '133659', name: '1. FC Magdeburg',            short: 'Magdeburg',  liga: 'bl2' },
  { id: '133660', name: 'Preussen Münster',          short: 'Münster',    liga: 'bl2' },
  { id: '133661', name: 'SV Wehen Wiesbaden',         short: 'Wiesbaden',  liga: 'bl2' },
  { id: '133662', name: 'Jahn Regensburg',            short: 'Regensburg', liga: 'bl2' },
];

const ALL_TEAMS = [...BL1_TEAMS, ...BL2_TEAMS];

// GET /api/teams  (alle Ligen)
router.get('/', (req, res) => {
  const liga = req.query.liga;
  if (liga === 'bl1') return res.json(BL1_TEAMS);
  if (liga === 'bl2') return res.json(BL2_TEAMS);
  res.json(ALL_TEAMS);
});

// GET /api/teams/search?q=...&liga=bl1
router.get('/search', (req, res) => {
  const q    = (req.query.q || '').toLowerCase();
  const liga = req.query.liga;
  let list   = liga === 'bl1' ? BL1_TEAMS : liga === 'bl2' ? BL2_TEAMS : ALL_TEAMS;
  if (q) list = list.filter(t => t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q));
  res.json(list);
});

// GET /api/teams/:sportsdbId
router.get('/:sportsdbId', async (req, res, next) => {
  const { sportsdbId } = req.params;
  const cacheKey = `team_${sportsdbId}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const r = await axios.get(
      `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${sportsdbId}`,
      { timeout: 8000 }
    );
    const t = r.data?.teams?.[0];
    if (!t) return res.status(404).json({ error: 'Team nicht gefunden' });
    const team = {
      id: sportsdbId, name: t.strTeam,
      shortName: t.strTeamShort || t.strTeam,
      logoUrl: t.strTeamBadge, fanartUrl: t.strTeamFanart1 || t.strTeamBanner,
      jerseyUrl: t.strTeamJersey, stadiumName: t.strStadium,
      stadiumThumb: t.strStadiumThumb, stadiumCapacity: t.intStadiumCapacity,
      stadiumLocation: t.strStadiumLocation, country: t.strCountry,
      founded: t.intFormedYear, league: t.strLeague,
      website: t.strWebsite, facebook: t.strFacebook, instagram: t.strInstagram,
      descriptionDE: t.strDescriptionDE, descriptionEN: t.strDescriptionEN,
    };
    cache.set(cacheKey, team, 24 * 60 * 60 * 1000);
    res.json(team);
  } catch (err) { next(err); }
});

module.exports = router;
