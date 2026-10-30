/**
 * Hikmah Hackers: submission bridge.
 *
 * The website's Submit form POSTs here. This script checks the submission, then
 * commits it to a PRIVATE GitHub repo as  week-01/<student-name>/main.py
 * and (optionally) logs a row to a Google Sheet.
 *
 * Setup: see apps-script/README.md. Secrets live in Script Properties, never in code:
 *   GITHUB_TOKEN    fine-grained token, Contents: read & write on the submissions repo only
 *   GITHUB_REPO     e.g. hikmah-hackers/submissions
 *   CLASS_PASSCODE  the passcode you tell students in class
 *   SITE_URL        e.g. https://hikmah-hackers.github.io
 *   GITHUB_BRANCH   optional, default "main"
 *   SHEET_ID        optional, Google Sheet id for a submissions log
 */

// Keep in sync with website/src/lib/submission-rules.ts
// JSON escaping can double the code's length (newlines, quotes, tabs), so allow headroom.
var LIMITS = { nameMax: 40, codeMaxChars: 50000, noteMax: 500, passcodeMax: 64, bodyMaxChars: 102000 };
var GRADES = [7, 8, 9, 10];
var NAME_PATTERN = /^[\p{L}][\p{L}' -]*$/u;
var TIME_ZONE = 'America/Detroit';
var RATE_LIMIT = { perStudentPerMinute: 3, globalPerMinute: 60, badPasscodesPer10Min: 20 };
var BAD_PASSCODE_WINDOW_SECONDS = 600;
var ASSIGNMENTS_CACHE_SECONDS = 300;
var LOCK_WAIT_MS = 20000;
var GENERIC_ERROR = 'Something went wrong on our side. Please try again in a minute.';

/* ------------------------------------------------------------------ */
/* Entry points                                                        */
/* ------------------------------------------------------------------ */

function doGet() {
  return respond({ success: true, data: { status: 'ok' } });
}

function doPost(e) {
  try {
    var config = loadConfig();
    var payload = parsePayload(e);
    if (!payload) return fail('That submission looked broken. Please reload the page and try again.');

    // Count wrong passcodes before anything else so the passcode can't be brute-forced.
    if (tooManyBadPasscodes()) return fail('Too many wrong passcodes. Wait 10 minutes, then try again.');
    if (!isCorrectPasscode(payload.passcode, config)) {
      recordBadPasscode();
      return fail('That class passcode isn’t right. Ask your teacher.');
    }

    var problem = validatePayload(payload);
    if (problem) return fail(problem);

    var student = studentSlug(payload.firstName, payload.lastName);
    if (!withinRateLimit(student)) return fail('Too many tries. Wait a minute, then submit again.');

    var assignment = findAssignment(payload.week, config);
    if (!assignment) return fail('That week isn’t open for submissions.');

    var late = todayISO() > assignment.due;
    var path = submissionPath(payload.week, student);
    var content = buildFileContent(payload, assignment, late);

    var lock = LockService.getScriptLock();
    lock.waitLock(LOCK_WAIT_MS);
    var result;
    try {
      result = commitToGitHub(config, path, content, commitMessage(payload, late));
    } finally {
      lock.releaseLock();
    }

    logToSheet(config, payload, path, late, result.resubmission);
    return respond({ success: true, data: { path: path, late: late, resubmission: result.resubmission } });
  } catch (err) {
    console.error('Submission failed: ' + (err && err.message ? err.message : err));
    return fail(GENERIC_ERROR);
  }
}

/** Run this once from the editor after setting Script Properties. */
function setupCheck() {
  var config = loadConfig();
  var repo = githubRequest(config, 'get', '/repos/' + config.repo, null);
  if (repo.code !== 200) throw new Error('Cannot access repo ' + config.repo + ' (HTTP ' + repo.code + '). Check GITHUB_REPO and GITHUB_TOKEN.');
  if (!repo.body.private) console.warn('WARNING: ' + config.repo + ' is PUBLIC. Make it private to protect student work.');
  var assignments = fetchAssignments(config);
  console.log('OK. Repo reachable. Assignments open: ' + assignments.map(function (a) { return a.week; }).join(', '));
}

/* ------------------------------------------------------------------ */
/* Config & parsing                                                    */
/* ------------------------------------------------------------------ */

function loadConfig() {
  var props = PropertiesService.getScriptProperties();
  var required = ['GITHUB_TOKEN', 'GITHUB_REPO', 'CLASS_PASSCODE', 'SITE_URL'];
  required.forEach(function (key) {
    if (!props.getProperty(key)) throw new Error('Missing Script Property: ' + key);
  });
  var repo = props.getProperty('GITHUB_REPO');
  if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(repo)) throw new Error('GITHUB_REPO must look like owner/name');
  return {
    token: props.getProperty('GITHUB_TOKEN'),
    repo: repo,
    branch: props.getProperty('GITHUB_BRANCH') || 'main',
    passcode: props.getProperty('CLASS_PASSCODE'),
    siteUrl: props.getProperty('SITE_URL').replace(/\/+$/, ''),
    sheetId: props.getProperty('SHEET_ID') || '',
  };
}

function parsePayload(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string') return null;
  if (e.postData.contents.length > LIMITS.bodyMaxChars) return null;
  var raw;
  try {
    raw = JSON.parse(e.postData.contents);
  } catch (err) {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  // Allowlist: copy only the fields we expect, coerced to the right type.
  return {
    firstName: normalizeName(asString(raw.firstName)),
    lastName: normalizeName(asString(raw.lastName)),
    grade: Number(raw.grade),
    week: Number(raw.week),
    code: asString(raw.code).replace(/\r\n/g, '\n'),
    note: asString(raw.note).trim(),
    passcode: asString(raw.passcode).trim(),
  };
}

/** Curly apostrophes (O’Brien) are stored as straight ones, matching the website. */
function normalizeName(name) {
  return name.trim().replace(/’/g, "'");
}

function asString(value) {
  return typeof value === 'string' ? value : '';
}

function isCorrectPasscode(passcode, config) {
  return passcode.length > 0 && passcode.length <= LIMITS.passcodeMax && safeEqual(passcode, config.passcode);
}

function validatePayload(p) {
  if (!isValidName(p.firstName) || !isValidName(p.lastName)) return 'Please use letters only in your name.';
  if (GRADES.indexOf(p.grade) === -1) return 'Please choose your grade.';
  if (!(p.week >= 1 && p.week <= 60 && Math.floor(p.week) === p.week)) return 'Please choose a week.';
  if (!p.code.trim()) return 'Your code is empty.';
  if (p.code.length > LIMITS.codeMaxChars) return 'That code is too long.';
  if (p.note.length > LIMITS.noteMax) return 'Your note is too long.';
  return null;
}

function isValidName(name) {
  return name.length > 0 && name.length <= LIMITS.nameMax && NAME_PATTERN.test(name);
}

/** Constant-time comparison so the passcode can't be guessed by timing. */
function safeEqual(a, b) {
  var da = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, a, Utilities.Charset.UTF_8);
  var db = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, b, Utilities.Charset.UTF_8);
  var diff = 0;
  for (var i = 0; i < da.length; i++) diff |= da[i] ^ db[i];
  return diff === 0;
}

/* ------------------------------------------------------------------ */
/* Assignments, dates, paths                                           */
/* ------------------------------------------------------------------ */

function fetchAssignments(config) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('assignments');
  if (cached) return JSON.parse(cached);

  var response = UrlFetchApp.fetch(config.siteUrl + '/assignments.json', { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) throw new Error('assignments.json returned ' + response.getResponseCode());
  var body = JSON.parse(response.getContentText());
  var list = (body && body.success && Array.isArray(body.data) ? body.data : []).filter(function (a) {
    return typeof a.week === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(a.due);
  });
  cache.put('assignments', JSON.stringify(list), ASSIGNMENTS_CACHE_SECONDS);
  return list;
}

function findAssignment(week, config) {
  return fetchAssignments(config).filter(function (a) { return a.week === week; })[0] || null;
}

function todayISO() {
  return Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
}

/** "Amina Khan" -> "amina-khan". Names with no Latin letters get a stable hashed id. */
function studentSlug(firstName, lastName) {
  var full = (firstName + ' ' + lastName).normalize('NFD').replace(/[̀-ͯ]/g, '');
  var slug = full.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  if (slug) return slug;
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, (firstName + ' ' + lastName).toLowerCase(), Utilities.Charset.UTF_8);
  return 'student-' + digest.slice(0, 4).map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function submissionPath(week, student) {
  var path = 'week-' + ('0' + week).slice(-2) + '/' + student + '/main.py';
  if (!/^week-\d{2}\/[a-z0-9-]+\/main\.py$/.test(path)) throw new Error('Unsafe path generated');
  return path;
}

function oneLine(text) {
  return text.replace(/[\r\n]+/g, ' ');
}

function buildFileContent(p, assignment, late) {
  var stamp = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HH:mm');
  var header = [
    '# Hikmah Hackers: Week ' + p.week + ': ' + oneLine(assignment.title),
    '# Student: ' + p.firstName + ' ' + p.lastName + ' (Grade ' + p.grade + ')',
    '# Submitted: ' + stamp + ' ' + TIME_ZONE + (late ? '  [LATE]' : ''),
  ];
  if (p.note) header.push('# Note: ' + oneLine(p.note));
  header.push('# ' + new Array(60).join('-'), '');
  return header.join('\n') + p.code.replace(/\s+$/, '') + '\n';
}

function commitMessage(p, late) {
  return 'Week ' + p.week + ': ' + p.firstName + ' ' + p.lastName.charAt(0) + '.' + (late ? ' [late]' : '');
}

/* ------------------------------------------------------------------ */
/* GitHub                                                              */
/* ------------------------------------------------------------------ */

function githubRequest(config, method, apiPath, body) {
  var options = {
    method: method,
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + config.token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  };
  if (body) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(body);
  }
  var response = UrlFetchApp.fetch('https://api.github.com' + apiPath, options);
  var text = response.getContentText();
  return { code: response.getResponseCode(), body: text ? JSON.parse(text) : null };
}

function contentsPath(config, path) {
  return '/repos/' + config.repo + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
}

function commitToGitHub(config, path, content, message) {
  var existing = githubRequest(config, 'get', contentsPath(config, path) + '?ref=' + encodeURIComponent(config.branch), null);
  if (existing.code !== 200 && existing.code !== 404) throw new Error('GitHub lookup failed: HTTP ' + existing.code);

  var body = {
    message: message,
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: config.branch,
  };
  if (existing.code === 200) body.sha = existing.body.sha;

  var saved = githubRequest(config, 'put', contentsPath(config, path), body);
  if (saved.code !== 200 && saved.code !== 201) throw new Error('GitHub commit failed: HTTP ' + saved.code);
  return { resubmission: existing.code === 200 };
}

/* ------------------------------------------------------------------ */
/* Rate limit & sheet log                                              */
/* ------------------------------------------------------------------ */

function withinRateLimit(student) {
  var cache = CacheService.getScriptCache();
  var bump = function (key, max) {
    var count = Number(cache.get(key) || 0) + 1;
    cache.put(key, String(count), 60);
    return count <= max;
  };
  return bump('rl:all', RATE_LIMIT.globalPerMinute) && bump('rl:' + student, RATE_LIMIT.perStudentPerMinute);
}

function tooManyBadPasscodes() {
  return Number(CacheService.getScriptCache().get('rl:badpass') || 0) >= RATE_LIMIT.badPasscodesPer10Min;
}

function recordBadPasscode() {
  var cache = CacheService.getScriptCache();
  var count = Number(cache.get('rl:badpass') || 0) + 1;
  cache.put('rl:badpass', String(count), BAD_PASSCODE_WINDOW_SECONDS);
}

/** Prefix values that a spreadsheet would treat as formulas. */
function sheetSafe(value) {
  var text = String(value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function logToSheet(config, p, path, late, resubmission) {
  if (!config.sheetId) return;
  try {
    var book = SpreadsheetApp.openById(config.sheetId);
    var sheet = book.getSheetByName('Submissions') || book.insertSheet('Submissions');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Submitted', 'Week', 'First name', 'Last name', 'Grade', 'Late', 'Resubmission', 'File', 'Note']);
      sheet.setFrozenRows(1);
    }
    var url = 'https://github.com/' + config.repo + '/blob/' + config.branch + '/' + path;
    sheet.appendRow([
      new Date(),
      p.week,
      sheetSafe(p.firstName),
      sheetSafe(p.lastName),
      p.grade,
      late ? 'LATE' : '',
      resubmission ? 'yes' : '',
      url,
      sheetSafe(p.note),
    ]);
  } catch (err) {
    // The commit already succeeded; a logging failure shouldn't fail the student.
    console.error('Sheet log failed: ' + err.message);
  }
}

/* ------------------------------------------------------------------ */

function fail(message) {
  return respond({ success: false, error: message });
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
