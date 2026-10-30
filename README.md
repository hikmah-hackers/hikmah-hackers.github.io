# Hikmah Hackers website

The class website: lessons, assignments, submissions, news, showcase, and a Chromebook guide.
Built with [Astro](https://astro.build) as plain static HTML (tiny JS, fast on school Chromebooks), hosted free on GitHub Pages.

## Weekly routine (no coding needed)

1. **Add the lesson**: copy `src/content/lessons/week-01.md` to `week-NN.md` and edit it. Set `date:` to that Friday.
   It stays hidden on the live site until that date (the site rebuilds itself every morning).
2. **Post news (optional)**: add a file in `src/content/announcements/`.
3. **Feature a project (optional)**: add a file in `src/content/showcase/` (first names only).
4. Commit and push. GitHub publishes it in about a minute.

Lesson front-matter fields: `week`, `title`, `date`, `unit`, `summary`, `objectives`, `slides` (link to the deck), and an optional `assignment` with `title`, `due`, `summary`, `required`, `bonus`.

> **Heads-up:** GitHub pauses scheduled workflows after 60 days with no commits. Pushing a lesson each week keeps it running. After a long break (e.g. summer), go to **Actions → Deploy site → Enable workflow / Run workflow**.

## Run it on your computer

```bash
npm install
npm run dev      # http://localhost:4321, shows future lessons and draft showcase items as previews
npm run build    # what GitHub builds
```

## Settings

`src/site.ts`: class day/time, editor links, contact email, and `submitEndpoint` (the Apps Script URL).

## First-time setup

1. Create the GitHub org **hikmah-hackers** and a public repo named **`hikmah-hackers.github.io`**. Push this `website/` folder's contents to it.
2. Repo → **Settings → Pages → Source: GitHub Actions**. The workflow in `.github/workflows/deploy.yml` does the rest.
3. Set up submissions: follow [`apps-script/README.md`](apps-script/README.md).

## Structure

```
src/
  content/       lessons, announcements, showcase (Markdown)
  pages/         one file per page; assignments.json feeds the Apps Script
  components/    Header, Hero, cards, etc.
  lib/           dates, content queries, submission validation rules
  scripts/       submit form (the only meaningful client JS)
  styles/        design tokens + global styles
apps-script/     Code.gs: the submission → GitHub bridge
```
