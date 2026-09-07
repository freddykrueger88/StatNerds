import React from 'react';
import { useTranslation } from 'react-i18next';
import useNotifications from '../hooks/useNotifications';
import useWeeklySummary from '../hooks/useWeeklySummary';
import { useNotifyConfig } from '../hooks/useNotifyConfig';
import { useToast } from './Toast';
import { leagueSource } from '../leagues';

export default function NotificationToggle({ theme, league }) {
  const { t } = useTranslation();
  const [notifyConfig] = useNotifyConfig();
  const { permission, watching, toggle, sendNotification } = useNotifications(league, notifyConfig);
  const toast = useToast();

  useWeeklySummary(notifyConfig, sendNotification);

  const handleToggle = async () => {
    if (permission === 'denied') {
      toast(t('notify.blocked'), 'error', 5000);
      return;
    }
    if (!watching && !(notifyConfig?.types?.length)) {
      toast(t('notify.chooseType'), 'info', 5000);
      return;
    }
    const result = await toggle();
    if (result) toast(t('notify.enabled'), 'success');
    else toast(t('notify.disabled'), 'info');
  };

  if (typeof Notification === 'undefined' || leagueSource(league) !== 'openligadb') return null;

  return (
    <button onClick={handleToggle} title={watching ? t('notify.disableTitle') : t('notify.enableTitle')} style={{
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
