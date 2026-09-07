// CSV-Export-Helfer (keine Dependencies) – mit BOM für korrekte Umlaute in Excel.
// Nutzung z.B.: exportCsv('tabelle.csv', [{ key: 'teamName', label: 'Verein' }], tableRows)

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Ausgabe mit Punkt als Dezimaltrenner, wie in Excel erwartet
  if (/^\d+\.\d+$/.test(s) || /^\d+$/.test(s)) return s;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(columns, rows) {
  const header = columns.map(c => `"${(c.label || c.key).replace(/"/g, '""')}"`).join(';');
  const body = rows.map(row =>
    columns.map(c => escapeCell(row[c.key])).join(';')
  );
  return '\uFEFF' + [header, ...body].join('\n'); // BOM → Excel erkennt UTF-8
}

export function downloadBlob(content, filename, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCsv(filename, columns, rows) {
  downloadBlob(buildCsv(columns, rows), filename);
}

// ── PDF via Browser-Druck (keine Dependency) ─────────────────────────────────
// Öffnet ein neues, sauber formatiertes Fenster mit der Tabelle und startet den
// Druckdialog – User kann als PDF speichern. Wird im Popup-Blocker-Zweig Fallback
// auf CSV genutzt; siehe PdfButton.

export function buildPrintHtml(title, columns, rows) {
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const head = columns.map(c => `<th>${esc(c.label)}</th>`).join('');
  const body = rows.map(r => `<tr>${columns.map(c => `<td>${esc(r[c.key])}</td>`).join('')}</tr>`).join('');
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #111; padding: 1.5rem 2rem; }
  h1 { font-size: 1.3rem; margin: 0 0 0.2rem; }
  p.meta { font-size: 0.8rem; color: #555; margin: 0 0 1.2rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
  th, td { border: 1px solid #bbb; padding: 0.4rem 0.6rem; text-align: left; }
  th { background: #f0f0f0; }
  td { color: #222; }
  tr:nth-child(even) td { background: #fafafa; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>${esc(title)}</h1>
<p class="meta">StatNerds – ${esc(new Date().toLocaleString('de-DE'))}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body></html>`;
}

export function printPdf(title, columns, rows) {
  const w = window.open('', '_blank');
  if (!w) return false; // Popup geblockt
  w.document.open();
  w.document.write(buildPrintHtml(title, columns, rows));
  w.document.close();
  return true;
}