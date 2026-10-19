const fs = require('fs');
const path = require('path');

const API_URL = 'https://script.google.com/macros/s/AKfycbxKdeDaT28ilE-MQzkJEJAtxYLFUaGz7QGTpShutietIiCHU7jeH7eRHPmSuJzBPypr/exec';

function parseCsv(content) {
  const lines = content.replace(/^\ufeff/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser supporting quotes
    const values = [];
    let cur = '';
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' && (c === 0 || line[c - 1] !== '\\')) {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(cur.replace(/^"|"$/g, '').replace(/""/g, '"'));
        cur = '';
      } else {
        cur += char;
      }
    }
    values.push(cur.replace(/^"|"$/g, '').replace(/""/g, '"'));

    const obj = {};
    headers.forEach((h, idx) => {
      let val = values[idx] !== undefined ? values[idx] : '';
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      if (/^-?\d+(\.\d+)?$/.test(val) && !h.includes('dni') && !h.includes('telefono') && !h.includes('cuit')) {
        val = Number(val);
      }
      obj[h] = val;
    });
    rows.push(obj);
  }
  return rows;
}

async function uploadToSheet(sheetName, rows, batchSize = 40) {
  console.log(`\n📤 Subiendo a hoja "${sheetName}" (${rows.length} registros)...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ sheet: sheetName, action: 'insert', data: chunk })
      });
      const json = await res.json();
      console.log(`  ✓ Lote ${Math.floor(i / batchSize) + 1} (${chunk.length} filas):`, json.message || json);
    } catch (err) {
      console.error(`  ❌ Error en lote ${Math.floor(i / batchSize) + 1}:`, err.message);
    }
    // Pausa breve para no saturar rate-limits de Google Apps Script
    await new Promise(r => setTimeout(r, 600));
  }
}

async function main() {
  const dir = path.join(__dirname, '..', 'csv_sheets');

  // Mapeo entre archivo CSV y nombre de hoja en el Google Sheet
  const tasks = [
    { file: '2_categorias.csv', sheet: 'categorias' },
    { file: '1_productos_menu.csv', sheet: 'Productos_menu' },
    { file: '5_proveedores.csv', sheet: 'Proveedores' },
    { file: '7_clientes.csv', sheet: 'clientes' },
    { file: '4_recetas_escandallo.csv', sheet: 'recetas_escandallo' },
    { file: '3_insumos.csv', sheet: 'insumos' }
  ];

  for (const t of tasks) {
    const filePath = path.join(dir, t.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Archivo no encontrado: ${t.file}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = parseCsv(content);
    if (rows.length > 0) {
      await uploadToSheet(t.sheet, rows);
    }
  }

  console.log('\n🎉 ¡SINCRONIZACIÓN DE HOJAS COMPLETADA CON ÉXITO!');
}

main().catch(console.error);
