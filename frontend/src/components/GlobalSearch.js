import React, { useEffect, useRef, useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getTable, getScorers, getCurrentGames } from '../services/api';
import { LEAGUES } from '../leagues';

const FOOT = ['bl1', 'bl2', 'fbl1', 'bbl'];
const leagueName = id => LEAGUES.find(l => l.id === id)?.label || id;

/**
 * Globale Live-Suche in der Navbar (Issue #31): Ligen, Vereine, Spieler, Spiele.
 * Shortcuts: "/" oder Strg/Cmd+K fokussiert das Feld, Pfeiltasten navigieren,
 * Enter öffnet das aktive Ergebnis, Escape schließt. ARIA-compliant (listbox/option).
 */
export default function GlobalSearch({ theme, onNavigate }) {
  const [q, setQ] = useState('');
  const [debQ, setDebQ] = useState('');
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setDebQ(q.trim()), 150);
    return () => clearTimeout(id);
  }, [q]);

  const query = debQ;
  const active = query.length >= 2;

  const { data, loading } = useFetch(async () => {
    if (query.length < 2) return null;
    const ql = query.toLowerCase();
    const leagues = LEAGUES
      .filter(l => l.label.toLowerCase().includes(ql) || l.id.toLowerCase().includes(ql))
      .map(l => ({ type: 'league', id: l.id, label: l.label, sub: 'Liga', league: l.id }));

    const [tables, scorers, curGames] = await Promise.all([
      Promise.all(FOOT.map(l => getTable(l).catch(() => []))),
      Promise.all(FOOT.map(l => getScorers(l).catch(() => []))),
      Promise.all(FOOT.map(l => getCurrentGames(l).catch(() => []))),
    ]);

    const clubs = [], players = [], matches = [];
    tables.forEach((rows, i) => {
      (rows || []).slice(0, 20).forEach(r => {
        if ((r.teamName || '').toLowerCase().includes(ql)) {
          clubs.push({ type: 'club', id: r.teamInfoId, label: r.teamName || r.shortName, sub: leagueName(FOOT[i]), league: FOOT[i] });
        }
      });
    });
    scorers.forEach((arr, i) => {
      (arr || []).forEach(s => {
        if ((s.name || '').toLowerCase().includes(ql) && players.length < 20) {
          players.push({ type: 'player', id: s.name, label: s.name, sub: `${leagueName(FOOT[i])} · ${s.team || ''} · ${s.goals} Tore`, league: FOOT[i] });
        }
      });
    });
    curGames.forEach((arr, i) => {
      (arr || []).forEach(m => {
        const a = m.team1?.teamName || m.team1?.shortName;
        const b = m.team2?.teamName || m.team2?.shortName;
        if ((a || '').toLowerCase().includes(ql) || (b || '').toLowerCase().includes(ql)) {
          matches.push({ type: 'match', id: m.matchID, label: `${a || '?'} : ${b || '?'}`, sub: leagueName(FOOT[i]), league: FOOT[i] });
        }
      });
    });

    const groups = [
      { id: 'Ligen', items: leagues },
      { id: 'Vereine', items: clubs.slice(0, 12) },
      { id: 'Spieler', items: players.slice(0, 12) },
      { id: 'Spiele', items: matches.slice(0, 12) },
    ].filter(g => g.items.length > 0);
    const flat = [];
    groups.forEach(g => g.items.forEach(it => flat.push(it)));
    return { groups, flat };
  }, null, [query]);

  useEffect(() => { setIdx(0); }, [debQ]);

  useEffect(() => {
    const close = () => setOpen(false);
    const onKey = e => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
      if (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        if (typing && document.activeElement !== inputRef.current) return;
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
      } else if (open && data?.flat && data.flat.length) {
        const n = data.flat.length;
        if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => (i + 1) % n); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => (i - 1 + n) % n); }
        else if (e.key === 'Enter') { e.preventDefault(); const it = data.flat[idx]; if (it) go(it); }
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', close);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('blur', close); };
  });

  const go = item => {
    const view = item.type === 'league' ? 'games' : item.type === 'club' ? 'teamstats' : item.type === 'player' ? 'scorers' : 'games';
    onNavigate(view, item.league || item.id);
    setOpen(false);
    setQ('');
  };

  const results = active && open && data?.flat ? data : null;

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 1, minWidth: 0 }}>
      <input
        ref={inputRef}
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder='🔍 Suche… (/ oder ⌘K)'
        aria-label='Globale Suche – Vereine, Spieler, Ligen, Spiele'
        role='combobox' aria-expanded={!!results} aria-haspopup='listbox'
        aria-controls='gs-listbox' aria-activedescendant={results && data.flat[idx] ? `gs-opt-${idx}` : undefined}
        className='gs-input'
        style={{
          background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '8px',
          padding: '0.3rem 0.55rem', fontSize: '0.78rem', width: '190px', boxSizing: 'border-box',
          outline: 'none',
        }}
      />
      {(results || (active && open && loading)) && (
        <div
          id='gs-listbox' role='listbox' tabIndex={-1}
          style={{
            position: 'absolute', top: '2.4rem', right: 0, width: '340px', maxWidth: '90vw', maxHeight: '60vh',
            overflowY: 'auto', background: '#151515', border: '1px solid #333', borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)', zIndex: 300,
          }}
        >
          {loading && active && !data && <p style={{ margin: 0, padding: '0.8rem 1rem', color: '#666', fontSize: '0.78rem' }}>⏳ Suche…</p>}
          {data && data.flat.length === 0 && <p style={{ margin: 0, padding: '0.8rem 1rem', color: '#666', fontSize: '0.78rem' }}>Keine Treffer für „{query}“.</p>}
          {data && data.groups.map(g => (
            <div key={g.id}>
              <div style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.62rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #1f1f1f' }}>{g.id}</div>
              {g.items.map(it => {
                const i = data.flat.indexOf(it);
                const isSel = i === idx;
                return (
                  <button
                    key={`${it.type}-${it.id}`} id={`gs-opt-${i}`} role='option' aria-selected={isSel}
                    onMouseDown={e => { e.preventDefault(); go(it); }}
                    onMouseEnter={() => setIdx(i)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem',
                      width: '100%', padding: '0.5rem 1rem', background: isSel ? theme.primary + '22' : 'transparent',
                      border: 'none', borderBottom: '1px solid #1b1b1b', cursor: 'pointer', color: 'inherit', textAlign: 'left',
                    }}
                  >
                    <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      <span style={{ fontSize: '0.8rem' }}>{it.label}</span>
                      <span style={{ fontSize: '0.66rem', color: '#777', marginLeft: '0.4rem' }}>{it.sub}</span>
                    </span>
                    <span style={{ fontSize: '0.62rem', color: isSel ? theme.primary : '#555', flexShrink: 0 }}>
                      {it.type === 'league' ? 'L' : it.type === 'club' ? 'V' : it.type === 'player' ? 'S' : 'M'}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}