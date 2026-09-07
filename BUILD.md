# Build Configuration

## ncc Configuration

The broadcast package uses `@vercel/ncc` to bundle the code for distribution in
GitHub Actions workflows. `npm run prepare` produces two bundles:

```json
"build:lib": "ncc build src/index.js -o dist ... --external playwright",
"build:action": "ncc build src/action.js -o dist/action ... --external playwright"
```

- `dist/index.js` is the library bundle the reusable workflows load.
- `dist/action/index.js` is the entrypoint for `action.yml`. `src/index.js` is a
  side-effect-free export barrel, so it cannot serve as `runs.main`: it would
  make the action a silently passing no-op.

### Bundled vs external

`@gitevents/fetch` is **bundled**. The action runs without a `node_modules`
directory, so anything left external would fail to resolve there.

`playwright` is **external** and is not referenced by either bundle. It is a
~5MB optional dependency needed only by the form-based providers. Two things
keep it out:

1. `src/providers/form-provider.js` imports it with a dynamic
   `await import('playwright')` inside the methods that use it.
2. `src/index.js` does not re-export `FormProvider`, `MeetupProvider` or
   `LumaProvider`. Re-exporting them makes the bundler hoist the dynamic import
   into a static top-level `import "playwright"`, which then fails to load
   anywhere playwright is not installed.

Import those providers directly from their modules when implementing them.

### Module format

The root `package.json` sets `"type": "module"`, so ncc emits ES modules.
`scripts/write-dist-package-json.js` writes a `package.json` into each output
directory recording the detected format. This also overwrites the `package.json`
ncc copies in as an asset when it bundles a dependency that ships one.

Because the bundles are ES modules, workflows load them with `import()` rather
than `require()`. `require()` of an ES module only works on Node 20.19 and
later, and the runner's exact Node 20 patch version is not guaranteed:

```yaml
- name: Use bundled code
  uses: actions/github-script@v7
  with:
    script: |
      const { pathToFileURL } = require('node:url')
      const { fetchEventData } = await import(
        pathToFileURL(`${process.env.GITHUB_WORKSPACE}/dist/index.js`).href
      )
```

There is one bundle, so there is no `dist/lifecycle.js`, `dist/fetcher.js` or
`dist/transformer.js`. Destructure everything from `dist/index.js`.

### Build Process

```bash
npm ci                 # Install dependencies
npm run prepare        # Build both bundles with ncc
```

### Runtime Requirements

The GitHub Actions workflows must:

1. Check out the broadcast repository, pinned with
   `ref: ${{ github.job_workflow_sha }}` so a caller pinning a tag gets that
   tag's `dist/` rather than the default branch's
2. Run `npm ci`
3. Load `dist/index.js` with `import()`

## Troubleshooting

**If you see "Cannot find package '@gitevents/fetch'":**

- Ensure `npm ci` ran successfully
- `@gitevents/fetch` is not published to npm. It is pinned as a git dependency
  on a specific commit of `gitevents/fetch`. Bump that SHA to take a new version

**If you see `ERR_REQUIRE_ESM`:**

- The bundle is an ES module. Load it with `import()`, not `require()`

**If `dist/index.js` suddenly grows by several MB:**

- Something re-exported a playwright-dependent provider from `src/index.js`.
  Check for a static `import "playwright"` at the top of the bundle
