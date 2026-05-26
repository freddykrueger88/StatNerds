const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// Bundesliga 2025/26 – Stand nach Auf-/Abstieg Saison 2024/25
// Absteiger: SV Darmstadt 98, 1. FC Köln
// Aufsteiger: Holstein Kiel, FC St. Pauli
const BUNDESLIGA_TEAMS = [
  { id: '133613', name: 'FC Bayern München',         short: 'Bayern'       },
  { id: '133614', name: 'Borussia Dortmund',           short: 'BVB'          },
  { id: '133615', name: 'Bayer 04 Leverkusen',         short: 'Leverkusen'   },
  { id: '133616', name: 'RB Leipzig',                  short: 'Leipzig'      },
  { id: '133617', name: 'Eintracht Frankfurt',         short: 'Frankfurt'    },
  { id: '133618', name: 'VfL Wolfsburg',               short: 'Wolfsburg'    },
  { id: '133619', name: 'Borussia Mönchengladbach',   short: 'Gladbach'     },
  { id: '133620', name: 'TSG 1899 Hoffenheim',         short: 'Hoffenheim'   },
  { id: '133621', name: 'VfB Stuttgart',               short: 'Stuttgart'    },
  { id: '133622', name: 'SC Freiburg',                 short: 'Freiburg'     },
  { id: '134',    name: 'Werder Bremen',               short: 'Bremen'       },
  { id: '133624', name: 'FC Augsburg',                 short: 'Augsburg'     },
  { id: '133625', name: 'Union Berlin',                short: 'Union'        },
  { id: '133627', name: 'FSV Mainz 05',                short: 'Mainz'        },
  { id: '133628', name: '1. FC Heidenheim',            short: 'Heidenheim'   },
  { id: '133630', name: 'VfL Bochum',                  short: 'Bochum'       },
  { id: '134349', name: 'Holstein Kiel',               short: 'Kiel'         },
  { id: '134354', name: 'FC St. Pauli',                short: 'St. Pauli'    },
];

// GET /api/teams
router.get('/', (req, res) => res.json(BUNDESLIGA_TEAMS));

// GET /api/teams/search?q=...
router.get('/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json(BUNDESLIGA_TEAMS);
  res.json(BUNDESLIGA_TEAMS.filter(t =>
    t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q)
  ));
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
      id:              sportsdbId,
      name:            t.strTeam,
      shortName:       t.strTeamShort || t.strTeam,
      logoUrl:         t.strTeamBadge,
      fanartUrl:       t.strTeamFanart1 || t.strTeamBanner,
      jerseyUrl:       t.strTeamJersey,
      stadiumName:     t.strStadium,
      stadiumThumb:    t.strStadiumThumb,
      stadiumCapacity: t.intStadiumCapacity,
      stadiumLocation: t.strStadiumLocation,
      country:         t.strCountry,
      founded:         t.intFormedYear,
      league:          t.strLeague,
      website:         t.strWebsite,
      facebook:        t.strFacebook,
      instagram:       t.strInstagram,
      descriptionDE:   t.strDescriptionDE,
      descriptionEN:   t.strDescriptionEN,
    };
    cache.set(cacheKey, team, 24 * 60 * 60 * 1000);
    res.json(team);
  } catch (err) { next(err); }
});

module.exports = router;
