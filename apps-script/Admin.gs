/**
 * Teacher-only actions for the website's /admin page.
 * Every request carries the ADMIN_CODE passphrase (Script Property). Students never get it:
 * their codes can only log in, submit, and read their own work.
 *
 *   adminOverview -> the whole Roster and every submission row
 *   adminGetCode  -> any student's submitted code for a week
 *   adminFeedback -> writes feedback onto a student's latest submission for a week
 */

var ADMIN_CODE_MIN_LENGTH = 12;
var STUDENT_ID_PATTERN = /^[a-z0-9-]{1,80}$/;

function isAdminCode(candidate) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_CODE') || '';
  if (expected.length < ADMIN_CODE_MIN_LENGTH || !candidate) return false;
  // Compare hashes so the check takes the same time however much of the code matches.
  var digest = function (text) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  };
  var a = digest(candidate);
  var b = digest(expected);
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function handleAdminOverview(config) {
  var book = openClassBook(config);
  var roster = readTable(rosterSheet(config)).rows.map(function (row) {
    var firstName = String(row['First name']).trim();
    var lastName = String(row['Last name']).trim();
    return {
      id: firstName && lastName ? studentSlug(firstName, lastName) : '',
      code: String(row['Code']).trim(),
      firstName: firstName,
      lastName: lastName,
      grade: row['Grade'] === '' ? '' : String(row['Grade']),
      active: !isInactive(row),
      emailed: asIsoOrText(row['Code emailed']),
    };
  });
  var submissions = readTable(ensureSheet(book, SUBMISSIONS_SHEET, SUBMISSION_HEADERS)).rows.map(function (row) {
    return {
      submittedAt: asIsoOrText(row['Submitted']),
      week: Number(row['Week']),
      studentId: String(row['Student ID']),
      firstName: String(row['First name']),
      lastName: String(row['Last name']),
      grade: row['Grade'] === '' ? '' : String(row['Grade']),
      late: String(row['Late']).trim() !== '',
      resubmission: String(row['Resubmission']).trim() !== '',
      note: String(row['Note']),
      feedback: String(row['Feedback']),
    };
  });
  return { roster: roster, submissions: submissions, sheetUrl: book.getUrl() };
}

function handleAdminGetCode(config, request) {
  var studentId = validAdminTarget(request);
  var content = readFromGitHub(config, submissionPath(request.week, studentId));
  if (content === null) throw userError('No submission found for that week.');
  return { week: request.week, code: content };
}

function handleAdminFeedback(config, request) {
  var studentId = validAdminTarget(request);
  if (request.feedback.length > LIMITS.feedbackMax) throw userError('Keep feedback under ' + LIMITS.feedbackMax + ' characters.');

  var sheet = ensureSheet(openClassBook(config), SUBMISSIONS_SHEET, SUBMISSION_HEADERS);
  var table = readTable(sheet);
  var col = table.headers.indexOf('Feedback') + 1;
  if (col === 0) throw userError('The Submissions tab has no Feedback column.');
  var rows = table.rows.filter(function (row) {
    return row['Student ID'] === studentId && Number(row['Week']) === request.week;
  });
  if (!rows.length) throw userError('No submission found for that week.');
  var latest = rows.sort(function (a, b) { return toTime(a['Submitted']) - toTime(b['Submitted']); })[rows.length - 1];
  sheet.getRange(latest.__row, col).setValue(sheetSafe(request.feedback));
  return { saved: true };
}

function validAdminTarget(request) {
  if (!isValidWeek(request.week)) throw userError('Please choose a week.');
  if (!STUDENT_ID_PATTERN.test(request.studentId)) throw userError('Unknown student.');
  return request.studentId;
}

function asIsoOrText(value) {
  if (value instanceof Date) return value.toISOString();
  return String(value || '');
}
