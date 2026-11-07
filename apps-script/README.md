# Student portal + submissions

Students log in on the website with a **personal student code** (like `KQM-4827`). The code is their identity:

- **My work** (`/portal`): progress tracker, everything they've turned in, and your feedback.
- **Submit** (`/submit`): their name is filled in automatically. The code goes to the **private** repo:

```
submissions/
├── week-01/
│   ├── mohammad-khan/main.py
│   └── mohammad-ali/main.py
└── week-02/ ...
```

Resubmitting overwrites the file (Git keeps every version). Late work is accepted and marked `[LATE]`.

## The class Google Sheet

`setupCheck()` creates a sheet called **Hikmah Hackers: Class** in your Drive, with two tabs:

| Tab | What it's for |
| --- | --- |
| **Roster** | One row per student: `Code`, `First name`, `Last name`, `Grade`, `Active`. You type names; codes are generated for you. |
| **Submissions** | One row per submission (added automatically). Type in the **Feedback** column and students see it on their My work page. |

### Adding students

1. Type each student's **First name**, **Last name**, and **Grade** in the Roster tab (leave Code empty).
2. In the Apps Script editor, run **`generateStudentCodes`**. Every new student gets a unique code.
3. Give each student their code (a small card or slip of paper works well).

- **Lost code?** Delete it from the Code cell and run `generateStudentCodes` again for a new one.
- **Student left?** Set **Active** to `no`. Their code stops working, and their work is kept.
- The folder name comes from the roster name, so keep each student's name the same all year.

### Enrollment form → Roster → email (automatic)

The website's **Sign up** page (`/signup`) opens the enrollment form. Once connected, every new submission adds the student to the Roster (first name, last name, grade) with a student code already made, then **emails the code** to the parent/guardian email (and the student email, if given). The Roster's **Code emailed** column records when and to whom. A name that's already on the Roster gets no email (so nobody can get another student's code by re-entering their name): handle those by hand.

- **Families who enrolled before emails existed:** run **`sendMissingCodeEmails`** once. It emails everyone whose **Code emailed** cell is blank.
- The form's thank-you message tells families to check their email (set by `connectEnrollmentForm`).
- The form's public link (for `signupFormUrl` in `src/site.ts`) is at `<web app URL>?info=signup`. Names are tidied ("mohammad KHAN" → "Mohammad Khan"), "Grade 8" becomes `8`, and a student already on the Roster is never added twice.

1. Open the enrollment form's **edit** link. The id is the long part between `/d/` and `/edit`.
2. **Project Settings → Script Properties → Add:** `ENROLLMENT_FORM_ID` = that id.
3. In the editor, open **`Enrollment.gs`**, pick **`connectEnrollmentForm`**, and click **Run** (approve the new permissions). It imports everyone who already enrolled and listens for new ones.

The script's Google account (faiyajr@umich.edu) must be able to **edit** the form. If a different account owns it, share the form with that address first (form ⋮ → Add collaborators).

## Teacher admin page (`/admin`)

Set the Script Property **`ADMIN_CODE`** to a long passphrase (12+ characters) that only you know. Log in at `/admin` with it to see every student and their code, every submission, open anyone's code, and write feedback (it goes in the Submissions tab's **Feedback** column, so students see it on My work). Student codes can't use any admin action. The admin code is kept only in that browser tab and is forgotten when the tab closes. Change `ADMIN_CODE` any time to lock out old logins.

## Updating the script

The code lives in this folder (`Code.gs`, `Admin.gs`, `Roster.gs`, `Sheets.gs`, `Submissions.gs`, `GitHub.gs`, `Enrollment.gs`).

```bash
cd apps-script
npx @google/clasp push --force
npx @google/clasp create-deployment -i AKfycbzGIs69fC0v49TkUaxtnmr1uD2Veb_MrJjdvuqr3HNWgNMNsI_LzjdhRxxnrDI24qJb --description "what changed"
```

Always redeploy with `-i <that id>` so the URL in `src/site.ts` keeps working.

## Script Properties (Project Settings)

| Property | Value |
| --- | --- |
| `GITHUB_TOKEN` | fine-grained token: Contents read & write on `hikmah-hackers/submissions` only |
| `GITHUB_REPO` | `hikmah-hackers/submissions` |
| `SITE_URL` | `https://hikmah-hackers.github.io` |
| `SHEET_ID` | set automatically by `setupCheck()` |
| `ENROLLMENT_FORM_ID` | the enrollment form's id (see above) |
| `ADMIN_CODE` | your admin passphrase for `/admin` (12+ characters) |

## Good to know

- The token never reaches students. It lives only in Script Properties.
- 30 wrong codes in 10 minutes pauses logins for everyone for 10 minutes, which makes codes impractical to guess.
- Each student can submit up to 4 times per minute.
- Don't run submitted code on a computer logged into your GitHub or Google account. Use a browser sandbox.
