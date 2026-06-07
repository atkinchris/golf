# GitHub Pages Deployment - Design

Date: 2026-06-07

## Goal

Deploy Dice Golf to GitHub Pages at `https://atkinchris.github.io/golf/` via a
GitHub Actions workflow that runs on every push to `main`.

## Approach

Use GitHub's official Pages deployment Actions (`actions/upload-pages-artifact`
and `actions/deploy-pages`), which integrate with GitHub's deployment
environment UI and require no third-party action dependencies.

## Changes Required

### `vite.config.ts`

Add `base: '/golf/'` to the Vite config. This prefixes all asset paths with
`/golf/`, which is required for the app to resolve correctly at the
`atkinchris.github.io/golf` sub-path.

Side effect: `npm run preview` locally serves from `/golf/`, so the local
preview URL becomes `http://localhost:4173/golf/`.

### `.github/workflows/deploy.yml`

New workflow file with two jobs:

**`build` job** - triggers on push to `main`:

1. `actions/checkout@v4`
2. `actions/setup-node@v4` with `node-version-file: '.nvmrc'` and `cache: npm`
3. `npm ci`
4. `npm run lint`
5. `npm test`
6. `npm run build`
7. `actions/upload-pages-artifact@v3` uploading `dist/`

**`deploy` job** - runs after `build`, attached to the `github-pages`
environment:

1. `actions/deploy-pages@v4`

**Workflow-level settings:**

- Permissions: `contents: read`, `pages: write`, `id-token: write`
- Concurrency group: `pages` with `cancel-in-progress: false` (prevents a
  queued deploy from being cancelled by a subsequent push mid-flight)

### GitHub repository settings (manual, one-time)

In the repository settings: Settings -> Pages -> Source -> set to
"GitHub Actions". This must be done before the first deployment will succeed.

## Deployment URL

`https://atkinchris.github.io/golf/`

## Constraints

- Deployments only trigger on push to `main` - no pull request deployments.
- A failed lint or test run blocks deployment.
- The `deploy` job only runs if `build` succeeds.
