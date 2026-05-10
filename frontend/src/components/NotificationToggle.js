import React from 'react';
import useNotifications from '../hooks/useNotifications';
import { useToast } from './Toast';

export default function NotificationToggle({ theme }) {
  const { permission, watching, toggle } = useNotifications();
  const toast = useToast();

  const handleToggle = async () => {
    if (permission === 'denied') {
      toast('Benachrichtigungen sind im Browser blockiert. Bitte in den Browser-Einstellungen freigeben.', 'error', 5000);
      return;
    }
    const result = await toggle();
    if (result) toast('🔔 Tor-Benachrichtigungen aktiviert!', 'success');
    else toast('🔕 Benachrichtigungen deaktiviert.', 'info');
  };

  if (typeof Notification === 'undefined') return null;

  return (
    <button onClick={handleToggle} title={watching ? 'Benachrichtigungen deaktivieren' : 'Bei Toren benachrichtigen'} style={{
      background: watching ? theme.primary + '22' : 'transparent',
      color: watching ? theme.primary : '#555',
      border: `1px solid ${watching ? theme.primary : '#333'}`,
      borderRadius: '8px', padding: '0.3rem 0.7rem',
      cursor: 'pointer', fontSize: '0.82rem',
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      transition: 'all 0.2s'
    }}>
      <span>{watching ? '🔔' : '🔕'}</span>
      <span style={{ display: 'none' }} className='notify-label'>{watching ? 'Live' : 'Notify'}</span>
      {permission === 'denied' && <span style={{ fontSize: '0.6rem', color: '#f87171' }}>blockiert</span>}
    </button>
  );
}
