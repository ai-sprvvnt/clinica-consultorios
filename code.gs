const SHEET_NAME = 'Consultorios';

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  const headers = data.shift();
  const result = data.map(row => {
    const entry = {};
    headers.forEach((key, i) => entry[key] = row[i]);
    return entry;
  });
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Consultorios');
    const payload = JSON.parse(e.postData.contents);

    const timestamp = new Date();
    const consultorio = parseInt(payload.Consultorio);
    const fila = consultorio + 1;

    const lastRow = sheet.getLastRow();
    if (fila > lastRow) throw new Error('Consultorio no existe');

    sheet.getRange(fila, 2).setValue(payload.Estado);
    sheet.getRange(fila, 3).setValue(payload.OcupadoPor);
    sheet.getRange(fila, 4).setValue(timestamp);

    if (payload.Estado === 'Ocupado') {
      sheet.getRange(fila, 5).setValue(payload.Horario);  // OcupadoHorarios
      sheet.getRange(fila, 6).setValue('');               // Limpia ReservadoHorarios
    } else if (payload.Estado === 'Reservado') {
      sheet.getRange(fila, 5).setValue('');               // Limpia OcupadoHorarios
      sheet.getRange(fila, 6).setValue(payload.Horario);  // ReservadoHorarios
    } else if (payload.Estado === 'Libre') {
      sheet.getRange(fila, 5).setValue('');
      sheet.getRange(fila, 6).setValue('');
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


async function actualizarEstado(num, estado) {
  const persona = prompt(`¿Quién cambia el estado a ${estado}?`);
  if (!persona) return;

  let horario = prompt(`¿En qué horario se usará? (ej. 16:00 - 19:00)`);
  if (!horario) return;

  // Validar formato HH:mm - HH:mm
  const horarioRegex = /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d$/;
  if (!horarioRegex.test(horario.trim())) {
    alert('Formato inválido. Usa el formato HH:mm - HH:mm (ej. 14:00 - 17:30)');
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        Consultorio: num,
        Estado: estado,
        OcupadoPor: persona,
        Horario: horario.trim()
      })
    });

    const result = await response.json();

    if (!result.success) {
      alert('Error al actualizar: ' + (result.error || 'desconocido'));
    } else {
      alert('Estado actualizado correctamente');
      cargarConsultorios();
    }

  } catch (e) {
    alert('Error de red al actualizar el consultorio');
    console.error(e);
  }
}
