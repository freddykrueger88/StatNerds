import React from 'react';
import { exportCsv } from '../services/export';

export default function CsvButton({ filename, columns, rows, theme, label = '⬇ CSV', disabled }) {
  return (
    <button
      onClick={() => rows.length > 0 && exportCsv(filename, columns, rows)}
      disabled={disabled || rows.length === 0}
      title={rows.length === 0 ? 'Noch keine Daten zum Exportieren' : 'Tabelle als CSV herunterladen'}
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
