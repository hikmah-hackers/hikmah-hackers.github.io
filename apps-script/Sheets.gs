/**
 * The class Google Sheet: a Roster tab (students + codes) and a Submissions tab
 * (one row per submission, with a Feedback column you write in).
 */

var SUBMISSIONS_SHEET = 'Submissions';
var SUBMISSION_HEADERS = ['Submitted', 'Week', 'Student ID', 'First name', 'Last name', 'Grade', 'Late', 'Resubmission', 'File', 'Note', 'Feedback'];

function openClassBook(config) {
  if (!config.sheetId) throw new Error('No class sheet yet. Run setupCheck() once from the editor.');
  return SpreadsheetApp.openById(config.sheetId);
}

/** Creates the class sheet (first run only) and makes sure both tabs exist. */
function setupSheets(config) {
  var book = config.sheetId ? SpreadsheetApp.openById(config.sheetId) : createClassBook();
  ensureSheet(book, ROSTER_SHEET, ROSTER_HEADERS);
  ensureSheet(book, SUBMISSIONS_SHEET, SUBMISSION_HEADERS);
  return book;
}

function createClassBook() {
  var book = SpreadsheetApp.create('Hikmah Hackers: Class');
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', book.getId());
  return book;
}

/** Makes sure the tab exists with every header. Columns added in later versions go on the end. */
function ensureSheet(book, name, headers) {
  var sheet = book.getSheetByName(name) || book.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
  var missing = headers.filter(function (header) { return existing.indexOf(header) === -1; });
  if (missing.length) sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  return sheet;
}

/** Reads a tab into objects keyed by header, so columns can be reordered safely. */
function readTable(sheet) {
  var values = sheet.getDataRange().getValues();
  var headers = (values[0] || []).map(function (h) { return String(h).trim(); });
  var rows = values.slice(1).map(function (cells, i) {
    var row = { __row: i + 2 };
    headers.forEach(function (header, col) { row[header] = cells[col]; });
    return row;
  });
  return { headers: headers, rows: rows };
}

/** Prefix values that a spreadsheet would treat as formulas. */
function sheetSafe(value) {
  var text = String(value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function logSubmission(config, student, request, path, late, resubmission) {
  try {
    var sheet = ensureSheet(openClassBook(config), SUBMISSIONS_SHEET, SUBMISSION_HEADERS);
    var url = 'https://github.com/' + config.repo + '/blob/' + config.branch + '/' + path;
    var values = {
      'Submitted': new Date(),
      'Week': request.week,
      'Student ID': student.id,
      'First name': sheetSafe(student.firstName),
      'Last name': sheetSafe(student.lastName),
      'Grade': student.grade,
      'Late': late ? 'LATE' : '',
      'Resubmission': resubmission ? 'yes' : '',
      'File': url,
      'Note': sheetSafe(request.note),
      'Feedback': '',
    };
    var headers = readTable(sheet).headers;
    sheet.appendRow(headers.map(function (header) { return values.hasOwnProperty(header) ? values[header] : ''; }));
  } catch (err) {
    // The commit already succeeded; a logging failure shouldn't fail the student.
    console.error('Sheet log failed: ' + err.message);
  }
}

/** One summary per week for this student: latest submission, plus your latest feedback. */
function listSubmissions(config, studentId) {
  var sheet = ensureSheet(openClassBook(config), SUBMISSIONS_SHEET, SUBMISSION_HEADERS);
  var mine = readTable(sheet).rows.filter(function (row) { return row['Student ID'] === studentId; });
  var byWeek = mine.reduce(function (acc, row) {
    var week = Number(row['Week']);
    var list = acc[week] || [];
    acc[week] = list.concat([row]);
    return acc;
  }, {});
  return Object.keys(byWeek)
    .map(Number)
    .sort(function (a, b) { return a - b; })
    .map(function (week) { return summarizeWeek(week, byWeek[week]); });
}

function summarizeWeek(week, rows) {
  var sorted = rows.slice().sort(function (a, b) { return toTime(a['Submitted']) - toTime(b['Submitted']); });
  var latest = sorted[sorted.length - 1];
  var withFeedback = sorted.filter(function (row) { return String(row['Feedback']).trim(); });
  var feedback = withFeedback.length ? String(withFeedback[withFeedback.length - 1]['Feedback']).trim() : '';
  return {
    week: week,
    submittedAt: new Date(toTime(latest['Submitted'])).toISOString(),
    late: String(latest['Late']).trim() !== '',
    attempts: sorted.length,
    feedback: feedback,
  };
}

function toTime(value) {
  var time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return isNaN(time) ? 0 : time;
}
