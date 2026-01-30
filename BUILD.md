# Build Configuration

## ncc Configuration

The broadcast package uses `@vercel/ncc` to bundle the code for distribution in GitHub Actions workflows.

### External Dependencies

We configure ncc to **externalize** `@gitevents/fetch`:

```json
"prepare": "ncc build src/index.js -o dist --source-map --license licenses.txt --external @gitevents/fetch"
```

**Why externalize @gitevents/fetch?**

1. The fetch package contains `.gql` (GraphQL) files that ncc cannot parse
2. As a monorepo workspace dependency, it's available at runtime via npm ci
3. This keeps the bundle smaller and avoids GraphQL parsing issues

### Build Process

```bash
npm ci                  # Install dependencies (including @gitevents/fetch)
npm run prepare        # Build dist bundle with ncc
```

The `dist/index.js` bundle will:
- Include all other dependencies (date-fns, @zentered/issue-forms-body-parser, etc.)
- Import @gitevents/fetch as an external ES module
- Be used by GitHub Actions workflows via `require('./dist/...')`

### Runtime Requirements

The GitHub Actions workflows must:
1. Checkout the broadcast repository
2. Run `npm ci` to install dependencies (including @gitevents/fetch)
3. Load modules from `dist/` which will import @gitevents/fetch at runtime

This is already configured in all workflow files:

```yaml
- name: Checkout broadcast repo
  uses: actions/checkout@v4
  with:
    repository: gitevents/broadcast

- name: Setup Node.js
  uses: actions/setup-node@v4

- name: Install dependencies
  run: npm ci

- name: Use bundled code
  uses: actions/github-script@v7
  with:
    script: |
      const { fetchEventData } = require('./dist/fetcher.js')
```

## Troubleshooting

**If you see "Cannot find package '@gitevents/fetch'":**
- Ensure `npm ci` ran successfully before using bundled code
- Check that package.json has `"@gitevents/fetch": "workspace:*"`
- Verify the workflow checks out the gitevents/broadcast repository

**If you see GraphQL parse errors:**
- Ensure `--external @gitevents/fetch` is in the ncc build command
- Don't try to bundle .gql files with ncc
