import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const ICONS = { success: '✅', error: '❌', info: 'ℹ️', goal: '⚽', live: '🔴' };
const COLORS = {
  success: { bg: '#14532d', border: '#166534', color: '#4ade80' },
  error:   { bg: '#7f1d1d', border: '#991b1b', color: '#f87171' },
  info:    { bg: '#1e1b4b', border: '#312e81', color: '#a5b4fc' },
  goal:    { bg: '#78350f', border: '#92400e', color: '#fbbf24' },
  live:    { bg: '#7f1d1d', border: '#dc2626', color: '#fca5a5' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 'calc(60px + env(safe-area-inset-bottom))',
        right: '1rem', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        maxWidth: 'calc(100vw - 2rem)'
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} onClick={() => dismiss(t.id)} style={{
              background: c.bg, border: `1px solid ${c.border}`, color: c.color,
              borderRadius: '10px', padding: '0.6rem 1rem',
              fontSize: '0.85rem', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              animation: 'sn-slidein 0.2s ease-out',
              maxWidth: '320px'
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ICONS[t.type] || 'ℹ️'}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <span style={{ opacity: 0.5, fontSize: '0.7rem', flexShrink: 0 }}>✕</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes sn-slidein {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
