// Code.gs (Google Apps Script)
const SHEET_NAME = 'Consultorios';

function doGet() {
  const sheet   = SpreadsheetApp
                    .getActiveSpreadsheet()
                    .getSheetByName(SHEET_NAME);
  const rows    = sheet.getDataRange().getValues();
  const headers = rows.shift();  // primera fila como cabeceras

  const result = rows.map(r => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = r[i]);
    return obj;
  });

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload   = JSON.parse(e.postData.contents);
    const consult   = parseInt(payload.Consultorio, 10);
    const tipo      = payload.Tipo;         // 'Ocupado', 'Reservado' o 'Liberar'
    const persona   = payload.OcupadoPor || '';
    const horario   = payload.Horario   || '';
    const fecha     = new Date();

    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheet     = ss.getSheetByName(SHEET_NAME);
    const allValues = sheet.getDataRange().getValues();
    const headers   = allValues[0];
    const lastRow   = sheet.getLastRow();
    const fila      = consult + 1;          // +1 para contar cabecera

    if (fila < 2 || fila > lastRow) {
      throw new Error('Consultorio no válido');
    }

    // Encuentra las columnas por nombre
    const col = name =>
      headers.indexOf(name) + 1;

    const colPor       = col('OcupadoPor');
    const colAct       = col('ÚltimaActualización');
    const colOcupHoras = col('OcupadoHorarios');
    const colResHoras  = col('ReservadoHorarios');

    if (tipo === 'Liberar') {
      sheet.getRange(fila, colPor).clearContent();
      sheet.getRange(fila, colAct).setValue(fecha);
      sheet.getRange(fila, colOcupHoras).clearContent();
      sheet.getRange(fila, colResHoras).clearContent();
    } else {
      const columnaHoras = (tipo === 'Ocupado')
        ? colOcupHoras
        : colResHoras;
      const celda        = sheet.getRange(fila, columnaHoras);
      const anterior     = celda.getValue();
      const nuevoValor   = anterior
        ? anterior + '\n' + horario
        : horario;
      celda.setValue(nuevoValor);

      sheet.getRange(fila, colPor).setValue(persona);
      sheet.getRange(fila, colAct).setValue(fecha);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error:   err.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
