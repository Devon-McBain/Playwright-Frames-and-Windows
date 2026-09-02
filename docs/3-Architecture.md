# Architecture Overview

This guide explains the design philosophy, architectural patterns, and key decisions that shape how this test suite is structured.

## Core Design Philosophy

The project follows **enterprise test automation best practices**:

1. **Separation of Concerns** – Tests describe behavior; page objects own selectors
2. **Semantic Labels** – Every frame and window is labeled in test titles and traces
3. **Stability Over Brittle Details** – Assert business-visible results, not CSS layout
4. **Web-First Assertions** – Use Playwright's built-in waits, never arbitrary sleeps
5. **Reproducibility** – Committed lockfiles and single-worker CI ensure consistent results

These principles prevent the common pitfalls of test automation: flaky tests, unmaintainable code, and high maintenance burden.

## Architectural Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Test Scenarios                       │
│        (frames.spec.ts, windows.spec.ts)                │
│        Describe business behavior in plain English      │
└────────────────────┬────────────────────────────────────┘
                     │ uses
┌────────────────────▼────────────────────────────────────┐
│                   Fixtures                              │
│     Inject initialized page objects & dependencies      │
└────────────────────┬────────────────────────────────────┘
                     │ provides
┌────────────────────▼────────────────────────────────────┐
│                 Page Objects                            │
│  Encapsulate selectors, frame locators, & interactions  │
│  (PlayLabHome, IframeForm, LoginPage)                   │
└────────────────────┬────────────────────────────────────┘
                     │ uses
┌────────────────────▼────────────────────────────────────┐
│             Playwright Test API                         │
│  Page, Locator, FrameLocator, expect, test.describe()   │
└────────────────────┬────────────────────────────────────┘
                     │ drives
┌────────────────────▼────────────────────────────────────┐
│              Browser Automation                         │
│      Chromium (via DevTools Protocol)                   │
└─────────────────────────────────────────────────────────┘
```

**Data flow:** Test → Fixture → Page Object → Locator → Browser Action → Assertion

## Test Organization Strategy

### Test Suite Structure

**File: `e2e/frames.spec.ts` (3 tests)**

Covers iframe scenarios on a single test page:

```typescript
test.describe('Frames | labeled frame interactions', () => {
  test('interacts with the same-origin practice iframe', async ({ playLab }) => {
    // Same origin, single iframe
  });

  test('traverses the labeled nested frame hierarchy', async ({ playLab }) => {
    // Nested frames: outer > nested > inner
  });

  test('reads content from the labeled cross-origin frame', async ({ playLab }) => {
    // Different domain, read-only access
  });
});
```

**File: `e2e/windows.spec.ts` (2 tests)**

Covers browsing context scenarios:

```typescript
test.describe('Windows | labeled browsing contexts', () => {
  test('opens the labeled link in a new tab', async ({ playLab, loginPage }) => {
    // target="_blank" creates a new Page in same context
  });

  test('opens the labeled control in a popup window', async ({ playLab, loginPage }) => {
    // window.open() creates a new Page in same context
  });
});
```

### Test Naming Convention

Each test has a **labeled scope** and a **behavior description**:

```
test('<scope> | <behavior>', async () => {
     ^                    ^
     semantic label       what we're testing
```

Examples:
- `'Frames | labeled frame interactions'` – Group of frame tests
- `'same-origin practice iframe'` – Specific scenario
- `'Windows | labeled browsing contexts'` – Group of window tests
- `'new tab'` – New tab scenario

Benefits:
- Trace output includes the full test name
- Screenshots/videos are labeled by scope
- Test reports are semantic and business-readable

## Page Object Pattern

### Purpose

Page Objects **encapsulate** two things:
1. **Selectors** – How to find elements (data-testid, CSS, XPath, etc.)
2. **Interactions** – What actions are possible (click, fill, submit, etc.)

### Structure

```typescript
export class MyPageObject {
  // Constructor receives a scoped context (Page or FrameLocator)
  constructor(private readonly context: Page | FrameLocator) {}

  // Locators describe where things are
  readonly myButton = this.context.locator('[data-testid="my-btn"]');
  readonly myInput = this.context.locator('[data-testid="my-input"]');

  // Methods describe what we can do
  async clickButton(): Promise<void> {
    await this.myButton.click();
  }

  async fillForm(value: string): Promise<void> {
    await this.myInput.fill(value);
  }
}
```

### Concrete Examples in This Project

**PlayLabHome (Page scoped)**
```typescript
export class PlayLabHome {
  constructor(page: Page) { this.page = page; }
  
  // Locators for main page elements
  readonly moreMenu = page.locator('[data-testid="nav-more"]');
  
  // Navigation methods
  async open(): Promise<void> { await this.page.goto('/'); }
  async openFramesSection(): Promise<void> { /* ... */ }
  
  // Frame locators (return FrameLocator, not Page)
  practiceFrameLocator() {
    return this.page.frameLocator('[data-testid="practice-iframe"]');
  }
}
```

**IframeForm (FrameLocator scoped)**
```typescript
export class IframeForm {
  constructor(readonly frame: FrameLocator) {}
  
  // Locators are scoped to the frame
  readonly nameInput = frame.locator('[data-testid="iframe-input-name"]');
  
  // Interactions operate within the frame
  async submit(name: string, message: string): Promise<void> {
    await this.nameInput.fill(name);
    // ... more fills and clicks
    await this.submitButton.click();
  }
}
```

### Benefits

| Benefit | Why |
|---------|-----|
| **Maintainability** | Change a selector in one place, not 10 tests |
| **Readability** | Tests read like user stories, not selenium code |
| **Reusability** | Same page object used by multiple tests |
| **Encapsulation** | Implementation details hidden from tests |
| **Semantic Actions** | `form.submit()` is clearer than `click(); fill(); click()` |

## Fixture Architecture

### Purpose

Fixtures are **test dependencies** that are initialized before each test and cleaned up after.

### Custom Fixture Definition

```typescript
// e2e/fixtures/test.ts
import { test as base, expect } from '@playwright/test';
import { PlayLabHome } from '../pages/playlab-home';
import { LoginPage } from '../pages/login-page';

type Fixtures = {
  playLab: PlayLabHome;
  loginPage: LoginPage;
};

export const test = base.extend<Fixtures>({
  playLab: async ({ page }, use) => {
    // Initialize: create the page object
    await use(new PlayLabHome(page));
    // Cleanup: (none needed, Playwright handles page cleanup)
  },
  
  loginPage: async ({}, use) => {
    // Initialize: create the page object
    await use(new LoginPage());
    // Cleanup: (none needed)
  },
});
```

### How Fixtures Integrate with Tests

```typescript
// e2e/frames.spec.ts
import { test, expect } from './fixtures/test';

test('my test', async ({ playLab, loginPage }) => {
  //                    ^ Fixtures are automatically injected
  await playLab.open();      // playLab is pre-initialized
  // ... test logic
  // playLab is automatically cleaned up
});
```

### Fixture Lifecycle

```
Test starts
  ↓
playLab fixture: new PlayLabHome(page) instantiated
  ↓
loginPage fixture: new LoginPage() instantiated
  ↓
Test body executes (has access to both fixtures)
  ↓
Test ends
  ↓
Fixtures cleaned up (page context closed)
```

### Why Fixtures Instead of Manual Setup?

| Fixture | Manual Setup |
|---------|--------------|
| Automatic per test | Must remember in every test |
| Automatic cleanup | Cleanup bugs = leaked resources |
| Type-safe injection | String-based lookup errors possible |
| Single source of truth | Setup duplicated across tests |

## Configuration Management

### Runtime Behavior Controlled by Environment

**Development (default)**
```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,           // No retries locally
workers: process.env.CI ? 1 : undefined,   // Parallel workers locally
reporter: process.env.CI ? [['dot'], ...] : [['list'], ...],  // List output locally
```

**CI Environment**
```bash
CI=true npm test
```
Enables: retries, single-worker, compact output, HTML reporting

### Timeout Hierarchy

```
Navigation Timeout: 30 seconds
├── Used for: goto(), reload(), navigate()
├── Reason: External site, network variability
│
Action Timeout: 10 seconds
├── Used for: click(), fill(), select(), etc.
├── Reason: Standard interaction timing
│
Implicit Web-First Waits: Built into Locator API
├── Used by: click(), fill(), expect(), etc.
├── Behavior: Wait for element to be ready (visible, enabled, etc.)
└── Reason: Prevents flaky "element not ready" errors
```

See [Playwright Configuration](./8-Configuration.md) for how these are configured.

## Selector Strategy

### Why `data-testid`?

All selectors use the `data-testid` attribute, not CSS classes or IDs:

```typescript
// ✅ Good: Stable automation contract
page.locator('[data-testid="my-button"]')

// ❌ Bad: Brittle to UI changes
page.locator('.btn-primary')
page.locator('#sidebar > button:nth-child(3)')
```

**Benefits of `data-testid`:**
- Developers can change styling/layout without breaking tests
- Selector intent is clear (automation contract)
- Framework-agnostic (works with vanilla HTML, React, Vue, etc.)
- Explicit "this element is automatable" contract

## Assertion Strategy

### Web-First Assertions

Use Playwright's built-in assertions with automatic retry:

```typescript
// ✅ Good: Automatic retry for 5 seconds
await expect(locator).toHaveText('Welcome');
await expect(page).toHaveURL(/\/login\.html$/);

// ❌ Bad: No retry, brittle to timing
expect(await locator.textContent()).toBe('Welcome');
```

**Benefits:**
- Automatic waits eliminate flakiness
- No arbitrary `sleep()` calls
- Clear intent (what we're asserting)
- Readable in trace/failure reports

## Design Patterns in Use

### 1. Page Object Pattern
Encapsulates selectors and interactions.
See: `PlayLabHome`, `IframeForm`, `LoginPage`

### 2. Fixture Pattern
Injects pre-initialized dependencies.
See: `e2e/fixtures/test.ts`

### 3. Builder Pattern (implicit)
Frame locators are "built" by chaining:
```typescript
playLab.page
  .frameLocator('[data-testid="outer"]')
  .frameLocator('[data-testid="inner"]')
```

### 4. Strategy Pattern (implicit)
Different page objects for different contexts:
- `PlayLabHome` for Page scope
- `IframeForm` for FrameLocator scope
- `LoginPage` for generic Page scope

## Key Dependencies Between Components

```
frames.spec.ts
├── imports: test, expect (fixtures)
├── imports: IframeForm (page object)
├── uses fixture: playLab → PlayLabHome
└── assertion: expect()

PlayLabHome
├── depends on: Page (from Playwright)
├── returns: FrameLocator objects
└── provides: frame access methods

IframeForm
├── depends on: FrameLocator (from Playwright)
├── locators: scoped to frame
└── provides: form interaction methods

windows.spec.ts
├── imports: test, expect (fixtures)
├── uses fixtures: playLab, loginPage
├── pattern: waitForEvent('popup') before click
└── assertion: expect()

LoginPage
├── depends on: Page (from Playwright)
├── method: assertLoaded(page)
└── provides: login page verification
```

## Design Decisions & Rationale

| Decision | Reason |
|----------|--------|
| Fixtures over global setup | Per-test isolation, automatic cleanup |
| Page Objects over raw Locator | Maintainability, semantic actions |
| data-testid selectors | Stable automation contracts |
| Web-first assertions | No flakiness from timing |
| Semantic test labels | Clear trace output, readable reports |
| Single-worker CI | Consistent popup/frame timing |
| Committed lockfile | Reproducible dependency resolution |
| TypeScript + strict mode | Catch errors at compile time |
| Chromium-only projects | Fast CI feedback (add Firefox/WebKit later) |

## Testing the Test Suite

The test suite itself is tested by:
1. Running locally with `npm test`
2. Running in CI with `CI=true npm test`
3. Running in Docker (isolated environment)
4. Manual verification with `npm run test:headed`

No separate test infrastructure is needed – the tests are self-validating.

---

**Next:** [Test Strategy](./4-Test-Strategy.md)
