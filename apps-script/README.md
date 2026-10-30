# Student portal + submissions

Students log in on the website with a **personal student code** (like `KQM-4827`). The code is their identity:

- **My work** (`/portal`): progress tracker, everything they've turned in, and your feedback.
- **Submit** (`/submit`): their name is filled in automatically. The code goes to the **private** repo:

```
submissions/
├── week-01/
│   ├── amina-khan/main.py
│   └── yusuf-ali/main.py
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

## Updating the script

The code lives in this folder (`Code.gs`, `Roster.gs`, `Sheets.gs`, `Submissions.gs`, `GitHub.gs`).

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

## Good to know

- The token never reaches students. It lives only in Script Properties.
- 30 wrong codes in 10 minutes pauses logins for everyone for 10 minutes, which makes codes impractical to guess.
- Each student can submit up to 4 times per minute.
- Don't run submitted code on a computer logged into your GitHub or Google account. Use a browser sandbox.
