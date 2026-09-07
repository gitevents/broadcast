# GitEvents Broadcast

<p align="center">
  <img src="assets/gitevents-flow.png">
</p>

Broadcast your community events to multiple platforms automatically using GitHub Actions. GitEvents Broadcast provides reusable workflows that announce events on Discord, Bluesky, Mailchimp, Meetup, and Luma.

## How it works

1. Create a new Issue with the Event Form in your events repository
2. Label the issue as "Approved" to trigger broadcasts
3. Let the automation create events across all configured platforms
4. Edit the issue to update events, or add "Cancelled" label to cancel

## Features

- **Multi-Platform Broadcasting**: Announce events on Discord, Bluesky, Mailchimp, Meetup, and Luma
- **Lifecycle Management**: Automatically handles create, update, and cancel operations
- **Cross-Repo Talks**: Fetch talk details from a separate talks repository
- **Rich Event Data**: Includes speaker information, talk descriptions, and schedules
- **Flexible Configuration**: Choose which platforms to broadcast to

## Supported Platforms

| Platform  | Status         | Type | Features                              |
| --------- | -------------- | ---- | ------------------------------------- |
| Discord   | ✅ Production  | API  | Scheduled events with location        |
| Bluesky   | ✅ Production  | API  | Social media posts with talk listings |
| Mailchimp | ⚠️ Placeholder | API  | Email campaigns (coming soon)         |
| Meetup    | ⚠️ Placeholder | Form | Event creation (coming soon)          |
| Luma      | ⚠️ Placeholder | Form | Event creation (coming soon)          |

## Quick Start

### Unified Workflow (Recommended)

Use the single unified workflow to broadcast to multiple platforms:

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
      # Enable providers
      enable_discord: true
      enable_bluesky: true
      enable_mailchimp: false
      enable_meetup: false
      enable_luma: false

      # Discord config (required if enable_discord: true)
      discord-server-id: 'YOUR_DISCORD_SERVER_ID'
      discord-time-zone: 'Europe/Nicosia'

      # Optional: cross-repo talks
      talks-repo: 'myorg/talks'

    secrets:
      # GitHub auth (always needed)
      GH_PAT: ${{ secrets.GH_PAT }}

      # Provider-specific secrets (only needed if provider enabled)
      BSKY_IDENTIFIER: ${{ secrets.BSKY_IDENTIFIER }}
      BSKY_PASSWORD: ${{ secrets.BSKY_PASSWORD }}
      MAILCHIMP_API_KEY: ${{ secrets.MAILCHIMP_API_KEY }}
```

**Benefits:**

- Single workflow file to maintain
- Enable/disable providers with boolean flags
- Missing credentials skip provider (no workflow failure)
- All providers run in parallel

---

### Provider-Specific Workflows (Legacy)

> **⚠️ Deprecated:** These individual workflows are maintained for backward compatibility but will be removed in v2.0.0. Please migrate to the unified workflow above.

### 1. Discord Events

> **⚠️ Deprecated:** Use the unified workflow above. This approach is maintained for backward compatibility only.

Add the Discord Bot and create a workflow in your events repository:

```yaml
# .github/workflows/broadcast-events.yml
name: Broadcast Events

on:
  issues:
    types: [labeled, edited]

jobs:
  discord:
    if: contains(github.event.issue.labels.*.name, 'Approved')
    uses: gitevents/broadcast/.github/workflows/discord-event.yml@main
    with:
      server-id: 'YOUR_DISCORD_SERVER_ID'
      time-zone: 'Europe/Nicosia'
      talks-repo: 'myorg/talks' # Optional: if talks are in separate repo
    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}
```

**Setup:**

1. [Add the Discord Bot to your Server](https://discord.com/api/oauth2/authorize?client_id=989117237619208233&scope=bot&permissions=8589953024)
2. Get your Server/Guild ID (enable Developer Mode → Right-click server → Copy ID)
3. Add the workflow above to your repository
4. Configure your server-id and time-zone

### 2. Bluesky Posts

> **⚠️ Deprecated:** Use the unified workflow above. This approach is maintained for backward compatibility only.

Announce events on Bluesky with rich talk information:

```yaml
jobs:
  bluesky:
    if: contains(github.event.issue.labels.*.name, 'Approved')
    uses: gitevents/broadcast/.github/workflows/bluesky-event.yml@main
    with:
      talks-repo: 'myorg/talks' # Optional
    secrets:
      BSKY_IDENTIFIER: ${{ secrets.BSKY_IDENTIFIER }}
      BSKY_PASSWORD: ${{ secrets.BSKY_PASSWORD }}
      GH_PAT: ${{ secrets.GH_PAT }}
```

### 3. Multi-Platform Broadcasting

The unified workflow broadcasts to multiple platforms automatically:

```yaml
jobs:
  broadcast:
    uses: gitevents/broadcast/.github/workflows/broadcast.yml@v1
    with:
      enable_discord: true
      enable_bluesky: true
      enable_mailchimp: true
      # ... configure each enabled provider
```

**Runtime Behavior:**

- Missing credentials skip provider (no failure)
- Individual status comments per provider:
  - ✅ Event created on Discord
  - ✅ Event posted on Bluesky
  - ⚠️ Skipped Mailchimp: Missing required config: MAILCHIMP_API_KEY

See [examples/events-repo-workflow.yml](examples/events-repo-workflow.yml) for a complete example.

## Lifecycle Management

The broadcast system automatically detects the appropriate action based on issue labels and events:

| Trigger                                           | Action     | Result                                                        |
| ------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| "Approved" label added                            | **Create** | Creates events on all platforms, adds "Event Created ✓" label |
| Issue edited (has "Approved" + "Event Created ✓") | **Update** | Updates events on all platforms                               |
| "Cancelled" label added                           | **Cancel** | Cancels events on all platforms                               |

### Status Comments

The workflows automatically comment on issues with status updates:

- ✅ Event created on Discord
- ✅ Event posted on Bluesky
- ❌ Event creation failed on Meetup

## Cross-Repo Talk Fetching

If your talks are in a separate repository, the broadcast system can fetch them automatically:

```yaml
with:
  talks-repo: 'myorg/talks' # Format: owner/repo
```

This allows you to:

- Link talk issues as sub-issues to event issues
- Automatically fetch speaker information
- Include talk details in event descriptions
- Keep events and talks organized separately

## Configuration

### Discord

Required inputs:

- `server-id`: Your Discord server/guild ID
- `time-zone`: Event timezone (e.g., 'Europe/Nicosia', 'America/New_York')

Optional inputs:

- `talks-repo`: Cross-repo talks repository

Required secrets:

- `GH_PAT`: GitHub Personal Access Token (or use GitHub App auth)

### Bluesky

Required secrets:

- `BSKY_IDENTIFIER`: Your Bluesky handle or email
- `BSKY_PASSWORD`: Your Bluesky password or app password
- `GH_PAT`: GitHub Personal Access Token

Optional inputs:

- `talks-repo`: Cross-repo talks repository

### Mailchimp (Coming Soon)

Required inputs:

- `list-id`: Mailchimp audience/list ID

Required secrets:

- `MAILCHIMP_API_KEY`: Mailchimp API key
- `GH_PAT`: GitHub Personal Access Token

### Meetup (Coming Soon)

Required inputs:

- `group-urlname`: Meetup group URL name

Required secrets:

- `MEETUP_EMAIL`: Meetup account email
- `MEETUP_PASSWORD`: Meetup account password
- `GH_PAT`: GitHub Personal Access Token

### Luma (Coming Soon)

Required secrets:

- `LUMA_EMAIL`: Luma account email
- `LUMA_PASSWORD`: Luma account password
- `GH_PAT`: GitHub Personal Access Token

## Authentication

### GitHub Authentication

The broadcast workflows need to fetch event data from your repository. You can use either:

**Option 1: Personal Access Token (PAT)**

```yaml
secrets:
  GH_PAT: ${{ secrets.GH_PAT }}
```

**Option 2: GitHub App** (recommended for organizations)

```yaml
secrets:
  GH_APP_ID: ${{ secrets.GH_APP_ID }}
  GH_APP_PRIVATE_KEY: ${{ secrets.GH_APP_PRIVATE_KEY }}
  GH_APP_INSTALLATION_ID: ${{ secrets.GH_APP_INSTALLATION_ID }}
```

`GH_APP_PRIVATE_KEY` must be base64-encoded PKCS8. The workflow passes it to
`@gitevents/fetch` as `GH_PRIVATE_KEY`.

### Provider Authentication

Each provider requires its own credentials. Store these as repository secrets:

- Discord: Uses OIDC authentication (no secrets needed)
- Bluesky: `BSKY_IDENTIFIER` and `BSKY_PASSWORD`
- Mailchimp: `MAILCHIMP_API_KEY`
- Meetup: `MEETUP_EMAIL` and `MEETUP_PASSWORD`
- Luma: `LUMA_EMAIL` and `LUMA_PASSWORD`

## Architecture

The broadcast system consists of:

1. **Reusable Workflows** (`.github/workflows/*.yml`): GitHub Actions workflows that other repos can call
2. **Data Fetcher** (`src/fetcher.js`): Fetches event and talk data using @gitevents/fetch
3. **Lifecycle Manager** (`src/lifecycle.js`): Detects create/update/cancel operations
4. **Transformers** (`src/transformer.js`): Converts event data to provider-specific formats
5. **Provider Classes** (`src/providers/*.js`): Implementation for each platform

### Data Flow

```
GitHub Issue Event (labeled/edited)
  ↓
Reusable Workflow Triggered
  ↓
Detect Lifecycle (create/update/cancel)
  ↓
Fetch Event Data (including cross-repo talks)
  ↓
Transform Data (provider-specific format)
  ↓
Provider Handler (API call or form automation)
  ↓
Update Issue (comment + label)
```

## Development

### Adding a New Provider

1. Create provider class in `src/providers/your-provider.js`:
   - Extend `ApiProvider` for API-based providers
   - Extend `FormProvider` for form-based providers

2. Add transformer in `src/transformer.js`:

   ```javascript
   export async function transformForYourProvider(eventData) {
     // Convert to provider format
   }
   ```

3. Create workflow in `.github/workflows/your-provider-event.yml`

4. Export provider in `src/index.js`

5. Update README with configuration details

### Building

```bash
npm ci
npm run build
```

This creates a bundled `dist/index.js` for use in workflows.

### Testing

```bash
npm test
npm run lint
```

## Examples

- [events-repo-workflow.yml](examples/events-repo-workflow.yml): Complete example for events repository
- [talks-repo-workflow.yml](examples/talks-repo-workflow.yml): Example for talks repository announcements

## Migration Guide

### From Provider-Specific Workflows

If you're using individual provider workflows (`discord-event.yml`, `bluesky-event.yml`), migrate to the unified workflow:

**Before:**

```yaml
jobs:
  discord:
    uses: gitevents/broadcast/.github/workflows/discord-event.yml@main
    with:
      server-id: '855088264180400198'
      time-zone: 'Europe/Nicosia'
```

**After:**

```yaml
jobs:
  broadcast:
    uses: gitevents/broadcast/.github/workflows/broadcast.yml@v1
    with:
      enable_discord: true
      discord-server-id: '855088264180400198'
      discord-time-zone: 'Europe/Nicosia'
```

**Changes:**

1. Use `broadcast.yml` instead of provider-specific workflows
2. Add `enable_<provider>: true` for each provider
3. Update parameter names (e.g., `server-id` → `discord-server-id`)
4. Add `permissions: { id-token: write, issues: write }` to job

**Timeline:**

- v1.x: Both approaches supported (deprecated warnings in old workflows)
- v2.0.0 (6+ months): Provider-specific workflows removed

---

## Related Projects

- [gitevents/action](https://github.com/gitevents/action): Main GitEvents action for repository setup
- [gitevents/fetch](https://github.com/gitevents/fetch): Node.js library for fetching GitEvents data
- [gitevents/discord-bot](https://github.com/gitevents/discord-bot): Cloudflare Worker for Discord events

## License

Licensed under [MIT](./LICENSE).
