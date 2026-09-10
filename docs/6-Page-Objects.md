# Page Objects

This guide explains the Page Object pattern used in this project, with detailed examples from the actual codebase.

## What is a Page Object?

A **Page Object** is a class that encapsulates:
1. **Selectors** – How to find elements on a page
2. **Interactions** – What actions can be performed
3. **Navigation** – How to reach specific states

### Purpose

Instead of scattering selectors throughout tests:

```typescript
// ❌ Bad: Selectors scattered everywhere
test('test 1', async ({ page }) => {
  await page.locator('[data-testid="modal-open-success-btn"]').click();
  await expect(page.locator('[data-testid="modal-success"]')).toBeVisible();
});

test('test 2', async ({ page }) => {
  await page.locator('[data-testid="modal-open-success-btn"]').click();
  await expect(page.locator('[data-testid="modal-success"]')).toBeVisible();
});
// ↑ Change selector in 2+ places when HTML changes
```

**Use a Page Object instead:**

```typescript
// ✅ Good: Selectors centralized in page object
export class PlayLabHome {
  readonly successModalButton = page.locator('[data-testid="modal-open-success-btn"]');
  readonly successModal = page.locator('[data-testid="modal-success"]');
  
  async openSuccessModal() { await this.successModalButton.click(); }
}

// Now both tests use the same page object
test('test 1', async ({ playLab }) => {
  await playLab.openSuccessModal();
  await expect(playLab.successModal).toBeVisible();
});

test('test 2', async ({ playLab }) => {
  await playLab.openSuccessModal();
  await expect(playLab.successModal).toBeVisible();
});
// ↑ Change selector in 1 place
```

## Benefits of Page Objects

| Benefit | Why |
|---------|-----|
| **Maintainability** | Change a selector once, not 10 tests |
| **Readability** | Tests read like user stories, not code |
| **Reusability** | Same page object used by multiple tests |
| **Encapsulation** | Implementation details hidden from tests |
| **Semantic Actions** | `openSuccessModal()` is clearer than `click()` |
| **Reduces Duplication** | DRY principle applied to test code |

## Page Object Structure

### Basic Template

```typescript
import { Page, Locator } from '@playwright/test';

export class MyPageObject {
  // Constructor receives the page context
  constructor(private readonly page: Page) {}

  // Locators describe where things are
  readonly myButton: Locator = this.page.locator('[data-testid="my-btn"]');
  readonly myInput: Locator = this.page.locator('[data-testid="my-input"]');

  // Methods describe what we can do
  async clickButton(): Promise<void> {
    await this.myButton.click();
  }

  async fillInput(value: string): Promise<void> {
    await this.myInput.fill(value);
  }

  async submitForm(): Promise<void> {
    await this.clickButton();
  }
}
```

### Type Annotations

```typescript
// ✅ Good: Explicitly typed
readonly myButton: Locator = page.locator('[data-testid="btn"]');

// Also fine: Type inference
readonly myButton = page.locator('[data-testid="btn"]');
```

## Page Objects in This Project

### 1. PlayLabHome

**File:** `e2e/pages/playlab-home.ts`

Main entry point for all tests. Handles navigation and provides access to key elements.

```typescript
export class PlayLabHome {
  readonly page: Page;
  readonly iframe1: Locator;
  readonly iframe2: Locator;
  readonly successModalButton: Locator;
  readonly successModal: Locator;
  readonly successModalTitle: Locator;
  readonly successModalBody: Locator;

  constructor(page: Page) {
    this.page = page;
    this.iframe1 = page.locator('[data-testid="iframe-frame-1"]');
    this.iframe2 = page.locator('[data-testid="iframe-frame-2"]');
    this.successModalButton = page.locator('[data-testid="modal-open-success-btn"]');
    this.successModal = page.locator('[data-testid="modal-success"]');
    this.successModalTitle = page.locator('[data-testid="modal-success-title"]');
    this.successModalBody = page.locator('[data-testid="modal-success-body"]');
  }

  async openFrames(): Promise<void> {
    await this.page.goto('iframe.php');
  }

  async openWindows(): Promise<void> {
    await this.page.goto('window-popup-modal.php');
  }
}
```

**Responsibilities:**
- ✅ Navigation to different sections
- ✅ Locators for main page elements
- ✅ Access to iframe and modal elements

**Used by:**
- Frame tests (accessing iframes)
- Window tests (accessing modals)

**Example usage:**
```typescript
test('opens success modal', async ({ playLab }) => {
  await playLab.openWindows();  // Navigate
  await playLab.successModalButton.click();  // Use locator
  await expect(playLab.successModal).toBeVisible();  // Assert
});
```

### 2. IframeForm

**File:** `e2e/pages/iframe-form.ts`

Encapsulates form interactions within an iframe. Scoped to a `FrameLocator`.

```typescript
export class IframeForm {
  readonly nameInput: ReturnType<FrameLocator['locator']>;
  readonly messageInput: ReturnType<FrameLocator['locator']>;
  readonly prioritySelect: ReturnType<FrameLocator['locator']>;
  readonly urgentCheckbox: ReturnType<FrameLocator['locator']>;
  readonly submitButton: ReturnType<FrameLocator['locator']>;
  readonly result: ReturnType<FrameLocator['locator']>;

  constructor(readonly frame: FrameLocator) {
    this.nameInput = frame.locator('[data-testid="iframe-input-name"]');
    this.messageInput = frame.locator('[data-testid="iframe-textarea"]');
    this.prioritySelect = frame.locator('[data-testid="iframe-select"]');
    this.urgentCheckbox = frame.locator('[data-testid="iframe-checkbox"]');
    this.submitButton = frame.locator('[data-testid="iframe-submit"]');
    this.result = frame.locator('[data-testid="iframe-result"]');
  }

  async submit(name: string, message: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.messageInput.fill(message);
    await this.prioritySelect.selectOption('high');
    await this.urgentCheckbox.check();
    await this.submitButton.click();
  }
}
```

**Key Feature:** Constructor takes `FrameLocator`, not `Page`. All locators are scoped to the iframe.

**Responsibilities:**
- ✅ Form field selectors (scoped to frame)
- ✅ Form submission logic
- ✅ Result assertion helpers

**Used by:**
- Frame tests (form submission within iframes)

**Example usage:**
```typescript
test('submit form in iframe', async ({ playLab }) => {
  await playLab.openFrames();
  
  const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
  const form = new IframeForm(frame);
  
  await form.submit('John', 'Hello World');
  await expect(form.result).toContainText('submitted');
});
```

### 3. LoginPage

**File:** `e2e/pages/login-page.ts`

Minimal page object for verifying the login page loaded. Used for popup/new tab verification.

```typescript
export class LoginPage {
  readonly title = 'PlayLab - Login';

  async assertLoaded(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
    await page.locator('[data-testid="login-card"]').waitFor();
  }
}
```

**Responsibilities:**
- ✅ Expected page title constant
- ✅ Page load verification method

**Used by:**
- Window tests (verify new tabs/popups)

**Example usage:**
```typescript
test('open new tab', async ({ playLab, loginPage }) => {
  const popupPromise = playLab.page.waitForEvent('popup');
  await playLab.newTabButton.click();
  
  const newTab = await popupPromise;
  await loginPage.assertLoaded(newTab);
});
```

## Page Object Patterns

### Pattern 1: Locator Properties

Direct access to locators:

```typescript
export class MyPageObject {
  readonly button: Locator = this.page.locator('[data-testid="btn"]');
  readonly input: Locator = this.page.locator('[data-testid="input"]');
}

// Usage in test
await pageObj.button.click();
await pageObj.input.fill('value');
```

**When to use:** Simple element access, low-level interactions

### Pattern 2: Action Methods

Methods that encapsulate multi-step actions:

```typescript
export class IframeForm {
  async submit(name: string, message: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.messageInput.fill(message);
    await this.prioritySelect.selectOption('high');
    await this.urgentCheckbox.check();
    await this.submitButton.click();
  }
}

// Usage in test
await form.submit('John', 'Hello World');
```

**When to use:** Multi-step workflows, form submission, complex sequences

### Pattern 3: Navigation Methods

Methods that navigate to specific page states:

```typescript
export class PlayLabHome {
  async openFrames(): Promise<void> {
    await this.page.goto('iframe.php');
  }

  async openWindows(): Promise<void> {
    await this.page.goto('window-popup-modal.php');
  }
}

// Usage in test
await playLab.openFrames();
```

**When to use:** Page navigation, state transitions

### Pattern 4: Frame-Scoped Page Objects

Page objects scoped to a `FrameLocator` instead of `Page`:

```typescript
export class IframeForm {
  constructor(readonly frame: FrameLocator) {
    // All locators are scoped to this frame
    this.nameInput = frame.locator('[data-testid="input"]');
  }
}

// Usage
const frame = playLab.page.frameLocator('[data-testid="my-frame"]');
const form = new IframeForm(frame);
await form.submit('John', 'Message');
```

**When to use:** Elements inside iframes, modal content, nested contexts

### Pattern 5: Getter Methods

Methods that return computed or dynamic locators:

```typescript
export class MyPageObject {
  get firstButton(): Locator {
    return this.page.locator('[data-testid="btn"]').first();
  }

  rowByIndex(index: number): Locator {
    return this.page.locator(`[data-testid="row-${index}"]`);
  }
}

// Usage
await pageObj.firstButton.click();
await pageObj.rowByIndex(2).click();
```

**When to use:** Dynamic selectors, indexed elements, computed locators

## Selector Best Practices

### ✅ Use data-testid

```typescript
readonly button = page.locator('[data-testid="submit-btn"]');
```

**Benefits:**
- Stable (doesn't change with CSS)
- Semantic (clearly intended for automation)
- Explicit contract between dev and QA

### ❌ Avoid CSS Selectors

```typescript
readonly button = page.locator('.btn-primary');  // ❌ Changes with styling
```

### ❌ Avoid XPath

```typescript
readonly button = page.locator('//button[text()="Submit"]');  // ❌ Slow and fragile
```

### ❌ Avoid Brittle Patterns

```typescript
readonly button = page.locator('button:nth-child(3)');  // ❌ DOM structure dependent
readonly button = page.locator('div > div > button');  // ❌ Fragile nesting
```

## Constructor Patterns

### Pattern 1: Page Constructor

```typescript
export class PlayLabHome {
  constructor(page: Page) {
    this.page = page;
    // Initialize locators
  }
}

// Fixture initialization
playLab: async ({ page }, use) => {
  await use(new PlayLabHome(page));
}
```

### Pattern 2: FrameLocator Constructor

```typescript
export class IframeForm {
  constructor(readonly frame: FrameLocator) {
    // All locators scoped to frame
  }
}

// Test usage
const frame = playLab.page.frameLocator('[data-testid="my-frame"]');
const form = new IframeForm(frame);
```

### Pattern 3: Pre-initialized Dependencies

```typescript
export class ComplexPageObject {
  constructor(
    private readonly page: Page,
    private readonly config: Config,
    private readonly logger: Logger
  ) {
    // Multiple dependencies
  }
}
```

## Locator Scoping

### Page-Level Selectors

```typescript
// From PlayLabHome
readonly successModalButton = page.locator('[data-testid="modal-open-success-btn"]');
```

Scope: Entire page

### Frame-Level Selectors

```typescript
// From IframeForm
readonly nameInput = frame.locator('[data-testid="iframe-input-name"]');
```

Scope: Within specific iframe

### Nested Scoping

```typescript
// Locator within frame within page
const frame = page.frameLocator('[data-testid="my-frame"]');
const input = frame.locator('[data-testid="input"]');
```

Scope: Input element inside iframe

## Method Return Types

### Void Methods (Side Effects Only)

```typescript
async openFrames(): Promise<void> {
  await this.page.goto('iframe.php');
}
```

**Use when:** Action has no return value, pure side effects

### Locator-Returning Methods

```typescript
getRowByIndex(index: number): Locator {
  return this.page.locator(`[data-testid="row-${index}"]`);
}
```

**Use when:** Returning elements for test assertions

### Boolean-Returning Methods

```typescript
async isModalVisible(): Promise<boolean> {
  return await this.successModal.isVisible();
}
```

**Use when:** Checking state (though usually better to use assertions)

## Testing Best Practices with Page Objects

### ✅ Good: High-Level Test

```typescript
test('submit form successfully', async ({ playLab }) => {
  await playLab.openFrames();
  
  const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
  const form = new IframeForm(frame);
  
  await form.submit('John', 'Hello World');
  await expect(form.result).toContainText('submitted');
});
```

**Why:** Reads like a user story, implementation details hidden

### ❌ Bad: Low-Level Test

```typescript
test('submit form successfully', async ({ page }) => {
  await page.goto('iframe.php');
  
  const frame = page.frameLocator('[data-testid="iframe-frame-1"]');
  await frame.locator('[data-testid="iframe-input-name"]').fill('John');
  await frame.locator('[data-testid="iframe-textarea"]').fill('Hello World');
  await frame.locator('[data-testid="iframe-select"]').selectOption('high');
  await frame.locator('[data-testid="iframe-checkbox"]').check();
  await frame.locator('[data-testid="iframe-submit"]').click();
  
  await expect(frame.locator('[data-testid="iframe-result"]'))
    .toContainText('submitted');
});
```

**Why:** Hard to read, selectors scattered, duplicate code

## Extending Page Objects

### Adding a New Locator

```typescript
// playlab-home.ts
readonly warningModal = page.locator('[data-testid="modal-warning"]');
```

**All tests automatically have access.**

### Adding a New Method

```typescript
// playlab-home.ts
async closeSuccessModal(): Promise<void> {
  await this.successModal.locator('[data-testid="modal-close-btn"]').click();
}
```

**All tests can call it without change.**

### Adding a New Page Object

1. Create `e2e/pages/new-page.ts`
2. Add to fixtures in `e2e/fixtures/test.ts`
3. Use in tests

See [Development Workflow](./14-Development-Workflow.md) for details.

## Common Mistakes

### ❌ Mistake 1: Hardcoding Selectors in Tests

```typescript
// ❌ Bad: Selector in test
test('click button', async ({ page }) => {
  await page.locator('[data-testid="my-btn"]').click();
});

// ✅ Good: Selector in page object
test('click button', async ({ pageObj }) => {
  await pageObj.myButton.click();
});
```

### ❌ Mistake 2: Storing Locators as Strings

```typescript
// ❌ Bad: String selector
export class MyPage {
  buttonSelector = '[data-testid="btn"]';
}

// ✅ Good: Locator object
export class MyPage {
  readonly button = page.locator('[data-testid="btn"]');
}
```

### ❌ Mistake 3: Async in Constructor

```typescript
// ❌ Bad: Can't await in constructor
export class MyPage {
  constructor(page: Page) {
    await this.page.goto('/');  // ❌ Syntax error
  }
}

// ✅ Good: Async in methods
export class MyPage {
  async navigateHome() {
    await this.page.goto('/');
  }
}
```

### ❌ Mistake 4: Over-Encapsulation

```typescript
// ❌ Bad: Too many wrapper methods
export class MyPage {
  async clickButton() { await this.button.click(); }
  async fillInput(value) { await this.input.fill(value); }
  async selectOption(option) { await this.select.selectOption(option); }
}

// ✅ Good: Expose locators for flexibility
export class MyPage {
  readonly button = page.locator('[data-testid="btn"]');
  readonly input = page.locator('[data-testid="input"]');
  
  // Only wrap complex workflows
  async submitForm(name, message) {
    await this.input.fill(name);
    await this.button.click();
  }
}
```

## Summary: When to Use Page Objects

**Use Page Objects for:**
- ✅ Encapsulating selectors
- ✅ Reusing element locators
- ✅ High-level action methods
- ✅ Navigation logic
- ✅ State verification
- ✅ Complex user workflows

**Don't Overdo It:**
- ❌ One-off selectors don't need page objects (use inline locators)
- ❌ Don't wrap every single action method
- ❌ Don't over-abstract; keep it readable

---

**Next:** [Fixtures & Setup](./7-Fixtures-Setup.md)
