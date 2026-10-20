/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT - API CONNECTOR PARA COLORES PIZZA
 * ==============================================================================
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. En tu Google Sheet con las 13 pestañas, andá al menú: Extensiones -> Apps Script.
 * 2. Borrá cualquier código existente y pegá todo este archivo.
 * 3. Hacé click en el botón "Implementar" (arriba a la derecha) -> "Nueva implementación".
 * 4. Tipo: "Aplicación web".
 * 5. Ejecutar como: "Yo" (tu cuenta de Google).
 * 6. Quién tiene acceso: "Cualquiera" (Anyone).
 * 7. Hacé click en "Implementar", autorizá los permisos y COPIÁ la "URL de la aplicación web"
 *    (ej: https://script.google.com/macros/s/.../exec).
 * 8. Pasame esa URL o pegala en el archivo .env como VITE_GOOGLE_SHEETS_API_URL="tu_url".
 * ==============================================================================
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = e.parameter.sheet;
    
    // Si no se especifica hoja, devolver lista de todas las hojas disponibles
    if (!sheetName) {
      const sheetNames = ss.getSheets().map(s => s.getName());
      return jsonResponse({ success: true, available_sheets: sheetNames });
    }

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({ success: false, error: "Hoja no encontrada: " + sheetName }, 404);
    }

    const data = getSheetData(sheet);
    return jsonResponse({ success: true, sheet: sheetName, count: data.length, data: data });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const body = JSON.parse(e.postData.contents);
    const sheetName = body.sheet;
    const action = body.action || 'insert'; // 'insert', 'update', 'upsert'
    
    if (!sheetName) {
      return jsonResponse({ success: false, error: "Falta parámetro 'sheet'" }, 400);
    }

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({ success: false, error: "Hoja no encontrada: " + sheetName }, 404);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const records = Array.isArray(body.data) ? body.data : [body.data];

    if (action === 'insert') {
      records.forEach(rowObj => {
        const rowData = headers.map(h => formatValue(rowObj[h]));
        sheet.appendRow(rowData);
      });
      return jsonResponse({ success: true, message: records.length + " filas agregadas" });
    }

    if (action === 'upsert') {
      const idKey = body.key || headers[0]; // Clave primaria (ej: id_producto, id_cierre)
      const existingData = sheet.getDataRange().getValues();
      const idColIdx = headers.indexOf(idKey);

      records.forEach(rowObj => {
        const valToMatch = String(rowObj[idKey] || '');
        let rowIndex = -1;

        for (let r = 1; r < existingData.length; r++) {
          if (String(existingData[r][idColIdx]) === valToMatch) {
            rowIndex = r + 1;
            break;
          }
        }

        const rowValues = headers.map(h => formatValue(rowObj[h]));

        if (rowIndex > 0) {
          sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
        } else {
          sheet.appendRow(rowValues);
        }
      });

      return jsonResponse({ success: true, message: "Upsert completado exitosamente" });
    }

    if (action === 'delete') {
      const idKey = body.key || headers[0];
      const valToDelete = String(body.id !== undefined ? body.id : (body.data && body.data[idKey]) || '');
      const existingData = sheet.getDataRange().getValues();
      const idColIdx = headers.indexOf(idKey);
      let deleted = 0;

      if (idColIdx >= 0 && valToDelete) {
        for (let r = existingData.length - 1; r >= 1; r--) {
          if (String(existingData[r][idColIdx]).trim() === valToDelete.trim()) {
            sheet.deleteRow(r + 1);
            deleted++;
          }
        }
      }

      return jsonResponse({ success: true, message: deleted + " filas eliminadas" });
    }

    return jsonResponse({ success: false, error: "Acción no reconocida" }, 400);

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

function getSheetData(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const results = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // Ignorar filas totalmente vacías
    if (row.every(cell => cell === '')) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      let val = row[j];
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[header] = val;
    }
    results.push(obj);
  }
  return results;
}

function formatValue(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

function jsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
