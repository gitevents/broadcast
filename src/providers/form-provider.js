import { chromium } from 'playwright'
import { writeFile, mkdir } from 'fs/promises'
import { BaseProvider } from './base-provider.js'

/**
 * Base class for form-based providers (Meetup, Luma)
 * Provides Playwright automation utilities and error handling
 */
export class FormProvider extends BaseProvider {
  /**
   * Create event by automating form submission
   * @returns {Promise<Object>} Result with eventId and url
   */
  async create() {
    const browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false'
    })

    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await this.authenticate(page)
      await this.navigateToCreateForm(page)
      await this.fillForm(page)
      const result = await this.submitForm(page)
      await this.verify(page, result)
      return result
    } catch (error) {
      await this.captureDebugArtifacts(page, error)
      throw error
    } finally {
      await browser.close()
    }
  }

  /**
   * Update event by automating form editing
   * @param {string} eventId - Provider's event ID
   * @returns {Promise<Object>} Result with updated eventId and url
   */
  async update(eventId) {
    const browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false'
    })

    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await this.authenticate(page)
      await this.navigateToEditForm(page, eventId)
      await this.fillForm(page)
      const result = await this.submitForm(page)
      return result
    } catch (error) {
      await this.captureDebugArtifacts(page, error)
      throw error
    } finally {
      await browser.close()
    }
  }

  /**
   * Authenticate with the provider
   * Must be implemented by subclasses
   * @param {Page} page - Playwright page object
   * @returns {Promise<void>}
   * @throws {Error} If not implemented by subclass
   */
  async authenticate(page) {
    throw new Error(
      `${this.constructor.name}: authenticate() must be implemented`
    )
  }

  /**
   * Navigate to the event creation form
   * Must be implemented by subclasses
   * @param {Page} page - Playwright page object
   * @returns {Promise<void>}
   * @throws {Error} If not implemented by subclass
   */
  async navigateToCreateForm(page) {
    throw new Error(
      `${this.constructor.name}: navigateToCreateForm() must be implemented`
    )
  }

  /**
   * Navigate to the event edit form
   * @param {Page} page - Playwright page object
   * @param {string} eventId - Provider's event ID
   * @returns {Promise<void>}
   * @throws {Error} If not implemented by subclass
   */
  async navigateToEditForm(page, eventId) {
    throw new Error(
      `${this.constructor.name}: navigateToEditForm() must be implemented`
    )
  }

  /**
   * Fill the event form with data
   * Must be implemented by subclasses
   * @param {Page} page - Playwright page object
   * @returns {Promise<void>}
   * @throws {Error} If not implemented by subclass
   */
  async fillForm(page) {
    throw new Error(`${this.constructor.name}: fillForm() must be implemented`)
  }

  /**
   * Submit the form and extract result
   * Must be implemented by subclasses
   * @param {Page} page - Playwright page object
   * @returns {Promise<Object>} Result with eventId and url
   * @throws {Error} If not implemented by subclass
   */
  async submitForm(page) {
    throw new Error(
      `${this.constructor.name}: submitForm() must be implemented`
    )
  }

  /**
   * Capture debug artifacts (screenshots, HTML) on error
   * @param {Page} page - Playwright page object
   * @param {Error} error - The error that occurred
   * @returns {Promise<void>}
   */
  async captureDebugArtifacts(page, error) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const dir = 'playwright-screenshots'

      // Create directory if it doesn't exist
      await mkdir(dir, { recursive: true })

      // Capture screenshot
      const screenshotPath = `${dir}/error-${timestamp}.png`
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      })

      // Capture HTML
      const html = await page.content()
      const htmlPath = `${dir}/error-${timestamp}.html`
      await writeFile(htmlPath, html)

      console.error(`Debug artifacts captured: ${screenshotPath}, ${htmlPath}`)
      console.error(`Error: ${error.message}`)
    } catch (captureError) {
      console.error('Failed to capture debug artifacts:', captureError)
    }
  }
}

/**
 * Helper function to fill a form field with fallback selectors
 * Tries multiple selectors until one succeeds
 * @param {Page} page - Playwright page object
 * @param {Array<string>} selectors - Array of CSS selectors to try
 * @param {string} value - Value to fill
 * @returns {Promise<boolean>} True if successful
 * @throws {Error} If no selector works
 */
export async function fillFieldWithFallback(page, selectors, value) {
  for (const selector of selectors) {
    try {
      await page.locator(selector).first().fill(value, { timeout: 3000 })
      return true
    } catch (e) {
      // Try next selector
      continue
    }
  }

  throw new Error(
    `Could not find field with any of these selectors: ${selectors.join(', ')}`
  )
}
