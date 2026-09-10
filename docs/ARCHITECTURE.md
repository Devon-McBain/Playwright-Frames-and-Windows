# Architecture and Design Patterns

## Overview

This project implements enterprise-grade test automation patterns that prioritize maintainability, clarity, and reliability. The architecture separates concerns into distinct layers: fixtures, page objects, and test scenarios.

## Architectural Layers

### Layer 1: Fixtures (`e2e/fixtures/`)

**Purpose**: Dependency injection and test setup/teardown

```
Fixtures
├── Custom test instance (extends Playwright test)
├── Page object dependencies
└── Setup/teardown logic
```

**File**: `e2e/fixtures/test.ts`

```typescript
type Fixtures = {
  playLab: PlayLabHome;
  loginPage: LoginPage;
};

export const test = base.extend<Fixtures>({
  playLab: async ({ page }, use) => {
    await use(new PlayLabHome(page));
  },
  loginPage: async ({}, use) => {
    await use(new LoginPage());
  },
});
```

**Why this matters:**
- Fixtures are auto-initialized before each test
- Page objects are fresh instances (no test pollution)
- Declarative test dependencies
- TypeScript type safety for fixture properties

### Layer 2: Page Objects (`e2e/pages/`)

**Purpose**: Encapsulate selectors, locators, and element interactions

```
Page Objects
├── PlayLabHome
│   ├── Navigation methods (openFrames, openWindows)
│   ├── Modal locators (successModal, successModalButton)
│   └── Modal interaction methods
├── IframeForm
│   ├── Frame-specific form fields
│   └── Form submission logic
└── LoginPage
    └── Page validation helpers
```

**Key Responsibilities:**
1. **Selector Management**: All `data-testid` values defined here
2. **Element Locators**: Encapsulate Playwright locators
3. **User Interactions**: Methods like `click()`, `fill()`, `submit()`
4. **Navigation**: Methods like `openFrames()`, `openWindows()`

**Why this matters:**
- Selectors change in one place only
- Tests read as user scenarios, not element interactions
- Locator logic reused across tests
- When UI changes, update page objects, not 50 tests

### Layer 3: Tests (`e2e/spec.ts`)

**Purpose**: Describe user scenarios and verify outcomes

```
Tests
├── Frames Suite
│   ├── Iframe 1 interaction
│   └── Iframe 2 interaction
└── Windows Suite
    ├── Modal opening
    └── Modal closing
```

**Test Structure:**
1. **Setup**: Navigate to page via page object
2. **Interact**: Use page object methods
3. **Assert**: Verify web-first expectations

**Why this matters:**
- Tests focus on *what* users do, not *how*
- Non-technical readers understand test intent
- Business logic verified, not implementation details

## Design Patterns

### Pattern 1: Page Object Model (POM)

Every page or significant UI section gets a dedicated class.

**Example: PlayLabHome**

```typescript
export class PlayLabHome {
  readonly page: Page;
  readonly successModalButton: Locator;
  readonly successModal: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.successModalButton = page.locator('[data-testid="modal-open-success-btn"]');
    this.successModal = page.locator('[data-testid="modal-success"]');
  }
  
  async openWindows(): Promise<void> {
    await this.page.goto('window-popup-modal.php');
  }
}
```

**Benefits:**
- ✅ Centralized selector management
- ✅ Reusable interaction methods
- ✅ Self-documenting code
- ✅ Easy refactoring

**When to create a new page object:**
- New page or major feature section
- Significant UI complexity (10+ locators)
- Multiple tests interact with the same elements
- Selectors might change independently

### Pattern 2: Dependency Injection via Fixtures

Playwright fixtures provide clean dependency management.

**Example:**

```typescript
// Define fixture type
type Fixtures = {
  playLab: PlayLabHome;
};

// Inject in fixture setup
export const test = base.extend<Fixtures>({
  playLab: async ({ page }, use) => {
    await use(new PlayLabHome(page));
  },
});

// Use in test
test('example', async ({ playLab }) => {
  await playLab.openFrames();
});
```

**Benefits:**
- ✅ Fresh instance per test (no sharing)
- ✅ Automatic initialization
- ✅ Type-safe property access
- ✅ Declarative test dependencies
- ✅ Fixture reuse across tests

### Pattern 3: Labeled Semantic Testing

Test titles and page objects use semantic names, not technical selectors.

**Anti-pattern (❌ what NOT to do):**

```typescript
test('clicks [data-testid="modal-open-success-btn"]', async ({ playLab }) => {
  await playLab.page.click('[data-testid="modal-open-success-btn"]');
  await expect(playLab.page.locator('[data-testid="modal-success"]')).toBeVisible();
});
```

**Correct pattern (✅ what TO do):**

```typescript
test('opens the success modal popup', async ({ playLab }) => {
  await playLab.successModalButton.click();
  await expect(playLab.successModal).toBeVisible();
});
```

**Benefits:**
- ✅ Business analyst can understand test
- ✅ Trace output is self-documenting
- ✅ Maintenance burden shifts from tests to page objects
- ✅ Easier to communicate with stakeholders

### Pattern 4: Web-First Assertions

Use Playwright's retry-enabled assertions, not manual waits.

**Anti-pattern (❌ what NOT to do):**

```typescript
await new Promise(r => setTimeout(r, 2000)); // 2 second sleep
expect(element).toBeVisible(); // Fragile timing
```

**Correct pattern (✅ what TO do):**

```typescript
// Retries for up to 30 seconds by default
await expect(element).toBeVisible();
await expect(element).toContainText('Success Modal Popup');
```

**Benefits:**
- ✅ No arbitrary timing issues
- ✅ Automatic retry with exponential backoff
- ✅ Configurable timeouts
- ✅ Clear, precise error messages

**Built-in Assertions:**
- `toBeVisible()` - Element visible in viewport
- `toBeHidden()` - Element not visible
- `toHaveText()` - Exact text match
- `toContainText()` - Partial text match
- `toBeChecked()` - Checkbox/radio selected
- `toBeEnabled()` - Input enabled
- `toHaveValue()` - Input value match

### Pattern 5: Frame Locators for iframe Testing

Playwright's `frameLocator()` API handles iframe complexity.

**Example: Frame-specific selector targeting**

```typescript
// In PlayLabHome
readonly iframe1: Locator = page.locator('[data-testid="iframe-frame-1"]');

// In test - frame locator navigates into iframe
const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
await expect(frame.locator('[data-testid="iframe1-heading"]')).toHaveText('I am iFrame 1');
```

**Why this approach:**
- ✅ Automatically waits for iframe to load
- ✅ Handles cross-origin iframes
- ✅ Chains locators within frame context
- ✅ No manual iframe switching
- ✅ Avoids flaky timing issues

**Example: IframeForm with frame parameter**

```typescript
export class IframeForm {
  constructor(readonly frame: FrameLocator) {
    this.nameInput = frame.locator('[data-testid="iframe-input-name"]');
    // ...
  }
  
  async submit(name: string, message: string): Promise<void> {
    await this.nameInput.fill(name);
    // ...
  }
}
```

## Data Flow

### Test Execution Flow

```
1. Test starts
   ↓
2. Fixture initialization
   ├── Create Playwright Page
   ├── Instantiate PlayLabHome with page
   └── Return playLab fixture
   ↓
3. Test body executes
   ├── Call playLab.openFrames()
   ├── Get frameLocator from page
   └── Assert frame content
   ↓
4. Web-first assertions retry as needed
   ├── Wait for element (up to 30s default)
   ├── Retry on timeout
   └── Verify expected state
   ↓
5. Test cleanup (automatic)
   ├── Close browser page
   └── Cleanup resources
```

### Locator Resolution Flow

```
Playwright Test
   ↓
Page (fixture)
   ↓
Page Object (PlayLabHome)
   ↓
Locators (stored as properties)
   ├── Direct locators (for main page elements)
   └── Frame locators (for iframe elements)
   ↓
Web-first assertions (with retry)
   └── Element resolution
   └── State verification
```

## Scaling the Project

### Adding New Tests

**Step 1**: Identify the page/feature area
```typescript
// Does it belong to frames or windows?
// If new area, create new .spec.ts file
```

**Step 2**: Check if page object exists
```typescript
// PlayLabHome covers both frames and windows
// IframeForm available for frame-specific interactions
```

**Step 3**: Write test using existing page object
```typescript
test('new scenario', async ({ playLab }) => {
  await playLab.openFrames();
  // ... test logic
});
```

**Step 4**: Add selectors to page object if needed
```typescript
// Edit e2e/pages/playlab-home.ts
readonly newElement: Locator = page.locator('[data-testid="new-element"]');
```

### Adding New Page Objects

**When to create:**
- New independent page or feature area
- Significant UI complexity (10+ locators)
- Multiple tests share the same selectors

**Template:**

```typescript
import { Page, Locator } from '@playwright/test';

export class NewPageObject {
  readonly element1: Locator;
  readonly element2: Locator;
  
  constructor(readonly page: Page) {
    this.element1 = page.locator('[data-testid="element-1"]');
    this.element2 = page.locator('[data-testid="element-2"]');
  }
  
  async navigate(): Promise<void> {
    await this.page.goto('/path');
  }
  
  async interact(): Promise<void> {
    await this.element1.click();
  }
}
```

**Step: Add to fixture**

```typescript
// In e2e/fixtures/test.ts
type Fixtures = {
  playLab: PlayLabHome;
  newPage: NewPageObject;
};

export const test = base.extend<Fixtures>({
  newPage: async ({ page }, use) => {
    await use(new NewPageObject(page));
  },
});
```

### Handling Complex Interactions

**Problem**: Multiple steps with shared state

**Solution**: Add method to page object

```typescript
export class PlayLabHome {
  // ... locators ...
  
  async submitFrameForm(name: string, message: string): Promise<void> {
    const frame = this.page.frameLocator('[data-testid="iframe-frame-1"]');
    const form = new IframeForm(frame);
    await form.submit(name, message);
    await expect(form.result).toContainText('Success');
  }
}
```

**Usage in test:**

```typescript
test('submit frame form', async ({ playLab }) => {
  await playLab.openFrames();
  await playLab.submitFrameForm('John', 'Hello');
});
```

## Performance Considerations

### Timeout Configuration

```typescript
// Global timeout (playwright.config.ts)
timeout: 30_000, // 30 seconds

// Per-test timeout
test.setTimeout(60_000);

// Per-expect timeout
await expect(element).toBeVisible({ timeout: 5_000 });
```

### Worker Configuration

```typescript
// playwright.config.ts
fullyParallel: true,
workers: 4, // Local
// workers: 1, // CI (set via CI env var)
```

### Snapshot Optimization

Disable expensive features when not needed:

```typescript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
}
```

## Testing Philosophy

### Focus on Outcomes, Not Implementation

**Question**: "What does the user see/do?"

**Not**: "How does the browser render it?"

**Example:**
```typescript
// ✅ Good: Tests user-visible outcome
await expect(playLab.successModal).toBeVisible();
await expect(playLab.successModalTitle).toHaveText('Success Modal Popup');

// ❌ Bad: Tests implementation (CSS class visibility)
await expect(playLab.page.locator('.modal.show')).toHaveClass('visible');
```

### Stable Over Clever

**Question**: "Will this break when the UI changes?"

**Principle**: Prefer `data-testid` over:
- CSS classes (subject to styling changes)
- Element hierarchy (subject to layout changes)
- Pseudo-selectors (fragile and unclear)

### Readable Over Concise

**Question**: "Can a non-programmer understand this test?"

**Principle**: Optimize for maintainer understanding, not line count

```typescript
// ✅ Clear intent
test('opens the success modal popup', async ({ playLab }) => {
  await playLab.openWindows();
  await playLab.successModalButton.click();
  await expect(playLab.successModal).toBeVisible();
});

// ❌ Cryptic
test('s1', async ({ p }) => {
  await p.oW(); await p.sMB.click(); await expect(p.sM).toBeVisible();
});
```

## Common Mistakes to Avoid

| Mistake | Problem | Solution |
|---------|---------|----------|
| Selectors in tests | Change breaks multiple tests | Move to page object |
| Hardcoded waits | Flaky timing | Use web-first assertions |
| Complex test logic | Hard to debug | Move to page object methods |
| Shared state | Tests interfere | Use fresh fixtures |
| CSS-based selectors | Break on styling | Use `data-testid` |
| Comments instead of naming | Unclear intent | Use semantic test names |
| Brittle element paths | Break on layout | Use stable `data-testid` |

## Next Steps

- Review [FIXTURES.md](FIXTURES.md) for fixture implementation details
- Study [PAGE-OBJECTS.md](PAGE-OBJECTS.md) for page object reference
- Explore [TESTS.md](TESTS.md) for test scenario examples
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for debugging guidance
