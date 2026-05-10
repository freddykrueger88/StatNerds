const express = require('express');
const cache = require('../cache');
const router = express.Router();

// Statische TV-Mapping Bundesliga 2025/26
// Basiert auf öffentlichen Lizenzinfos (Sky/DAZN/ARD/ZDF)
const TV_BY_COUNTRY = {
  DE: [
    { broadcaster: 'Sky Sport', type: 'pay', logo: '📺', note: 'Alle Spiele' },
    { broadcaster: 'DAZN', type: 'pay', logo: '🎥', note: 'Freitagsspiele + Konferenz' },
    { broadcaster: 'SAT.1', type: 'free', logo: '📺', note: 'Ausgesuchte Topspiele' },
    { broadcaster: 'ARD Sportschau', type: 'free', logo: '📺', note: 'Zusammenfassungen Sa 18:00' },
    { broadcaster: 'ZDF', type: 'free', logo: '📺', note: 'DFB Pokal + Highlights' },
  ],
  AT: [
    { broadcaster: 'Sky Österreich', type: 'pay', logo: '📺', note: 'Alle Spiele' },
    { broadcaster: 'DAZN', type: 'pay', logo: '🎥', note: 'Ausgewählte Spiele' },
  ],
  CH: [
    { broadcaster: 'Blue Sport', type: 'pay', logo: '📺', note: 'Alle Spiele' },
    { broadcaster: 'DAZN', type: 'pay', logo: '🎥', note: 'Ausgewählte Spiele' },
    { broadcaster: 'SRF', type: 'free', logo: '📺', note: 'Highlights Sportpanorama' },
  ],
};

// Spielzeit-basierte Zuordnung: Wer überträgt welchen Slot?
function getBroadcasterForSlot(matchDate, country = 'DE') {
  const d = new Date(matchDate);
  const day = d.getDay(); // 0=So, 1=Mo, 5=Fr, 6=Sa
  const hour = d.getHours();
  const base = TV_BY_COUNTRY[country] || TV_BY_COUNTRY.DE;

  if (country !== 'DE') return base;

  // Freitag
  if (day === 5) return [
    { broadcaster: 'DAZN', type: 'pay', logo: '🎥', note: 'Freitagsspiel Live' },
    { broadcaster: 'Sky Sport', type: 'pay', logo: '📺', note: 'Konferenz' },
  ];
  // Samstag 15:30
  if (day === 6 && hour >= 15 && hour < 17) return [
    { broadcaster: 'Sky Sport', type: 'pay', logo: '📺', note: 'Alle 15:30-Spiele Live' },
    { broadcaster: 'DAZN', type: 'pay', logo: '🎥', note: 'Konferenz' },
  ];
  // Samstag 18:30 Topspiel
  if (day === 6 && hour >= 18) return [
    { broadcaster: 'Sky Sport', type: 'pay', logo: '📺', note: 'Topspiel Sa 18:30' },
    { broadcaster: 'SAT.1', type: 'free', logo: '📺', note: 'Ausgewählte Topspiele' },
  ];
  // Sonntag 15:30
  if (day === 0 && hour >= 15 && hour < 17) return [
    { broadcaster: 'DAZN', type: 'pay', logo: '🎥', note: 'Sonntagsspiel Live' },
  ];
  // Sonntag 17:30
  if (day === 0 && hour >= 17) return [
    { broadcaster: 'DAZN', type: 'pay', logo: '🎥', note: 'Sonntagstopspiel 17:30' },
  ];
  // Montag
  if (day === 1) return [
    { broadcaster: 'DAZN', type: 'pay', logo: '🎥', note: 'Montagsspiel Live' },
  ];

  return base;
}

// GET /api/broadcast/:matchDate?country=DE
router.get('/:matchDate', (req, res) => {
  const { matchDate } = req.params;
  const country = (req.query.country || 'DE').toUpperCase();
  const cacheKey = `broadcast_${matchDate}_${country}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const result = {
    matchDate,
    country,
    broadcasters: getBroadcasterForSlot(matchDate, country),
    allOptions: TV_BY_COUNTRY[country] || TV_BY_COUNTRY.DE,
  };
  cache.set(cacheKey, result, 24 * 60 * 60 * 1000);
  res.json(result);
});

// GET /api/broadcast?country=DE (alle Sender für ein Land)
router.get('/', (req, res) => {
  const country = (req.query.country || 'DE').toUpperCase();
  res.json(TV_BY_COUNTRY[country] || TV_BY_COUNTRY.DE);
});

module.exports = { router, getBroadcasterForSlot };
