export function generarPDF({ titulo, subtitulo = '', columnas = [], filas = [], pie = '' }) {
  const w = window.open('', '_blank');
  if (!w) return alert('Permite ventanas emergentes para generar el PDF');

  const encabezado = columnas.map(c => `<th>${c}</th>`).join('');
  const cuerpo = filas.map(f => `<tr>${f.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('');

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>${titulo}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; margin: 32px; color: #0f172a; }
      .header { display: flex; justify-content: space-between; align-items: center;
                border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
      .brand { color: #047857; font-weight: 800; font-size: 22px; }
      .brand small { display:block; font-weight:400; font-size: 11px; color:#64748b; }
      h1 { font-size: 18px; color: #065f46; margin: 0; }
      .sub { color: #64748b; font-size: 12px; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
      th { background: #ecfdf5; color: #065f46; text-align: left; padding: 8px 10px; border-bottom: 2px solid #10b981; }
      td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) td { background: #f8fafc; }
      .pie { margin-top: 24px; font-size: 11px; color: #64748b; text-align: right; }
      @media print {
        body { margin: 16px; }
        .no-print { display: none; }
      }
      .no-print { text-align:center; margin-top: 24px; }
      .no-print button {
        background: #059669; color: #fff; border: 0; padding: 10px 22px;
        border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 13px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="brand">Presta+<small>Sistema de control de préstamos</small></div>
      <div style="text-align:right">
        <h1>${titulo}</h1>
        <div class="sub">${subtitulo}</div>
      </div>
    </div>

    <table>
      <thead><tr>${encabezado}</tr></thead>
      <tbody>${cuerpo || `<tr><td colspan="${columnas.length}" style="text-align:center;color:#94a3b8;padding:20px">Sin datos</td></tr>`}</tbody>
    </table>

    <div class="pie">${pie} · Generado: ${new Date().toLocaleString('es-BO')}</div>

    <div class="no-print">
      <button onclick="window.print()">🖨 Imprimir / Guardar como PDF</button>
    </div>

    <script>window.onload = () => setTimeout(() => window.print(), 400);</script>
  </body>
  </html>`;

  w.document.write(html);
  w.document.close();
}