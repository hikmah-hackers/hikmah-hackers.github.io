# Submissions setup (one-time, ~15 minutes)

Students submit on the website → this Google Apps Script → a **private** GitHub repo:

```
submissions/
├── week-01/
│   ├── amina-khan/main.py
│   └── yusuf-ali/main.py
└── week-02/
    └── ...
```

Resubmitting overwrites the file (Git keeps every version). Work after the due date is accepted and marked `[LATE]` in the file header, the commit message, and the Sheet.

## 1. Create the private submissions repo

1. In the `hikmah-hackers` GitHub org, create a repo named **`submissions`** and set it to **Private**.
2. Check "Add a README" so it has a `main` branch.

## 2. Create a GitHub token (limited to that one repo)

1. GitHub → your avatar → **Settings → Developer settings → Fine-grained tokens → Generate new token**.
2. Resource owner: **hikmah-hackers**. Repository access: **Only select repositories → submissions**.
3. Permissions → Repository → **Contents: Read and write**. Nothing else.
4. Set an expiry (e.g. end of the school year) and copy the token.

## 3. Create the Apps Script

1. Go to <https://script.google.com> → **New project**, name it "Hikmah Hackers Submissions".
2. Paste all of `Code.gs` into the editor and save.
3. **Project Settings (gear) → Script Properties → Add**:

   | Property | Value |
   | --- | --- |
   | `GITHUB_TOKEN` | the token from step 2 |
   | `GITHUB_REPO` | `hikmah-hackers/submissions` |
   | `CLASS_PASSCODE` | a passcode you'll tell students in class (change it each term) |
   | `SITE_URL` | `https://hikmah-hackers.github.io` |
   | `SHEET_ID` | *(optional)* the id from a Google Sheet URL, for a submissions log |

4. Pick **`setupCheck`** in the function dropdown → **Run** → approve permissions. The log should say `OK`.

## 4. Deploy it as a web app

1. **Deploy → New deployment → type: Web app**.
2. Execute as: **Me**. Who has access: **Anyone**. (Students have no Google login on this form, and the passcode protects it.)
3. Copy the **Web app URL** (ends in `/exec`).
4. Paste it into `website/src/site.ts` as `submitEndpoint`, then commit and push.

> When you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Good to know

- The token never reaches students. It lives only in Script Properties.
- Change `CLASS_PASSCODE` anytime. No redeploy needed.
- Rate limits: 3 submissions per student per minute, 60 total per minute.
- To give feedback, open the file on GitHub and comment, or use the Sheet's Note column.
