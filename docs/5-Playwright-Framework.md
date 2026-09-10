# Playwright Framework Guide

This guide covers the core Playwright APIs used in this project, with examples and patterns from the actual test code.

## Playwright Essentials

### What is Playwright?

Playwright is a **browser automation framework** that:
- Controls Chrome, Firefox, Safari (and Chromium/WebKit variants)
- Provides APIs for interacting with web pages
- Includes a test runner (`@playwright/test`)
- Offers debugging tools (Inspector, traces)

### Key Exports from @playwright/test

```typescript
import { 
  test,              // Test runner function
  expect,            // Assertion library
  Page,              // Browser tab abstraction
  Locator,           // Element query object
  FrameLocator,      // Iframe query object
  devices,           // Pre-configured device profiles
  defineConfig,      // Config builder
} from '@playwright/test';
```

## The Test Function

### Basic Structure

```typescript
import { test, expect } from '@playwright/test';

test('descriptive test name', async ({ page }) => {
  // Test logic here
});
```

**How it works:**
1. `test()` registers a test
2. `async` allows waiting for browser actions
3. `{ page }` is the default fixture (injected browser tab)
4. Test completes when the function returns

### Example from Project

```typescript
test('interacts with iframe 1', async ({ playLab }) => {
  // playLab is custom fixture (see fixtures/test.ts)
  await playLab.openFrames();
  
  const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
  await expect(frame.locator('[data-testid="iframe1-heading"]'))
    .toHaveText('I am iFrame 1');
});
```

## The Page Object

### What is Page?

The `Page` object represents a browser tab. It provides:
- **Navigation:** `goto()`, `reload()`, `goBack()`
- **Interaction:** `click()`, `fill()`, `select()`
- **Querying:** `locator()`, `frameLocator()`, `waitForNavigation()`
- **Inspection:** `textContent()`, `getAttribute()`, `url()`

### Example Usage

```typescript
// From playlab-home.ts
export class PlayLabHome {
  constructor(page: Page) {
    this.page = page;
  }

  async openFrames(): Promise<void> {
    await this.page.goto('iframe.php');
  }

  async openWindows(): Promise<void> {
    await this.page.goto('window-popup-modal.php');
  }
}
```

**Key methods used:**
- `page.goto(url)` – Navigate to a page
- `page.locator(selector)` – Find an element
- `page.frameLocator(selector)` – Find an iframe

## The Locator API

### What is Locator?

A `Locator` represents a query for one or more elements on a page. Key feature: **Web-first semantics** (automatic waits).

### Basic Locators

```typescript
// From playlab-home.ts
readonly iframe1: Locator = page.locator('[data-testid="iframe-frame-1"]');
readonly successModalButton: Locator = page.locator('[data-testid="modal-open-success-btn"]');
readonly successModal: Locator = page.locator('[data-testid="modal-success"]');
```

### Locator Selectors

#### data-testid (Recommended)

```typescript
page.locator('[data-testid="my-element"]')
```

**Why:** Stable, semantic, automation-focused

#### CSS Selectors

```typescript
page.locator('button.primary')
page.locator('#submit-btn')
page.locator('div > span')
```

**⚠️ Warning:** Brittle to CSS changes

#### XPath

```typescript
page.locator('//button[text()="Submit"]')
```

**⚠️ Warning:** Slow and brittle, avoid if possible

#### Combining Selectors

```typescript
page.locator('[data-testid="form"] >> [data-testid="input"]')
```

The `>>` operator chains selectors.

### Locator Actions

#### Click

```typescript
// From windows.spec.ts
await playLab.successModalButton.click();
```

**Web-first behavior:**
- Waits for element to be visible
- Waits for element to be enabled
- Waits for element to be stable (not moving)
- Then clicks

#### Fill (Input)

```typescript
// From iframe-form.ts
await this.nameInput.fill(name);
await this.messageInput.fill(message);
```

**Web-first behavior:**
- Waits for element to be ready
- Clears existing value
- Types new value
- Triggers input events

#### Select (Dropdown)

```typescript
// From iframe-form.ts
await this.prioritySelect.selectOption('high');
```

**Web-first behavior:**
- Waits for `<select>` to be ready
- Finds option by value or label
- Selects the option

#### Check (Checkbox)

```typescript
// From iframe-form.ts
await this.urgentCheckbox.check();
```

**Web-first behavior:**
- Waits for checkbox to be ready
- Ensures checkbox is checked (idempotent)

#### Multiple Actions

```typescript
// Typical form submission flow
await form.nameInput.fill('John');
await form.messageInput.fill('Hello');
await form.prioritySelect.selectOption('high');
await form.urgentCheckbox.check();
await form.submitButton.click();
```

### Locator Queries

#### textContent

```typescript
const text = await locator.textContent();
console.log(text); // Returns the text content
```

**Note:** Usually not needed in tests, use assertions instead.

#### getAttribute

```typescript
const id = await locator.getAttribute('id');
```

#### isVisible

```typescript
const visible = await locator.isVisible();
```

**Note:** Usually not needed, use assertions instead.

### Locator Chaining

```typescript
// Chain locators together
const frame = page.frameLocator('[data-testid="my-frame"]');
const input = frame.locator('[data-testid="input"]');
await input.fill('value');
```

## The FrameLocator API

### What is FrameLocator?

A `FrameLocator` is a special query for elements **inside an iframe**. It:
- Automatically waits for the iframe to load
- Scopes all subsequent queries to the iframe
- Can be chained for nested frames

### Creating a FrameLocator

```typescript
// From playlab-home.ts
readonly page: Page;

// Get a frame by data-testid
const frame = this.page.frameLocator('[data-testid="iframe-frame-1"]');
```

### Using FrameLocator

```typescript
// ✅ Correct: FrameLocator scope
const frame = page.frameLocator('[data-testid="my-frame"]');
await frame.locator('[data-testid="input"]').fill('value');

// ❌ Wrong: Can't access iframe content directly from page
await page.locator('[data-testid="input"]').fill('value');  // Won't find it!
```

### Nested Frames

```typescript
// Outer frame
const outerFrame = page.frameLocator('[data-testid="outer"]');

// Inner frame (inside outer)
const innerFrame = outerFrame.frameLocator('[data-testid="inner"]');

// Elements inside inner frame
await innerFrame.locator('[data-testid="element"]').click();
```

### Example from Project

```typescript
// From frames.spec.ts
const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
await expect(frame.locator('[data-testid="iframe1-heading"]'))
  .toHaveText('I am iFrame 1');
```

**What happens:**
1. `frameLocator()` finds the iframe
2. `locator()` finds the element inside the iframe
3. `toHaveText()` asserts the text

## The expect() Assertion Library

### What is expect()?

`expect()` provides **web-first assertions** that automatically retry until success or timeout.

### Comparison: Manual vs Web-First

**Manual (brittle):**
```typescript
// No retry, timing-dependent
const text = await locator.textContent();
expect(text).toBe('Expected Text');  // Fails if timing is off
```

**Web-First (robust):**
```typescript
// Automatic retry for 5 seconds
await expect(locator).toHaveText('Expected Text');
```

### Common Assertions

#### Text Content

```typescript
// From frames.spec.ts
await expect(frame.locator('[data-testid="iframe1-heading"]'))
  .toHaveText('I am iFrame 1');
```

**Variants:**
```typescript
await expect(locator).toContainText('part of text');  // Partial match
await expect(locator).toHaveText('exact text');       // Exact match
```

#### Visibility

```typescript
// From windows.spec.ts
await expect(playLab.successModal).toBeVisible();
await expect(playLab.successModal).toBeHidden();
```

#### Element State

```typescript
await expect(locator).toBeEnabled();
await expect(locator).toBeDisabled();
await expect(locator).toBeChecked();
await expect(locator).toBeEmpty();
```

#### URL & Title

```typescript
await expect(page).toHaveURL(/\/iframe\.php/);
await expect(page).toHaveTitle('Expected Title');
```

#### Counts

```typescript
await expect(page.locator('button')).toHaveCount(5);
```

#### Custom Conditions

```typescript
await expect(locator).toHaveValue('expected value');
await expect(locator).toHaveAttribute('href', '/path');
await expect(locator).toHaveClass('active');
```

### Assertion Options

```typescript
// Increase timeout for slow operations
await expect(locator).toHaveText('text', { timeout: 30_000 });

// Soft assertion (doesn't stop test on failure)
await expect.soft(locator).toHaveText('text');
```

## Web-First Waits

### What are Web-First Waits?

Playwright automatically waits for elements to be ready before actions:

```typescript
await locator.click();  // Waits for:
// 1. Element to be attached to DOM
// 2. Element to be visible (not display: none)
// 3. Element to be stable (not moving)
// 4. Element to be enabled (not disabled)
// 5. Element to be in the viewport (if needed)
```

### No Manual Sleeps Needed!

```typescript
// ❌ Bad: Arbitrary wait, flaky
await page.waitForTimeout(1000);
await locator.click();

// ✅ Good: Web-first wait, robust
await locator.click();  // Waits for element readiness
```

### Explicit Waits (When Needed)

```typescript
// Wait for element to appear
await page.locator('[data-testid="new-element"]').waitFor();

// Wait for navigation
await page.waitForNavigation();

// Wait for specific state
await page.waitForLoadState('domcontentloaded');
await page.waitForLoadState('networkidle');
```

## Events & Popups

### waitForEvent()

Waits for browser events like popups:

```typescript
// Listen for popup BEFORE the action that triggers it
const popupPromise = page.waitForEvent('popup');
await triggerPopupButton.click();
const newPage = await popupPromise;
```

**Common events:**
- `'popup'` – New page via `window.open()`
- `'close'` – Page closed
- `'load'` – Page loaded
- `'navigation'` – URL changed

### Example Pattern

```typescript
// Set up listener first
const popupPromise = page.waitForEvent('popup');

// Then trigger the popup
await button.click();

// Then handle the popup
const popup = await popupPromise;
await popup.waitForLoadState();
```

## test.describe() - Grouping Tests

### Creating Test Groups

```typescript
test.describe('Frames | labeled frame interactions', () => {
  test('interacts with iframe 1', async ({ playLab }) => {
    // ...
  });

  test('interacts with iframe 2', async ({ playLab }) => {
    // ...
  });
});
```

**Benefits:**
- Logical grouping in reports
- Can run single group: `npm test -- --grep "Frames"`
- Clearer test output

### Nested Describe Blocks

```typescript
test.describe('Feature A', () => {
  test.describe('Scenario 1', () => {
    test('test 1', () => {});
    test('test 2', () => {});
  });

  test.describe('Scenario 2', () => {
    test('test 3', () => {});
  });
});
```

## test.beforeEach() & test.afterEach()

### Setup & Teardown

```typescript
test.beforeEach(async ({ page }) => {
  // Runs before each test
  await page.goto('/');
});

test.afterEach(async ({ page }) => {
  // Runs after each test
  // (Usually fixtures handle cleanup)
});
```

**Note:** This project uses fixtures instead, which is cleaner.

## Navigation

### goto()

```typescript
// From playlab-home.ts
await this.page.goto('iframe.php');
await this.page.goto('window-popup-modal.php');
```

**Options:**
```typescript
// Wait for all network requests
await page.goto(url, { waitUntil: 'networkidle' });

// With timeout override
await page.goto(url, { timeout: 60_000 });
```

### reload()

```typescript
await page.reload();
```

### goBack() / goForward()

```typescript
await page.goBack();
await page.goForward();
```

## Debugging APIs

### page.pause()

```typescript
test('my test', async ({ page }) => {
  await page.goto('/');
  await page.pause();  // Debugger pauses here
  // Inspect page state in Inspector
});
```

### locator.highlight()

```typescript
// Highlights the element in the browser
await locator.highlight();
```

### page.screenshot()

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

## Timeouts

### Global Timeouts (from config)

```typescript
// playwright.config.ts
use: {
  navigationTimeout: 30_000,  // goto(), reload()
  actionTimeout: 10_000,       // click(), fill(), etc.
}
```

### Per-Action Timeout

```typescript
await locator.click({ timeout: 5_000 });  // 5 seconds
```

### Per-Test Timeout

```typescript
test('my slow test', async ({ page }) => {
  test.setTimeout(60_000);  // 60 seconds for this test
  // ...
});
```

## Keyboard & Mouse Interactions

### Keyboard

```typescript
await page.keyboard.press('Enter');
await page.keyboard.type('Hello World');
```

### Mouse

```typescript
await page.mouse.move(100, 200);
await page.mouse.click();
await page.mouse.wheel(0, 5);  // Scroll
```

## Context Switching

### Multiple Pages/Tabs

```typescript
// Listen for popup
const popupPromise = page.waitForEvent('popup');
await openButton.click();
const popup = await popupPromise;

// Switch between pages
await popup.goto('/other');
await expect(popup).toHaveTitle('Other Page');

// Back to original
await page.click('[data-testid="element"]');
```

## Best Practices Summary

| Practice | Why |
|----------|-----|
| Use `data-testid` selectors | Stable, semantic, automation-focused |
| Use web-first assertions | Automatic retry, no flakiness |
| Use page objects | Maintainability, reusability |
| No manual `sleep()` | Use web-first waits instead |
| Keep fixtures per-test | Isolation, automatic cleanup |
| Use `test.describe()` | Logical grouping, clear reports |
| Listen for events before actions | Ensures popup/navigation is captured |

---

**Next:** [Page Objects](./6-Page-Objects.md)
