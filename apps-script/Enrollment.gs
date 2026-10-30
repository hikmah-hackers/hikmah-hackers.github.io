/**
 * Enrollment form -> Roster.
 * When a family submits the enrollment form, the student is added to the Roster
 * (first name, last name, grade) and gets a student code right away.
 *
 * Setup (once): set Script Property ENROLLMENT_FORM_ID, then run connectEnrollmentForm().
 * That imports everyone who already enrolled and listens for new submissions.
 */

// Question titles from enrollment-form.gs. Update these if you rename the questions.
var ENROLLMENT_QUESTIONS = {
  firstName: 'Student first name',
  lastName: 'Student last name',
  grade: 'Current grade',
};

/** Run once from the editor. Safe to run again: it never creates duplicate students or triggers. */
function connectEnrollmentForm() {
  var form = openEnrollmentForm();
  var alreadyConnected = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === 'onEnrollmentSubmit';
  });
  if (!alreadyConnected) ScriptApp.newTrigger('onEnrollmentSubmit').forForm(form).onFormSubmit().create();

  var added = form.getResponses().filter(function (response) { return addEnrollmentToRoster(response); }).length;
  console.log((alreadyConnected ? 'Already connected.' : 'Connected to "' + form.getTitle() + '".') + ' Added ' + added + ' student(s) to the Roster.');
}

/** Installable trigger: runs on every new enrollment. */
function onEnrollmentSubmit(e) {
  addEnrollmentToRoster(e.response);
}

function openEnrollmentForm() {
  var formId = PropertiesService.getScriptProperties().getProperty('ENROLLMENT_FORM_ID');
  if (!formId) throw new Error('Set the Script Property ENROLLMENT_FORM_ID first (the long id in the form’s edit link).');
  return FormApp.openById(formId);
}

/** Adds one form response to the Roster. Returns true if a new student was added. */
function addEnrollmentToRoster(response) {
  var answers = readEnrollmentAnswers(response);
  if (!answers.firstName || !answers.lastName) return false;

  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try {
    var sheet = rosterSheet(loadConfig());
    var table = readTable(sheet);
    var id = studentSlug(answers.firstName, answers.lastName);
    var exists = table.rows.some(function (row) {
      return studentSlug(String(row['First name']), String(row['Last name'])) === id;
    });
    if (exists) return false;

    var taken = table.rows.map(function (row) { return normalizeStudentCode(String(row['Code'])); });
    var values = {
      'Code': uniqueCode(taken),
      'First name': sheetSafe(answers.firstName),
      'Last name': sheetSafe(answers.lastName),
      'Grade': answers.grade,
      'Active': 'yes',
    };
    sheet.appendRow(table.headers.map(function (header) { return values.hasOwnProperty(header) ? values[header] : ''; }));
    return true;
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
