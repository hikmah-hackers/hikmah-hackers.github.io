/**
 * The Roster sheet: one row per student. You type names; generateStudentCodes() fills in codes.
 *   Code | First name | Last name | Grade | Active
 * Set Active to "no" to switch a student's code off without deleting them.
 */

var ROSTER_SHEET = 'Roster';
var ROSTER_HEADERS = ['Code', 'First name', 'Last name', 'Grade', 'Active'];
// No I/O or 0/1, so codes are easy to read off a card.
var CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
var CODE_DIGITS = '23456789';
var STUDENT_CODE_PATTERN = /^[A-HJ-NP-Z]{3}-[2-9]{4}$/;

/** "kqm 4827" / "KQM4827" / "kqm-4827" -> "KQM-4827"; anything else -> "". */
function normalizeStudentCode(raw) {
  var compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  var formatted = compact.slice(0, 3) + '-' + compact.slice(3);
  return STUDENT_CODE_PATTERN.test(formatted) ? formatted : '';
}

function findStudent(config, studentCode) {
  if (!studentCode) return null;
  var rows = readTable(rosterSheet(config)).rows;
  var match = rows.filter(function (row) {
    return normalizeStudentCode(String(row['Code'])) === studentCode && !isInactive(row);
  })[0];
  if (!match) return null;
  var firstName = String(match['First name']).trim();
  var lastName = String(match['Last name']).trim();
  if (!firstName || !lastName) return null;
  return {
    id: studentSlug(firstName, lastName),
    firstName: firstName,
    lastName: lastName,
    grade: Number(match['Grade']) || '',
  };
}

function publicStudent(student) {
  return { firstName: student.firstName, lastName: student.lastName, grade: student.grade };
}

function isInactive(row) {
  return /^(no|n|false|0)$/i.test(String(row['Active']).trim());
}

function rosterSheet(config) {
  return ensureSheet(openClassBook(config), ROSTER_SHEET, ROSTER_HEADERS);
}

/** Run from the editor: gives every named student without a code a new unique one. */
function generateStudentCodes() {
  var sheet = rosterSheet(loadConfig());
  var table = readTable(sheet);
  var codeCol = table.headers.indexOf('Code') + 1;
  var activeCol = table.headers.indexOf('Active') + 1;
  var taken = table.rows.map(function (row) { return normalizeStudentCode(String(row['Code'])); });
  var created = 0;

  table.rows.forEach(function (row) {
    var hasName = String(row['First name']).trim() && String(row['Last name']).trim();
    if (!hasName || normalizeStudentCode(String(row['Code']))) return;
    var code = uniqueCode(taken);
    taken = taken.concat([code]);
    sheet.getRange(row.__row, codeCol).setValue(code);
    if (activeCol > 0 && !String(row['Active']).trim()) sheet.getRange(row.__row, activeCol).setValue('yes');
    created += 1;
  });
  console.log('Created ' + created + ' new code(s).');
}

function uniqueCode(taken) {
  for (var attempt = 0; attempt < 50; attempt++) {
    var code = randomFrom(CODE_LETTERS, 3) + '-' + randomFrom(CODE_DIGITS, 4);
    if (taken.indexOf(code) === -1) return code;
  }
  throw new Error('Could not make a unique code. Try again.');
}

function randomFrom(alphabet, length) {
  var out = '';
  for (var i = 0; i < length; i++) out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return out;
}

/* Wrong-code limiter: counts failures across everyone, so guessing is slow. */

function tooManyBadLogins() {
  return Number(CacheService.getScriptCache().get('rl:badlogin') || 0) >= RATE_LIMIT.badLoginsPer10Min;
}

function recordBadLogin() {
  var cache = CacheService.getScriptCache();
  var count = Number(cache.get('rl:badlogin') || 0) + 1;
  cache.put('rl:badlogin', String(count), BAD_LOGIN_WINDOW_SECONDS);
}
