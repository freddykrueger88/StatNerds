import React, { useEffect, useState } from 'react';
import StatsBar from '../components/StatsBar';
import PredictionBlock from '../components/PredictionBlock';
import BroadcastBadge from '../components/BroadcastBadge';
import RefereeBlock from '../components/RefereeBlock';

function Timeline({ events }) {
  if (!events?.length) return null;
  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{ color: '#555', fontSize: '0.8rem', marginBottom: '0.5rem' }}>SPIELVERLAUF</h4>
      {events.map((e, i) => {
        const isHome = i % 2 === 0;
        const icon = e.type === 'Goal' ? (e.detail === 'Penalty' ? '🔵' : '⚽') :
                     e.type === 'Card' ? (e.detail === 'Yellow Card' ? '🟨' : '🟥') :
                     e.type === 'subst' ? '🔄' : 'ℹ️';
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            justifyContent: isHome ? 'flex-start' : 'flex-end',
            marginBottom: '0.3rem', fontSize: '0.78rem'
          }}>
            {isHome && <span style={{ color: '#555', minWidth: '30px' }}>{e.time?.elapsed}'</span>}
            {isHome && <span>{icon}</span>}
            {isHome && <span style={{ color: '#ddd' }}>{e.player?.name}</span>}
            {!isHome && <span style={{ color: '#ddd' }}>{e.player?.name}</span>}
            {!isHome && <span>{icon}</span>}
            {!isHome && <span style={{ color: '#555', minWidth: '30px', textAlign: 'right' }}>{e.time?.elapsed}'</span>}
          </div>
        );
      })}
    </div>
  );
}

function H2HSection({ team1, team2, theme }) {
  const [h2h, setH2h] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!team1 || !team2) return;
    fetch(`/api/games/bl1/h2h?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`)
      .then(r => r.json()).then(d => { setH2h(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [team1, team2]);
  if (loading) return <p style={{ color: '#555', fontSize: '0.8rem' }}>⏳ Lade H2H...</p>;
  if (!h2h.length) return <p style={{ color: '#444', fontSize: '0.8rem' }}>Keine H2H-Daten.</p>;
  return (
    <div>
      <h4 style={{ color: '#555', fontSize: '0.8rem', marginBottom: '0.5rem' }}>DIREKTE DUELLE</h4>
      {h2h.map((m, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', borderRadius: '6px', background: i % 2 === 0 ? '#111' : 'transparent', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
          <span style={{ color: '#666', minWidth: '80px' }}>{new Date(m.date).toLocaleDateString('de-DE')}</span>
          <span style={{ flex: 1, textAlign: 'right', color: '#aaa' }}>{m.home}</span>
          <span style={{ margin: '0 0.8rem', color: '#facc15', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>{m.score || '-'}</span>
          <span style={{ flex: 1, color: '#aaa' }}>{m.away}</span>
        </div>
      ))}
    </div>
  );
}

export default function GameDetail({ game, theme, onBack }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const apiKey = localStorage.getItem('sn_key_api_football');

  const t1 = game.team1?.shortName || game.team1?.teamName;
  const t2 = game.team2?.shortName || game.team2?.teamName;
  const results = game.matchResults || [];
  const final = results.find(r => r.resultTypeID === 2) || results[0];
  const half  = results.find(r => r.resultTypeID === 1);

  useEffect(() => {
    if (!apiKey || !game.externalFixtureId) return;
    setLoadingStats(true);
    fetch(`/api/apifootball/stats/${game.externalFixtureId}`, { headers: { 'x-api-key': apiKey } })
      .then(r => r.json()).then(d => { setStats(d); setLoadingStats(false); })
      .catch(() => setLoadingStats(false));
  }, [game.externalFixtureId, apiKey]);

  const block = { background: '#1a1a1a', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' };

  return (
    <div>
      <button onClick={onBack} style={{ background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`, borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.85rem' }}>← Zurück</button>

      {/* Hero Score */}
      <div style={{ ...block, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ color: '#555', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
          {game.group?.groupName} · {new Date(game.matchDateTime).toLocaleString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            {game.team1?.teamIconUrl && <img src={game.team1.teamIconUrl} alt='' style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '0.5rem' }} />}
            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{t1}</div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#facc15', lineHeight: 1 }}>
              {final ? `${final.pointsTeam1} : ${final.pointsTeam2}` : 'vs'}
            </div>
            {half && <div style={{ fontSize: '0.75rem', color: '#444', textAlign: 'center', marginTop: '0.3rem' }}>HZ {half.pointsTeam1}:{half.pointsTeam2}</div>}
          </div>
          <div style={{ textAlign: 'center' }}>
            {game.team2?.teamIconUrl && <img src={game.team2.teamIconUrl} alt='' style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '0.5rem' }} />}
            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{t2}</div>
          </div>
        </div>
        {game.goals?.length > 0 && (
          <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#666', lineHeight: '1.8' }}>
            {game.goals.map((g, i) => (
              <span key={i} style={{ marginRight: '1rem' }}>⚽ {g.goalGetterName} {g.matchMinute}'{g.isPenalty ? ' [P]' : ''}{g.isOwnGoal ? ' [ET]' : ''}</span>
            ))}
          </div>
        )}

        {/* TV + SR direkt im Hero */}
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <BroadcastBadge matchDate={game.matchDateTime} />
          <RefereeBlock refereeName={game.referee} fixtureId={game.externalFixtureId} theme={theme} />
        </div>
      </div>

      {/* Prediction */}
      <div style={block}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#aaa' }}>🔮 Prognose</h4>
        <PredictionBlock team1={t1} team2={t2} fixtureId={game.externalFixtureId} theme={theme} />
      </div>

      {/* Live-Stats */}
      {(stats || loadingStats) && (
        <div style={block}>
          <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', color: '#aaa' }}>📊 Spielstatistiken</h4>
          {loadingStats
            ? <p style={{ color: '#555', fontSize: '0.8rem' }}>⏳ Lade Stats...</p>
            : stats && (
              <div>
                <StatsBar label='Ballbesitz'      home={stats.home?.possession}     away={stats.away?.possession}     homeColor={theme.primary} />
                <StatsBar label='xG'              home={stats.home?.xG}             away={stats.away?.xG}             homeColor={theme.primary} />
                <StatsBar label='Schüsse'         home={stats.home?.shots}           away={stats.away?.shots}           homeColor={theme.primary} />
                <StatsBar label='Auf Tor'         home={stats.home?.shotsOnTarget}   away={stats.away?.shotsOnTarget}   homeColor={theme.primary} />
                <StatsBar label='Ecken'           home={stats.home?.corners}         away={stats.away?.corners}         homeColor={theme.primary} />
                <StatsBar label='Fouls'           home={stats.home?.fouls}           away={stats.away?.fouls}           homeColor={theme.primary} />
                <StatsBar label='🟨 Gelb'         home={stats.home?.yellowCards}     away={stats.away?.yellowCards}     homeColor='#facc15' />
                <StatsBar label='🟥 Rot'          home={stats.home?.redCards}        away={stats.away?.redCards}        homeColor='#f87171' />
                <StatsBar label='Pässe'           home={stats.home?.passes}           away={stats.away?.passes}           homeColor={theme.primary} />
                <StatsBar label='Passgenauigkeit' home={stats.home?.passAccuracy}    away={stats.away?.passAccuracy}    homeColor={theme.primary} />
                {stats.events?.length > 0 && <Timeline events={stats.events} />}
              </div>
            )}
        </div>
      )}

      {/* H2H */}
      <div style={block}>
        <H2HSection team1={t1} team2={t2} theme={theme} />
      </div>
    </div>
  );
}
