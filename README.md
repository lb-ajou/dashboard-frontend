# dashboard-frontend

To install dependencies:

```bash
bun install
```

To start the Bun development server:

```bash
bun dev
```

To build static frontend assets:

```bash
bun run build
```

To build the release-ready static HTML bundle:

```bash
bun run build-html
```

If the frontend API origin differs from the default reverse proxy backend, set `BUN_PUBLIC_API_BASE_URL`.

## GitHub Actions release pipeline

One workflow is included under `.github/workflows`:

- `release-static.yml`: runs on every push to `main`, executes `bun run build-html`, and publishes `dist/index.html` to GitHub Releases.

Release naming:

- Release tag: `main-<short-sha>`
- Asset file: `index.html`

This keeps the pipeline automatic on `main` without separate version metadata management.
