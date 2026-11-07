/**
 * Enrollment form -> Roster -> email.
 * When a family submits the enrollment form (the website's Sign up page links to it), the student
 * is added to the Roster (first name, last name, grade), gets a student code right away, and the
 * code is emailed to the parent/guardian email (and the student email, if given). The Roster's
 * "Code emailed" column records when and to whom.
 *
 * Setup (once): set Script Property ENROLLMENT_FORM_ID, then run connectEnrollmentForm().
 * That imports everyone who already enrolled and listens for new submissions.
 * To email codes to families who enrolled before emails existed, run sendMissingCodeEmails().
 */

// Question titles from enrollment-form.gs. Update these if you rename the questions.
var ENROLLMENT_QUESTIONS = {
  firstName: 'Student first name',
  lastName: 'Student last name',
  grade: 'Current grade',
  studentEmail: 'Student email',
  parentEmail: 'Parent/guardian email',
};

var SIGNUP_CONFIRMATION =
  'Thank you for signing up for Hikmah Hackers! Your student code is on its way to the email address(es) you gave. ' +
  'It can take a few minutes, so check your spam folder too. Use the code to log in at hikmah-hackers.github.io/login.';

/** Run once from the editor. Safe to run again: it never creates duplicate students or triggers. */
function connectEnrollmentForm() {
  var form = openEnrollmentForm();
  var alreadyConnected = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === 'onEnrollmentSubmit';
  });
  if (!alreadyConnected) ScriptApp.newTrigger('onEnrollmentSubmit').forForm(form).onFormSubmit().create();
  form.setConfirmationMessage(SIGNUP_CONFIRMATION);

  var added = form.getResponses().filter(function (response) { return addEnrollmentToRoster(response); }).length;
  console.log((alreadyConnected ? 'Already connected.' : 'Connected to "' + form.getTitle() + '".') + ' Added ' + added + ' student(s) to the Roster.');
}

/** Installable trigger: runs on every new enrollment. */
function onEnrollmentSubmit(e) {
  var code = addEnrollmentToRoster(e.response);
  // A student already on the Roster gets no email: anyone could re-enter a name, so an existing
  // code is never sent to a new address. The teacher handles those by hand.
  if (code) emailStudentCode(e.response, code);
}

/** Run from the editor: emails the code to every enrolled family whose "Code emailed" is still blank. */
function sendMissingCodeEmails() {
  var rows = readTable(rosterSheet(loadConfig())).rows;
  var sent = 0;
  openEnrollmentForm().getResponses().forEach(function (response) {
    var answers = readEnrollmentAnswers(response);
    var id = studentSlug(answers.firstName, answers.lastName);
    var row = rows.filter(function (r) { return studentSlug(String(r['First name']), String(r['Last name'])) === id; })[0];
    if (!row || isInactive(row) || String(row['Code emailed']).trim()) return;
    var code = normalizeStudentCode(String(row['Code']));
    if (code && emailStudentCode(response, code)) sent += 1;
  });
  console.log('Emailed ' + sent + ' code(s). Emails left today: ' + MailApp.getRemainingDailyQuota());
}

/** Emails the code to the parent (and student, if given), then notes it on the Roster. */
function emailStudentCode(response, code) {
  var answers = readEnrollmentAnswers(response);
  var to = [answers.parentEmail, answers.studentEmail]
    .map(function (email) { return email.toLowerCase(); })
    .filter(function (email, i, all) { return /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email) && all.indexOf(email) === i; });
  if (!to.length) {
    console.warn('No email address for ' + answers.firstName + ' ' + answers.lastName + '. Give them their code by hand.');
    return false;
  }

  var message = codeEmail(answers.firstName, code, loadConfig().siteUrl + '/login');
  MailApp.sendEmail({ to: to.join(','), subject: 'Your Hikmah Hackers student code', body: message.text, htmlBody: message.html, name: 'Hikmah Hackers' });

  var stamp = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HH:mm');
  markCodeEmailed(studentSlug(answers.firstName, answers.lastName), stamp + ' to ' + to.join(', '));
  return true;
}

function markCodeEmailed(studentId, note) {
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try {
    var sheet = rosterSheet(loadConfig());
    var table = readTable(sheet);
    var col = table.headers.indexOf('Code emailed') + 1;
    var row = table.rows.filter(function (r) { return studentSlug(String(r['First name']), String(r['Last name'])) === studentId; })[0];
    if (row && col > 0) sheet.getRange(row.__row, col).setValue(sheetSafe(note));
  } finally {
    lock.releaseLock();
  }
}

function codeEmail(firstName, code, loginUrl) {
  var text = [
    'Assalamu alaikum,',
    '',
    'Thank you for signing up ' + firstName + ' for Hikmah Hackers!',
    '',
    firstName + '’s student code is: ' + code,
    '',
    'How to log in:',
    '1. Go to ' + loginUrl,
    '2. Type the code and press Log in.',
    '',
    'The code is how ' + firstName + ' logs in and turns in work, so please keep it private and don’t share it with other students. If it gets lost, reply to this email and we’ll make a new one.',
    '',
    'See you Friday, in sha Allah.',
    'Hikmah Hackers · Darul Uloom Michigan',
  ].join('\n');

  var name = htmlEscape(firstName);
  var html =
    '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0E3B2E">' +
    '<div style="background:#0E3B2E;color:#F3EBDD;padding:24px 28px;border-radius:12px 12px 0 0;font-size:22px;font-weight:bold">' +
    'Hikmah <span style="color:#D4A84B">Hackers</span></div>' +
    '<div style="background:#F3EBDD;padding:28px;border-radius:0 0 12px 12px">' +
    '<p>Assalamu alaikum,</p>' +
    '<p>Thank you for signing up ' + name + ' for Hikmah Hackers! ' + name + '’s student code is:</p>' +
    '<p style="font:bold 32px Consolas,monospace;letter-spacing:4px;text-align:center;background:#0A2A21;color:#E8C26A;padding:18px;border-radius:10px">' + code + '</p>' +
    '<p><a href="' + loginUrl + '" style="display:inline-block;background:#D4A84B;color:#0E3B2E;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none">Log in to Hikmah Hackers</a></p>' +
    '<p>The code is how ' + name + ' logs in and turns in work, so please keep it private and don’t share it with other students. If it gets lost, reply to this email and we’ll make a new one.</p>' +
    '<p>See you Friday, in sha Allah.<br>Hikmah Hackers · Darul Uloom Michigan</p></div></div>';
  return { text: text, html: html };
}

function htmlEscape(text) {
  var entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, function (ch) { return entities[ch]; });
}

/** Accepts the form's id or its whole edit link, and explains the common mix-ups. */
function openEnrollmentForm() {
  var value = (PropertiesService.getScriptProperties().getProperty('ENROLLMENT_FORM_ID') || '').trim();
  if (!value) throw new Error('Set the Script Property ENROLLMENT_FORM_ID to the form’s edit link (it ends in /edit).');
  if (/\/forms\/d\/e\/|^1FAIpQL/.test(value)) {
    throw new Error('That is the link you send to families. Use the EDIT link instead: open the form for editing and copy the address bar (…/forms/d/<id>/edit).');
  }
  var match = value.match(/\/d\/([A-Za-z0-9_-]{20,})/);
  var formId = match ? match[1] : value;
  try {
    return FormApp.openById(formId);
  } catch (err) {
    throw new Error('Can’t open that form. Check that ' + Session.getEffectiveUser().getEmail() + ' can edit it (form ⋮ → Add collaborators), and that this is the form’s edit link, not its response sheet.');
  }
}

/** Adds one form response to the Roster. Returns the new student's code, or '' if nobody was added. */
function addEnrollmentToRoster(response) {
  var answers = readEnrollmentAnswers(response);
  if (!answers.firstName || !answers.lastName) return '';

  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try {
    var sheet = rosterSheet(loadConfig());
    var table = readTable(sheet);
    var id = studentSlug(answers.firstName, answers.lastName);
    var exists = table.rows.some(function (row) {
      return studentSlug(String(row['First name']), String(row['Last name'])) === id;
    });
    if (exists) return '';

    var taken = table.rows.map(function (row) { return normalizeStudentCode(String(row['Code'])); });
    var values = {
      'Code': uniqueCode(taken),
      'First name': sheetSafe(answers.firstName),
      'Last name': sheetSafe(answers.lastName),
      'Grade': answers.grade,
      'Active': 'yes',
    };
    sheet.appendRow(table.headers.map(function (header) { return values.hasOwnProperty(header) ? values[header] : ''; }));
    return values['Code'];
  } finally {
    lock.releaseLock();
  }
}

function readEnrollmentAnswers(response) {
  var byTitle = {};
  response.getItemResponses().forEach(function (itemResponse) {
    byTitle[itemResponse.getItem().getTitle().trim()] = String(itemResponse.getResponse() || '').trim();
  });
  return {
    firstName: titleCase(byTitle[ENROLLMENT_QUESTIONS.firstName] || ''),
    lastName: titleCase(byTitle[ENROLLMENT_QUESTIONS.lastName] || ''),
    grade: parseGrade(byTitle[ENROLLMENT_QUESTIONS.grade] || ''),
    studentEmail: byTitle[ENROLLMENT_QUESTIONS.studentEmail] || '',
    parentEmail: byTitle[ENROLLMENT_QUESTIONS.parentEmail] || '',
  };
}

/** "Grade 8" -> 8, "9th" -> 9; an "Other" answer with no number is kept as typed. */
function parseGrade(answer) {
  var match = answer.match(/\d{1,2}/);
  return match ? Number(match[0]) : answer;
}

/** "mohammad KHAN" -> "Mohammad Khan", so names look tidy and folders stay consistent. */
function titleCase(name) {
  return name.replace(/\s+/g, ' ').toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, function (m, sep, letter) {
    return sep + letter.toUpperCase();
  });
}
