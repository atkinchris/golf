# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Dice Golf to `https://atkinchris.github.io/golf/` via GitHub Actions on every push to `main`.

**Architecture:** Two changes are needed - a one-line Vite config update to set the asset base path, and a new GitHub Actions workflow file with separate build and deploy jobs using GitHub's official Pages Actions.

**Tech Stack:** Vite 6, GitHub Actions, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`

---

## File Map

- Modify: `vite.config.ts` - add `base: '/golf/'`
- Create: `.github/workflows/deploy.yml` - the CI/CD workflow

---

### Task 1: Set Vite base path

**Files:**
- Modify: `vite.config.ts`

Current content of `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
  },
});
```

- [ ] **Step 1: Add `base` to the Vite config**

Replace `vite.config.ts` with:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/golf/",
  plugins: [react()],
  test: {
    globals: true,
  },
});
```

- [ ] **Step 2: Run the build to verify it succeeds**

```sh
npm run build
```

Expected: exits 0, produces `dist/` directory.

- [ ] **Step 3: Verify asset paths in the built output**

```sh
grep -c '/golf/assets/' dist/index.html
```

Expected: a number greater than 0. Vite emits `/golf/` on both `src=` (JS) and
`href=` (CSS) attributes, so this pattern matches either. If the count is 0,
open `dist/index.html` and confirm asset paths manually.

- [ ] **Step 4: Verify tests still pass**

```sh
npm test
```

Expected: all tests pass, no failures.

- [ ] **Step 5: Commit**

```sh
git add vite.config.ts
git commit -m "Set Vite base path for GitHub Pages"
```

---

### Task 2: Create the GitHub Actions workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the `.github/workflows/` directory**

```sh
mkdir -p .github/workflows
```

- [ ] **Step 2: Write the workflow file**

Create `.github/workflows/deploy.yml` with:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 3: Run lint to verify no issues**

```sh
npm run lint
```

Expected: exits 0. (Biome does not check YAML files, so the new workflow file
will not affect the lint result.)

- [ ] **Step 4: Commit**

```sh
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow to deploy to GitHub Pages"
```

---

### Task 3: Enable GitHub Pages in repository settings (manual)

This step cannot be automated - it must be done in the GitHub web UI.

- [ ] **Step 1: Open repository settings**

Navigate to `https://github.com/atkinchris/golf/settings/pages`

- [ ] **Step 2: Set the source to GitHub Actions**

Under "Build and deployment" -> "Source", select "GitHub Actions".

Save the setting.

- [ ] **Step 3: Verify the workflow runs**

Push any commit to `main` (or the commit from Task 2 above may already
trigger it). Visit:

`https://github.com/atkinchris/golf/actions`

Expected: the "Deploy to GitHub Pages" workflow appears and both the `build`
and `deploy` jobs complete successfully. The deployment URL
`https://atkinchris.github.io/golf/` should serve the game.
