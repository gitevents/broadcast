// Main entry point for GitEvents Broadcast
// Exports all modules for use in GitHub Actions workflows

// Data fetching
export { fetchEventData } from './fetcher.js'

// Lifecycle management
export {
  detectLifecycle,
  storeProviderEventIds,
  extractProviderEventIds,
  getProviderEventId,
  setProviderEventId
} from './lifecycle.js'

// Data transformation
export {
  transformForDiscord,
  transformForBluesky,
  transformForMailchimp,
  transformForMeetup,
  transformForLuma
} from './transformer.js'

// Provider base classes
export { BaseProvider } from './providers/base-provider.js'
export { ApiProvider } from './providers/api-provider.js'
export {
  FormProvider,
  fillFieldWithFallback
} from './providers/form-provider.js'

// Provider implementations
export { DiscordProvider } from './providers/discord.js'
export { BlueskyProvider } from './providers/bluesky.js'
export { MailchimpProvider } from './providers/mailchimp.js'
export { MeetupProvider } from './providers/meetup.js'
export { LumaProvider } from './providers/luma.js'
