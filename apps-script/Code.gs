/**
 * Hikmah Hackers: student portal + submission bridge.
 *
 * The website POSTs { action, studentCode, ... } here. Every action needs a valid
 * personal student code from the Roster sheet. Actions:
 *   login   -> the student's name and their submissions (with your feedback)
 *   submit  -> commits code to the PRIVATE repo as week-01/<first-last>/main.py
 *   getCode -> returns a past submission's code
 *
 * Setup: see apps-script/README.md. Secrets live in Script Properties, never in code:
 *   GITHUB_TOKEN   fine-grained token, Contents: read & write on the submissions repo only
 *   GITHUB_REPO    e.g. hikmah-hackers/submissions
 *   SITE_URL       e.g. https://hikmah-hackers.github.io
 *   GITHUB_BRANCH  optional, default "main"
 *   SHEET_ID       created automatically by setupCheck()
 *
 * Files: Code.gs (entry + config), Roster.gs, Sheets.gs, Submissions.gs, GitHub.gs.
 */

// Keep in sync with website/src/lib/submission-rules.ts
// JSON escaping can double the code's length (newlines, quotes, tabs), so the body limit has headroom.
var LIMITS = { codeMaxChars: 50000, noteMax: 500, bodyMaxChars: 102000 };
var TIME_ZONE = 'America/Detroit';
var RATE_LIMIT = { perStudentPerMinute: 4, globalPerMinute: 60, badLoginsPer10Min: 30 };
var BAD_LOGIN_WINDOW_SECONDS = 600;
var GENERIC_ERROR = 'Something went wrong on our side. Please try again in a minute.';
var BROKEN_REQUEST = 'That request looked broken. Please reload the page and try again.';

var ACTIONS = {
  login: handleLogin,
  submit: handleSubmit,
  getCode: handleGetCode,
};

/* ------------------------------------------------------------------ */
/* Entry points                                                        */
/* ------------------------------------------------------------------ */

function doGet() {
  return respond({ success: true, data: { status: 'ok' } });
}

function doPost(e) {
  try {
    var config = loadConfig();
    var request = parseRequest(e);
    if (!request) return fail(BROKEN_REQUEST);

    // Count wrong codes before anything else so codes can't be brute-forced.
    if (tooManyBadLogins()) return fail('Too many wrong codes. Wait 10 minutes, then try again.');
    var student = findStudent(config, request.studentCode);
    if (!student) {
      recordBadLogin();
      return fail('That student code isn’t right. Check the card your teacher gave you.');
    }

    return respond({ success: true, data: ACTIONS[request.action](config, student, request) });
  } catch (err) {
    if (err && err.isUserError) return fail(err.message);
    console.error('Request failed: ' + (err && err.message ? err.message : err));
    return fail(GENERIC_ERROR);
  }
}

/** Run once from the editor after setting Script Properties. Safe to run again. */
function setupCheck() {
  var config = loadConfig();
  var book = setupSheets(config);
  var repo = githubRequest(config, 'get', '/repos/' + config.repo, null);
  if (repo.code !== 200) throw new Error('Cannot access repo ' + config.repo + ' (HTTP ' + repo.code + '). Check GITHUB_REPO and GITHUB_TOKEN.');
  if (!repo.body.private) console.warn('WARNING: ' + config.repo + ' is PUBLIC. Make it private to protect student work.');
  var weeks = fetchAssignments(config).map(function (a) { return a.week; });
  console.log('OK. Repo reachable. Assignments open: ' + weeks.join(', '));
  console.log('Class sheet: ' + book.getUrl());
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function handleLogin(config, student) {
  return { student: publicStudent(student), submissions: listSubmissions(config, student.id) };
}

function handleSubmit(config, student, request) {
  var problem = validateSubmission(request);
  if (problem) throw userError(problem);
  if (!withinRateLimit(student.id)) throw userError('Too many tries. Wait a minute, then submit again.');

  var assignment = findAssignment(request.week, config);
  if (!assignment) throw userError('That week isn’t open for submissions.');

  var late = todayISO() > assignment.due;
  var path = submissionPath(request.week, student.id);
  var content = buildFileContent(student, request, assignment, late);

  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  var result;
  try {
    result = commitToGitHub(config, path, content, commitMessage(student, request.week, late));
  } finally {
    lock.releaseLock();
  }

  logSubmission(config, student, request, path, late, result.resubmission);
  return { path: path, late: late, resubmission: result.resubmission };
}

function handleGetCode(config, student, request) {
  if (!isValidWeek(request.week)) throw userError('Please choose a week.');
  var content = readFromGitHub(config, submissionPath(request.week, student.id));
  if (content === null) throw userError('No submission found for that week.');
  return { week: request.week, code: content };
}

/* ------------------------------------------------------------------ */
/* Config, parsing, responses                                          */
/* ------------------------------------------------------------------ */

var LOCK_WAIT_MS = 20000;

function loadConfig() {
  var props = PropertiesService.getScriptProperties();
  ['GITHUB_TOKEN', 'GITHUB_REPO', 'SITE_URL'].forEach(function (key) {
    if (!props.getProperty(key)) throw new Error('Missing Script Property: ' + key);
  });
  var repo = props.getProperty('GITHUB_REPO');
  if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(repo)) throw new Error('GITHUB_REPO must look like owner/name');
  return {
    token: props.getProperty('GITHUB_TOKEN'),
    repo: repo,
    branch: props.getProperty('GITHUB_BRANCH') || 'main',
    siteUrl: props.getProperty('SITE_URL').replace(/\/+$/, ''),
    sheetId: props.getProperty('SHEET_ID') || '',
  };
}

function parseRequest(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string') return null;
  if (e.postData.contents.length > LIMITS.bodyMaxChars) return null;
  var raw;
  try {
    raw = JSON.parse(e.postData.contents);
  } catch (err) {
    return null;
  }
  if (!raw || typeof raw !== 'object' || !ACTIONS.hasOwnProperty(raw.action)) return null;
  // Allowlist: copy only the fields we expect, coerced to the right type.
  return {
    action: raw.action,
    studentCode: normalizeStudentCode(asString(raw.studentCode)),
    week: Number(raw.week),
    code: asString(raw.code).replace(/\r\n/g, '\n'),
    note: asString(raw.note).trim(),
  };
}

function asString(value) {
  return typeof value === 'string' ? value : '';
}

function userError(message) {
  var err = new Error(message);
  err.isUserError = true;
  return err;
}

function fail(message) {
  return respond({ success: false, error: message });
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
