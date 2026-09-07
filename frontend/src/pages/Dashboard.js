import React, { useMemo } from 'react';
import { useFetch }             from '../hooks/useFetch';
import { useFavorites }          from '../hooks/useFavorites';
import { useSportFavorites }     from '../hooks/useSportFavorites';
import {
  getTable, getTeamWindow, getScorers,
  getNbaStandings, getNbaTeams, getEspnCurrent,
  getTennisRankings,
} from '../services/api';
import { leagueLabel } from '../leagues';

const FOOT = ['bl1', 'bl2', 'fbl1'];

const fDateTime = iso => {
  try { return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso || ''; }
};

const emptyStyle = { textAlign: 'center', color: '#666', marginTop: '2rem', fontSize: '0.85rem' };

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '1.2rem' }}>
      <h3 style={{ color: '#999', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.6rem' }}>{title}</h3>
      {children}
    </section>
  );
}

function MatchLine({ w, teamName }) {
  if (!w) return null;
  const opp = w.isHome ? w.away : w.home;
  const icon = w.finished ? '📋' : '⏳';
  const arrow = w.isHome ? 'vs' : '@';
  return (
    <div style={{ fontSize: '0.78rem', background: '#1a1a1a', borderRadius: '10px', padding: '0.4rem 0.7rem', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{fDateTime(w.date)}</span>
      <span style={{ color: '#888' }}>{arrow} <strong style={{ color: '#ddd' }}>{opp}</strong></span>
      <span style={{ color: '#bbb' }}>{icon} {w.score ? `${w.score} (${teamName} ${w.isHome ? 'Heim' : 'Auswärts'})` : 'ausstehend'}</span>
    </div>
  );
}

export default function Dashboard({ theme, onNavigate }) {
  const { favorites } = useFavorites();
  const nbaFav      = useSportFavorites('sn_fav_nba');
  const tennisFav   = useSportFavorites('sn_fav_tennis');

  // ── Fußball: Tabellen für ID→Verein-Mapping + Position ──────────────────
  const tablesFetch = useFetch(async () => {
    const out = {};
    for (const l of FOOT) out[l] = Array.isArray(await getTable(l)) ? (await getTable(l)) : [];
    return out;
  }, null, []);

  const favInfo = useMemo(() => {
    const tables = tablesFetch.data || {};
    const map = {};
    favorites.forEach(id => {
      for (const l of FOOT) {
        const rows = tables[l] || [];
        const idx  = rows.findIndex(r => String(r.teamInfoId) === String(id));
        if (idx >= 0) {
          const r = rows[idx];
          map[id] = { league: l, name: r.teamName || r.shortName, position: idx + 1, total: rows.length, row: r };
          return;
        }
      }
    });
    return map;
  }, [tablesFetch.data, favorites]);

  const favKeys = Object.keys(favInfo);

  const windowsFetch = useFetch(async () => {
    if (!favKeys.length) return {};
    const out = {};
    for (const id of favKeys) {
      const { league, name } = favInfo[id];
      out[id] = await getTeamWindow(league, name).catch(() => ({ last: null, next: null }));
    }
    return out;
  }, null, [favKeys.join(',')]);

  const scorersFetch = useFetch(async () => {
    const out = {};
    for (const l of FOOT) out[l] = ((await getScorers(l)) || [])[0] || null;
    return out;
  }, null, []);

  // ── NBA ───────────────────────────────────────────────────────────────────
  const standingsFetch = useFetch(() => getNbaStandings(), 10 * 60_000, []);
  const nbaTeamsFetch   = useFetch(() => getNbaTeams(), 60 * 60_000, []);
  const nbaCurFetch     = useFetch(() => getEspnCurrent('nba'), 60_000, []);

  // ── Tennis ────────────────────────────────────────────────────────────────
  const atpRanks = useFetch(() => getTennisRankings('atp'), 30 * 60_000, []);
  const wtaRanks = useFetch(() => getTennisRankings('wta'), 30 * 60_000, []);

  const nbaById = {};
  (nbaTeamsFetch.data?.teams || []).forEach(t => { nbaById[t.id] = t; });

  const tennisFavRows = useMemo(() => {
    const rows = [];
    [['atp', atpRanks.data], ['wta', wtaRanks.data]].forEach(([lg, data]) => {
      (data?.ranks || []).forEach(r => {
        if (String(r.player.id) && tennisFav.isFavorite(r.player.id)) {
          rows.push({ league: lg, name: r.player.name, rank: r.rank, points: r.points, id: r.player.id, flag: r.player.flag });
        }
      });
    });
    return rows;
  }, [tennisFav.favorites, atpRanks.data, wtaRanks.data]);

  const nbaFavRows = useMemo(() => {
    const confs = standingsFetch.data?.conferences || [];
    const list = [];
    const teamsById = {};
    confs.forEach(c => c.teams.forEach(t => { teamsById[t.id] = { ...t, conference: c.name }; }));
    nbaFav.favorites.forEach(id => {
      const st = teamsById[id];
      const fr = nbaById[id];
      if (st || fr) list.push({ id, ...(st || {}), name: (st?.name || fr?.name), short: (st?.abbrev || fr?.short), logo: (st?.logo || fr?.logo) });
    });
    return list;
  }, [nbaFav.favorites, standingsFetch.data, nbaTeamsFetch.data]);

  const nbaGameFor = short => {
    const games = nbaCurFetch.data?.games || [];
    const mine = games.filter(g => (g.competitors || []).some(c => c.team?.toUpperCase() === (short || '').toUpperCase()));
    const next = mine.find(g => !g.completed && !g.live);
    const last = [...mine].reverse().find(g => g.completed);
    return { next, last, live: mine.find(g => g.live) };
  };

  const noFavorites = !favorites.length && !nbaFavRows.length && !tennisFavRows.length;

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', color: theme.primary, fontSize: '1.05rem' }}>🏠 Favoriten-Dashboard</h2>
      <p style={{ fontSize: '0.72rem', color: '#666', margin: '0 0 1rem' }}>
        Deine Vereine & Sportler auf einen Blick (★ in &bdquo;Spiele&ldquo;, &bdquo;Teams&ldquo; oder &bdquo;Rangliste&ldquo; setzen).
      </p>

      {noFavorites && tablesFetch.loading && <p style={emptyStyle}>⏳ Lade Favoriten...</p>}
      {noFavorites && !tablesFetch.loading && (
        <p style={emptyStyle}>
          Noch keine Favoriten gespeichert. Setze in &bdquo;Spiele&ldquo; oder &bdquo;Teams&ldquo; einen ★, um dir hier die nächsten
          Spiele, Tabellenpositionen & Ergebnisse anzeigen zu lassen.
        </p>
      )}

      {/* ── Fußball-Favoriten ─────────────────────────────────────────────── */}
      {favKeys.length > 0 && (
        <Section title={`⚽ Fußball-Favoriten (${favKeys.length})`}>
          {favKeys.map(id => {
            const info = favInfo[id];
            const win  = windowsFetch.data?.[id];
            const r    = info.row;
            return (
              <div key={id} style={{ background: '#161616', borderRadius: '14px', padding: '0.8rem', marginBottom: '0.6rem', borderLeft: `4px solid ${theme.primary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem' }}>{info.name}</strong>
                    <span style={{ color: '#666', fontSize: '0.72rem' }}> · {leagueLabel(info.league)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => onNavigate('table', info.league)} style={btnMini(theme)}>Tabelle</button>
                    <button onClick={() => onNavigate('games', info.league)} style={btnMini(theme)}>Spiele</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  <span>Platz <strong style={{ color: theme.primary }}>#{info.position}</strong></span>
                  <span>Punkte <strong>{r.points}</strong></span>
                  <span>S/U/N <strong>{r.won}/{r.draw}/{r.lost}</strong></span>
                  <span>Tore <strong>{r.goals}:{r.opponentGoals}</strong></span>
                </div>
                <MatchLine w={win?.next} teamName={info.name} />
                {win?.last && <MatchLine w={win.last} teamName={info.name} />}
                {!win?.next && !win?.last && <p style={{ fontSize: '0.7rem', color: '#555', margin: 0 }}>Keine Spiele in der Saison gefunden.</p>}
              </div>
            );
          })}
        </Section>
      )}

      {/* ── Highlights: Top-Torjäger je Liga ─────────────────────────────── */}
      {favKeys.length > 0 && (
        <Section title='🔥 Highlights'>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
            {FOOT.map(l => {
              const s = scorersFetch.data?.[l];
              if (!s) return null;
              return (
                <div key={l} style={{ background: '#1a1a1a', borderRadius: '10px', padding: '0.6rem 0.8rem', fontSize: '0.78rem' }}>
                  <span style={{ color: '#666' }}>Top-Torjäger {leagueLabel(l)}</span>
                  <div style={{ marginTop: '0.2rem' }}><strong>{s.name}</strong> <span style={{ color: theme.primary }}>({s.goals})</span></div>
                  <div style={{ fontSize: '0.68rem', color: '#777' }}>{s.team}</div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── NBA-Favoriten ─────────────────────────────────────────────────── */}
      {nbaFavRows.length > 0 && (
        <Section title={`🏀 NBA-Favoriten (${nbaFavRows.length})`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
            {nbaFavRows.map(t => {
              const g = nbaGameFor(t.short);
              return (
                <div key={t.id} style={{ background: '#161616', borderRadius: '14px', padding: '0.7rem 0.8rem', borderLeft: `4px solid ${t.logo ? '#555' : theme.primary}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    {t.logo ? <img src={t.logo} alt='' style={{ height: '26px', width: '26px' }} /> : <span>🏀</span>}
                    <strong style={{ fontSize: '0.85rem', flex: 1 }}>{t.name}</strong>
                    <button onClick={() => onNavigate('teams', 'nba')} style={btnMini(theme)} title='Vereinsübersicht'>Teams →</button>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#ccc', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bilanz</span><strong>{t.wins}-{t.losses}</strong>
                  </div>
                  {t.ppg ? (
                    <div style={{ fontSize: '0.78rem', color: '#ccc', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Punkte / Spiel</span><strong>{t.ppg} : {t.oppg}</strong>
                    </div>
                  ) : null}
                  {t.streak ? <div style={{ fontSize: '0.72rem', color: '#888' }}>Serie: {t.streak}</div> : null}
                  {g?.live ? <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.3rem' }}>● Live: {g.live.detail}</div>
                    : g?.next ? <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.3rem' }}>Nächstes: {fDateTime(g.next.date)} vs {g.next.competitors.find(c => c.team?.toUpperCase() !== t.short?.toUpperCase())?.name || '–'}</div>
                    : null}
                  {g?.last ? <div style={{ fontSize: '0.72rem', color: '#888' }}>Letztes: {g.last.competitors.map(c => `${c.team} ${c.score}`).join(' – ')}</div> : null}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Tennis-Favoriten ──────────────────────────────────────────────── */}
      {tennisFavRows.length > 0 && (
        <Section title={`🎾 Tennis-Favoriten (${tennisFavRows.length})`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
            {tennisFavRows.map(p => (
              <div key={p.id} style={{ background: '#161616', borderRadius: '14px', padding: '0.7rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: `4px solid ${theme.primary}` }}>
                {p.flag && <img src={p.flag} alt='' style={{ height: '14px', width: '20px' }} />}
                <span style={{ flex: 1 }}><strong style={{ fontSize: '0.85rem' }}>{p.name}</strong> <span style={{ color: '#777', fontSize: '0.7rem' }}>({p.league.toUpperCase()})</span></span>
                <span style={{ fontSize: '0.75rem', color: '#999' }}>#{p.rank}</span>
                <span style={{ fontSize: '0.75rem', color: theme.primary }}>{Math.round(p.points).toLocaleString('de-DE')} Pkt</span>
                <button onClick={() => onNavigate('teams', p.league)} style={btnMini(theme)} title='Spielerprofil öffnen'>→</button>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

const btnMini = theme => ({
  background: 'transparent', border: `1px solid ${theme.primary}66`, color: theme.primary,
  borderRadius: '8px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem',
});
