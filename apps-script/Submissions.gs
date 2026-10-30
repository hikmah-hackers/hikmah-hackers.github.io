/**
 * Submission rules: validation, assignment lookup, file paths and contents, rate limits.
 */

var ASSIGNMENTS_CACHE_SECONDS = 300;

function validateSubmission(request) {
  if (!isValidWeek(request.week)) return 'Please choose a week.';
  if (!request.code.trim()) return 'Your code is empty.';
  if (request.code.length > LIMITS.codeMaxChars) return 'That code is too long.';
  if (request.note.length > LIMITS.noteMax) return 'Your note is too long.';
  return null;
}

function isValidWeek(week) {
  return week >= 1 && week <= 60 && Math.floor(week) === week;
}

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

/** "Mohammad Khan" -> "mohammad-khan". Names with no Latin letters get a stable hashed id. */
function studentSlug(firstName, lastName) {
  var full = (firstName + ' ' + lastName).normalize('NFD').replace(/[̀-ͯ]/g, '');
  var slug = full.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  if (slug) return slug;
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, (firstName + ' ' + lastName).toLowerCase(), Utilities.Charset.UTF_8);
  return 'student-' + digest.slice(0, 4).map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function submissionPath(week, studentId) {
  var path = 'week-' + ('0' + week).slice(-2) + '/' + studentId + '/main.py';
  if (!/^week-\d{2}\/[a-z0-9-]+\/main\.py$/.test(path)) throw new Error('Unsafe path generated');
  return path;
}

function oneLine(text) {
  return String(text).replace(/[\r\n]+/g, ' ');
}

function buildFileContent(student, request, assignment, late) {
  var stamp = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HH:mm');
  var grade = student.grade ? ' (Grade ' + student.grade + ')' : '';
  var header = [
    '# Hikmah Hackers: Week ' + request.week + ': ' + oneLine(assignment.title),
    '# Student: ' + oneLine(student.firstName + ' ' + student.lastName) + grade,
    '# Submitted: ' + stamp + ' ' + TIME_ZONE + (late ? '  [LATE]' : ''),
  ];
  if (request.note) header.push('# Note: ' + oneLine(request.note));
  header.push('# ' + new Array(60).join('-'), '');
  return header.join('\n') + request.code.replace(/\s+$/, '') + '\n';
}

function commitMessage(student, week, late) {
  return oneLine('Week ' + week + ': ' + student.firstName + ' ' + student.lastName.charAt(0) + '.' + (late ? ' [late]' : ''));
}

function withinRateLimit(studentId) {
  var cache = CacheService.getScriptCache();
  var bump = function (key, max) {
    var count = Number(cache.get(key) || 0) + 1;
    cache.put(key, String(count), 60);
    return count <= max;
  };
  return bump('rl:all', RATE_LIMIT.globalPerMinute) && bump('rl:' + studentId, RATE_LIMIT.perStudentPerMinute);
}
