import React from 'react';
import { useToast } from './Toast';
import { printPdf } from '../services/export';

export default function PdfButton({ title, columns, rows, theme, label = '🖨 PDF', disabled }) {
  const toast = useToast();

  const onClick = () => {
    if (rows.length === 0) return;
    const ok = printPdf(title, columns, rows);
    if (!ok) toast('Popup blockiert – bitte im Browser erlauben.', 'error');
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || rows.length === 0}
      title={rows.length === 0 ? 'Noch keine Daten' : 'Druckansicht öffnen (als PDF speichern)'}
      style={{
        background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`,
        borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: rows.length > 0 ? 'pointer' : 'not-allowed',
        fontSize: '0.8rem', opacity: rows.length === 0 ? 0.4 : 1, transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}
