/**
 * GitHub contents API: read and write files in the private submissions repo.
 */

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

function refQuery(config) {
  return '?ref=' + encodeURIComponent(config.branch);
}

function commitToGitHub(config, path, content, message) {
  var existing = githubRequest(config, 'get', contentsPath(config, path) + refQuery(config), null);
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

/** Returns the file's text, or null if it doesn't exist. */
function readFromGitHub(config, path) {
  var file = githubRequest(config, 'get', contentsPath(config, path) + refQuery(config), null);
  if (file.code === 404) return null;
  if (file.code !== 200 || !file.body || typeof file.body.content !== 'string') {
    throw new Error('GitHub read failed: HTTP ' + file.code);
  }
  var bytes = Utilities.base64Decode(file.body.content.replace(/\n/g, ''));
  return Utilities.newBlob(bytes).getDataAsString('UTF-8');
}
