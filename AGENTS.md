# AGENTS.md

Static Astro site (WinSetup) that recreates a Windows XP desktop and serves the PowerShell + winget install scripts it advertises. Deployed to GitHub Pages on push to `main`.

## Commands (pnpm, Node >=22.13)

- `pnpm dev` — dev server
- `pnpm check` — typecheck (`astro check`)
- `pnpm build` — static build to `dist/`
- `pnpm preview` — preview the build
- No linter, formatter, or tests in this repo.

## Architecture

- Every page is a thin `src/pages/{index,uso,listas,about,privacy}.astro` (plus a `/es/` mirror) that only passes `title`/`description`/`current` props to `src/layouts/Desktop.astro`.
- `Desktop.astro` always renders ALL windows (`src/components/windows/*.astro`) into the HTML; `src/scripts/desktop.js` shows/hides and manages them. No AJAX — don't fetch windows at runtime.
- `src/data/lists.js` and `src/i18n/index.mjs` are build-time JS, used by the layout and window components via `Astro.currentLocale` (default `en` with no path prefix; Spanish is `/es/`).
- All i18n strings live only in `src/i18n/index.mjs` (`uiFor(lang)`).

## The generated scripts (important)

- `scripts/packagelists/*.txt` and `scripts/template.ps1` are the source of truth.
- `src/integrations/win-scripts.mjs` regenerates `public/<name>.ps1` (from the template, replacing `{{LIST_NAME}}`) and copies lists to `public/packagelists/` at dev/build start.
- `public/*.ps1` and `public/packagelists/` are gitignored — never edit them; edit `scripts/`.
- Adding a list needs two things: the `.txt` in `scripts/packagelists/` AND an entry in the `metadata` array of `src/data/lists.js` (name + es/en description). Without the metadata the list never appears on the site, though its `.ps1` is still generated.
- `.txt` format: one winget ID per line (`Publisher.Package`); lines starting with `#` are comments.

## Gotchas

- `astro.config.mjs` pins `vite.build.cssMinify: "esbuild"` — switching to lightningcss breaks the build on an XP.css selector.
- `Desktop.astro` injects a Cloudflare Analytics beacon and a client-side redirect (en pages only) to `/es/` based on `localStorage`/`navigator.language` — expect localhost to sometimes redirect when the browser is Spanish.
- `pnpm-workspace.yaml` must keep the esbuild build permission (`onlyBuiltDependencies`/`allowBuilds`); removing it makes `pnpm install` fail in CI.
- Deploy: `.github/workflows/deploy.yml` builds with `withastro/action` on push to `main`; `public/CNAME` pins the custom domain `winsetup.jlerga.dev`.
