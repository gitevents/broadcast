# Unified Broadcast Workflow Design

**Date:** 2026-01-30
**Status:** Approved
**Version:** 1.0

## Problem Statement

The current broadcast system has maintenance burden and consumer complexity:

- **Maintenance burden**: 5 separate workflow files with duplicated logic (lifecycle detection, event fetching, status comments)
- **Consumer complexity**: Users must configure matrix strategies or multiple workflow calls to broadcast to multiple providers

## Solution Overview

Create a single unified `broadcast.yml` reusable workflow with boolean provider flags. The workflow validates requirements at runtime and skips providers with missing credentials (no workflow failure).

## Consumer Experience

### Target Usage

```yaml
# .github/workflows/broadcast-events.yml
name: Broadcast Events

on:
  issues:
    types: [labeled, edited]

jobs:
  broadcast:
    if: |
      contains(github.event.issue.labels.*.name, 'Approved') ||
      contains(github.event.issue.labels.*.name, 'Cancelled')
    permissions:
      id-token: write
      issues: write
    uses: gitevents/broadcast/.github/workflows/broadcast.yml@v1
    with:
      # Enable/disable providers
      enable_discord: true
      enable_bluesky: true
      enable_mailchimp: false
      enable_meetup: false
      enable_luma: false

      # Discord config (only needed if enable_discord: true)
      discord-server-id: '855088264180400198'
      discord-time-zone: 'Europe/Nicosia'

      # Optional: cross-repo talks
      talks-repo: 'myorg/talks'

    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}

      # Provider-specific secrets (only needed if provider enabled)
      BSKY_IDENTIFIER: ${{ secrets.BSKY_IDENTIFIER }}
      BSKY_PASSWORD: ${{ secrets.BSKY_PASSWORD }}
      MAILCHIMP_API_KEY: ${{ secrets.MAILCHIMP_API_KEY }}
```

### Benefits

- **Single entry point**: One workflow file to maintain
- **Explicit controls**: Clear boolean flags for each provider
- **Graceful degradation**: Missing credentials skip provider, don't fail workflow
- **Parallel execution**: All enabled providers run simultaneously
- **Simple configuration**: No matrix strategies needed

## Architecture

### Workflow Structure

**File:** `.github/workflows/broadcast.yml`

```yaml
name: Broadcast Event

on:
  workflow_call:
    inputs:
      # Provider toggles (default: false)
      enable_discord:
        type: boolean
        default: false
      enable_bluesky:
        type: boolean
        default: false
      enable_mailchimp:
        type: boolean
        default: false
      enable_meetup:
        type: boolean
        default: false
      enable_luma:
        type: boolean
        default: false

      # Provider-specific config
      discord-server-id:
        type: string
        required: false
      discord-time-zone:
        type: string
        required: false

      # Shared config
      talks-repo:
        type: string
        required: false

    secrets:
      # GitHub auth
      GH_PAT:
        required: false
      GH_APP_ID:
        required: false
      GH_APP_PRIVATE_KEY:
        required: false
      GH_APP_INSTALLATION_ID:
        required: false

      # Provider secrets
      BSKY_IDENTIFIER:
        required: false
      BSKY_PASSWORD:
        required: false
      MAILCHIMP_API_KEY:
        required: false
      MEETUP_EMAIL:
        required: false
      MEETUP_PASSWORD:
        required: false
      LUMA_EMAIL:
        required: false
      LUMA_PASSWORD:
        required: false

jobs:
  broadcast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          repository: gitevents/broadcast

      - uses: actions/setup-node@v5
        with:
          node-version: 20

      - run: npm ci

      - name: Broadcast to enabled providers
        uses: actions/github-script@v7
        env:
          # All inputs and secrets as env vars
          ENABLE_DISCORD: ${{ inputs.enable_discord }}
          ENABLE_BLUESKY: ${{ inputs.enable_bluesky }}
          # ... etc
        with:
          script: |
            const { broadcastMulti } = require('./dist/index.js')
            const results = await broadcastMulti(context, {
              providers: {
                discord: process.env.ENABLE_DISCORD === 'true',
                bluesky: process.env.ENABLE_BLUESKY === 'true',
                mailchimp: process.env.ENABLE_MAILCHIMP === 'true',
                meetup: process.env.ENABLE_MEETUP === 'true',
                luma: process.env.ENABLE_LUMA === 'true'
              },
              config: { /* all provider configs */ }
            })

            // Post individual status comments
            for (const result of results) {
              const emoji = result.success ? '✅' : '⚠️'
              const message = result.success
                ? `Event ${result.action} on ${result.provider}`
                : `Skipped ${result.provider}: ${result.reason}`

              await github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `${emoji} ${message}`
              })
            }
```

### Runtime Validation Logic

**File:** `src/index.js` - New `broadcastMulti()` function

```javascript
export async function broadcastMulti(context, options) {
  const { providers, config } = options
  const results = []

  // Detect lifecycle (create/update/cancel)
  const lifecycle = detectLifecycle(context)
  if (lifecycle.type === 'none') {
    return [{ success: true, provider: 'all', reason: 'No action needed' }]
  }

  // Fetch event data once (shared across all providers)
  const eventData = await fetchEventData(context, {
    talksRepo: config.talksRepo || '',
    enrichSpeakers: false
  })

  // Process each enabled provider in parallel
  const providerPromises = []

  if (providers.discord) {
    providerPromises.push(
      executeProvider('discord', lifecycle, eventData, config).catch((err) => ({
        success: false,
        provider: 'Discord',
        reason: err.message
      }))
    )
  }

  if (providers.bluesky) {
    providerPromises.push(
      executeProvider('bluesky', lifecycle, eventData, config).catch((err) => ({
        success: false,
        provider: 'Bluesky',
        reason: err.message
      }))
    )
  }

  // ... other providers

  // Execute all in parallel, collect results
  const providerResults = await Promise.allSettled(providerPromises)

  return providerResults.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        success: false,
        provider: 'Unknown',
        reason: result.reason?.message || 'Unknown error'
      }
    }
  })
}

async function executeProvider(provider, lifecycle, eventData, config) {
  // Validate required config
  const validation = validateProviderConfig(provider, config)
  if (!validation.valid) {
    return {
      success: false,
      provider: capitalizeProvider(provider),
      reason: `Missing required config: ${validation.missing.join(', ')}`
    }
  }

  // Transform data
  const payload = await transformForProvider(provider, eventData, config)

  // Execute provider logic
  await dispatchToProvider(provider, lifecycle.type, payload, config)

  return {
    success: true,
    provider: capitalizeProvider(provider),
    action:
      lifecycle.type === 'create'
        ? 'created'
        : lifecycle.type === 'update'
          ? 'updated'
          : 'cancelled'
  }
}
```

### Validation Strategy

**Required Config per Provider:**

| Provider  | Required Inputs                          | Required Secrets                   |
| --------- | ---------------------------------------- | ---------------------------------- |
| Discord   | `discord-server-id`, `discord-time-zone` | None (OIDC)                        |
| Bluesky   | None                                     | `BSKY_IDENTIFIER`, `BSKY_PASSWORD` |
| Mailchimp | None                                     | `MAILCHIMP_API_KEY`                |
| Meetup    | None                                     | `MEETUP_EMAIL`, `MEETUP_PASSWORD`  |
| Luma      | None                                     | `LUMA_EMAIL`, `LUMA_PASSWORD`      |

**Validation Behavior:**

- Check if required config/secrets exist for enabled providers
- If missing: return `{ valid: false, missing: ['server-id'] }`
- Skip provider gracefully (no workflow failure)
- Post warning comment: `⚠️ Skipped Discord: Missing required config: server-id`

## Marketplace Publishing

### action.yml Updates

```yaml
name: 'GitEvents Broadcast'
description: 'Broadcast events to Discord, Bluesky, Mailchimp, Meetup, and Luma'
author: 'GitEvents'
branding:
  icon: 'radio'
  color: 'blue'

# Points consumers to the reusable workflow
runs:
  using: 'composite'
  steps:
    - run: echo "Use the reusable workflow at .github/workflows/broadcast.yml"
      shell: bash
```

### Semantic Versioning

```bash
# Release v1.0.0
git tag v1.0.0
git push origin v1.0.0

# Major version tag (auto-updates to latest v1.x)
git tag -f v1
git push -f origin v1
```

**Consumer version references:**

```yaml
# Specific version (pinned)
uses: gitevents/broadcast/.github/workflows/broadcast.yml@v1.0.0

# Auto-update to latest v1.x (recommended)
uses: gitevents/broadcast/.github/workflows/broadcast.yml@v1

# Latest (not recommended for production)
uses: gitevents/broadcast/.github/workflows/broadcast.yml@main
```

## Migration Strategy

### Phase 1: Add New Workflow (Non-Breaking)

- Create new `.github/workflows/broadcast.yml`
- Keep existing provider-specific workflows
- Both approaches work simultaneously
- Update README with both options

### Phase 2: Deprecation Notice

Add warnings to old workflows:

```yaml
- name: Deprecation notice
  run: |
    echo "⚠️ WARNING: This workflow is deprecated."
    echo "Please migrate to the unified broadcast.yml workflow."
    echo "See: https://github.com/gitevents/broadcast#migration"
```

Update documentation:

- Mark old approach as deprecated
- Add migration guide
- Provide examples

### Phase 3: Remove Old Workflows (Breaking Change)

- After 6+ months and v2.0.0 release
- Remove individual provider workflows
- Only unified `broadcast.yml` remains

### Example Migration

```diff
jobs:
-  discord:
+  broadcast:
     permissions:
       id-token: write
+      issues: write
-    if: contains(github.event.issue.labels.*.name, 'Approved')
-    uses: gitevents/broadcast/.github/workflows/discord-event.yml@main
+    uses: gitevents/broadcast/.github/workflows/broadcast.yml@v1
     with:
+      enable_discord: true
+      enable_bluesky: false
       discord-server-id: '855088264180400198'
       discord-time-zone: 'Europe/Nicosia'
```

## Implementation Checklist

### Core Changes

- [ ] Create new `.github/workflows/broadcast.yml` with all inputs/secrets
- [ ] Implement `broadcastMulti()` function in `src/index.js`
- [ ] Implement `executeProvider()` helper function
- [ ] Implement `validateProviderConfig()` validation logic
- [ ] Implement `transformForProvider()` data transformation
- [ ] Implement `dispatchToProvider()` provider dispatch logic

### Provider Validation

- [ ] Define required config per provider
- [ ] Implement validation for Discord (server-id, time-zone)
- [ ] Implement validation for Bluesky (identifier, password)
- [ ] Implement validation for Mailchimp (api-key)
- [ ] Implement validation for Meetup (email, password)
- [ ] Implement validation for Luma (email, password)

### Testing

- [ ] Test with Discord only enabled
- [ ] Test with multiple providers enabled
- [ ] Test with missing credentials (should skip provider)
- [ ] Test with all providers disabled (should exit early)
- [ ] Test lifecycle detection (create/update/cancel)
- [ ] Test parallel execution

### Documentation

- [ ] Update README with new unified workflow approach
- [ ] Add migration guide
- [ ] Update examples directory
- [ ] Add deprecation notices to old workflows
- [ ] Update BUILD.md if needed

### Publishing

- [ ] Update `action.yml` branding
- [ ] Create v1.0.0 release
- [ ] Create v1 major version tag
- [ ] Publish to GitHub Actions Marketplace
- [ ] Announce in discussions/social media

## Success Criteria

- ✅ Single workflow entry point (`broadcast.yml`)
- ✅ Boolean flags for provider enable/disable
- ✅ Runtime validation (skip missing providers)
- ✅ Parallel provider execution
- ✅ Individual status comments per provider
- ✅ Published to GitHub Actions Marketplace
- ✅ Semantic versioning with git tags
- ✅ Non-breaking migration path
- ✅ Backward compatibility maintained initially

## Future Enhancements

- Configuration validation in CI (lint workflow configs)
- Provider-specific retry logic
- Batched status comments (single comment with all providers)
- Provider execution order control
- Dry-run mode for testing
