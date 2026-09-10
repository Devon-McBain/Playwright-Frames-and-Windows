# Fixtures & Setup

This guide explains how fixtures work in this project, how to create custom fixtures, and how they integrate with tests.

## What are Fixtures?

**Fixtures** are test dependencies that are automatically initialized before each test and cleaned up after.

### Analogy

Think of fixtures like a restaurant:
- **Setup:** Chef prepares mise en place (ingredients ready)
- **Test:** Cook makes the dish
- **Teardown:** Clean up kitchen

Each meal (test) gets fresh ingredients, and the kitchen is clean before the next meal.

## Why Use Fixtures?

| Benefit | Why |
|---------|-----|
| **Isolation** | Each test starts fresh, no state from previous tests |
| **Automatic cleanup** | Resources are freed automatically |
| **Type-safe** | Fixtures are injected with TypeScript types |
| **Reusability** | One fixture used by many tests |
| **Configuration** | Centralized setup logic, not duplicated |

## Built-in Fixtures

Playwright provides default fixtures:

```typescript
test('my test', async ({ page, context, browser }) => {
  // page: A single browser tab
  // context: An isolated browser session (cookies, storage)
  // browser: The browser instance
});
```

**Most common: `page`** – the browser tab used by the test.

## Custom Fixtures in This Project

**File:** `e2e/fixtures/test.ts`

```typescript
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { PlayLabHome } from '../pages/playlab-home';

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

export { expect };
```

### What's Happening?

1. **Import base test:** `test as base` from `@playwright/test`
2. **Define fixture types:** `type Fixtures` lists custom fixtures
3. **Extend base test:** `base.extend<Fixtures>()` adds fixtures
4. **Implement each fixture:** Initialization and cleanup logic
5. **Export custom test:** All tests import from this file

## Fixture Lifecycle

### Single Test Execution

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
Fixtures cleaned up (resources freed)
  ↓
Next test starts (fresh fixtures)
```

### Multiple Tests

```
Test 1
  ├── playLab fixture 1 created
  ├── loginPage fixture 1 created
  ├── Test 1 executes
  └── Fixtures 1 cleaned up

Test 2
  ├── playLab fixture 2 created (fresh instance!)
  ├── loginPage fixture 2 created (fresh instance!)
  ├── Test 2 executes
  └── Fixtures 2 cleaned up

Test 3
  ├── playLab fixture 3 created (fresh instance!)
  ├── loginPage fixture 3 created (fresh instance!)
  ├── Test 3 executes
  └── Fixtures 3 cleaned up
```

**Key:** Each test gets fresh fixtures. No state leaks between tests.

## Using Fixtures in Tests

### Basic Usage

```typescript
import { test, expect } from './fixtures/test';

test('my test', async ({ playLab, loginPage }) => {
  // playLab is PlayLabHome instance
  // loginPage is LoginPage instance
  
  await playLab.openFrames();
  // ...
});
```

### Partial Fixture Usage

Tests don't have to use all fixtures:

```typescript
// Frame tests only need playLab
test('interact with iframe 1', async ({ playLab }) => {
  await playLab.openFrames();
  // ...
});

// Window tests need both
test('open modal', async ({ playLab, loginPage }) => {
  await playLab.openWindows();
  // ...
  await loginPage.assertLoaded(newPage);
});
```

**The test runner is smart:** Only requested fixtures are initialized.

### Built-in + Custom Fixtures

Combine built-in and custom fixtures:

```typescript
test('my test', async ({ page, playLab, context }) => {
  // page: built-in, automatically provided
  // playLab: custom fixture
  // context: built-in
  
  // All work together
  const url = page.url();
  await playLab.openFrames();
});
```

## Fixture Definition Pattern

### Basic Fixture

```typescript
export const test = base.extend<Fixtures>({
  myFixture: async ({ /* dependencies */ }, use) => {
    // SETUP: Initialize the fixture
    const instance = new MyClass();
    
    // BODY: Provide fixture to test
    await use(instance);
    
    // TEARDOWN: Clean up (optional)
    // (No cleanup needed for our page objects)
  },
});
```

### Fixture with Dependencies

Fixtures can depend on other fixtures (including built-in ones):

```typescript
type Fixtures = {
  playLab: PlayLabHome;
  loginPage: LoginPage;
};

export const test = base.extend<Fixtures>({
  playLab: async ({ page }, use) => {
    // Depends on built-in 'page' fixture
    const playLab = new PlayLabHome(page);
    await use(playLab);
    // Cleanup: page is automatically closed by Playwright
  },

  loginPage: async ({}, use) => {
    // Doesn't depend on any fixtures
    const loginPage = new LoginPage();
    await use(loginPage);
  },
});
```

**Syntax:**
- `{ page }` – Depends on built-in page fixture
- `{}` – No dependencies
- `{ page, context }` – Multiple dependencies

### Fixture with Cleanup

```typescript
resourceTracker: async ({ page }, use) => {
  // SETUP
  const tracker = new ResourceTracker();
  tracker.startTracking();
  
  // TEST RUNS
  await use(tracker);
  
  // TEARDOWN
  tracker.stopTracking();
  tracker.generateReport();
},
```

## Advanced Fixture Patterns

### Pattern 1: Fixture Composition

Fixtures can use other fixtures:

```typescript
type Fixtures = {
  page: Page;
  playLab: PlayLabHome;
  iframeForm: IframeForm;
};

export const test = base.extend<Fixtures>({
  playLab: async ({ page }, use) => {
    await use(new PlayLabHome(page));
  },

  iframeForm: async ({ playLab }, use) => {
    // Depends on playLab fixture
    // Can initialize based on playLab state
    const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
    await use(new IframeForm(frame));
  },
});
```

### Pattern 2: Parameterized Fixtures

```typescript
type Fixtures = {
  configuredPage: Page;
};

export const test = base.extend<Fixtures>({
  configuredPage: async ({ page }, use) => {
    // Set up page with specific configuration
    await page.goto('https://example.com');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    
    await use(page);
  },
});
```

### Pattern 3: Conditional Fixtures

```typescript
type Fixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Only authenticate if needed
    if (process.env.REQUIRE_AUTH) {
      await page.goto('/login');
      await page.locator('[data-testid="username"]').fill('user@example.com');
      await page.locator('[data-testid="password"]').fill('password');
      await page.locator('[data-testid="submit"]').click();
    }
    
    await use(page);
  },
});
```

## Current Fixtures Explained

### playLab Fixture

```typescript
playLab: async ({ page }, use) => {
  await use(new PlayLabHome(page));
},
```

**Initialization:**
1. Receives built-in `page` fixture
2. Creates new `PlayLabHome` instance with that page
3. Provides to test

**Cleanup:**
- `PlayLabHome` itself doesn't need cleanup
- Playwright automatically closes page after test

**Used by:**
- All frame tests
- All window tests

**Type:** `PlayLabHome`

### loginPage Fixture

```typescript
loginPage: async ({}, use) => {
  await use(new LoginPage());
},
```

**Initialization:**
1. Creates new `LoginPage` instance
2. Provides to test

**Cleanup:**
- `LoginPage` is stateless, no cleanup needed

**Used by:**
- Window tests (verify new tabs/popups)

**Type:** `LoginPage`

## Creating a New Fixture

### Step 1: Create Page Object

```typescript
// e2e/pages/my-page.ts
export class MyPage {
  constructor(page: Page) {
    this.page = page;
  }
  
  async doSomething() {
    // ...
  }
}
```

### Step 2: Add to Fixture Definition

```typescript
// e2e/fixtures/test.ts
import { MyPage } from '../pages/my-page';

type Fixtures = {
  playLab: PlayLabHome;
  loginPage: LoginPage;
  myPage: MyPage;  // ← Add here
};

export const test = base.extend<Fixtures>({
  playLab: async ({ page }, use) => {
    await use(new PlayLabHome(page));
  },

  loginPage: async ({}, use) => {
    await use(new LoginPage());
  },

  myPage: async ({ page }, use) => {  // ← Add here
    await use(new MyPage(page));
  },
});
```

### Step 3: Use in Tests

```typescript
// e2e/my-test.spec.ts
import { test, expect } from './fixtures/test';

test('use new fixture', async ({ myPage }) => {
  await myPage.doSomething();
});
```

## Fixture vs Setup Methods

### Fixture Approach (✅ Better)

```typescript
// e2e/fixtures/test.ts
export const test = base.extend<Fixtures>({
  playLab: async ({ page }, use) => {
    await use(new PlayLabHome(page));
  },
});

// e2e/my-test.spec.ts
test('my test', async ({ playLab }) => {
  await playLab.openFrames();
});
```

**Benefits:**
- Automatic per-test initialization
- Built-in cleanup
- Type-safe
- Easy to use

### beforeEach() Approach (❌ Worse)

```typescript
// e2e/my-test.spec.ts
test.beforeEach(async ({ page }) => {
  // Must remember in every test
  playLab = new PlayLabHome(page);
});

test('my test', async ({ playLab }) => {
  await playLab.openFrames();
});

test('another test', async ({ playLab }) => {
  // Must set up again!
  playLab = new PlayLabHome(page);
  await playLab.openWindows();
});
```

**Issues:**
- Repetitive
- Easy to forget
- Manual cleanup
- Not type-safe

## Fixture Scopes

Playwright fixtures can have different scopes:

### test (Default)

```typescript
test.extend<Fixtures>({
  myFixture: async ({}, use) => {
    // Runs once per test
    await use(instance);
  },
});
```

**When to use:** Page objects, test-specific setup

### worker

```typescript
test.extend<Fixtures>({
  sharedResource: [async ({}, use) => {
    // Runs once per worker (parallel execution group)
    await use(resource);
  }, { scope: 'worker' }],
});
```

**When to use:** Expensive setup (database, server) shared by multiple tests

### suite (Not used in this project)

Runs once per describe block.

## Best Practices

### ✅ Do

- Use fixtures for per-test dependencies
- Keep fixtures simple
- One responsibility per fixture
- Use fixture composition for complex setups
- Export custom `test` from fixtures file
- Import `test` from fixtures in all test files

### ❌ Don't

- Use fixtures for global setup (use `beforeAll` hook instead)
- Create side effects outside `use()`
- Forget to `await use()`
- Over-abstract simple setups
- Share state between fixture instances
- Mix fixtures with `beforeEach()` hooks

## Troubleshooting

### ❌ "Cannot find module './fixtures/test'"

Check that the import path is correct:
```typescript
import { test, expect } from './fixtures/test';  // ✅
import { test, expect } from '../fixtures/test';  // ❌ Wrong path
```

### ❌ "Fixture not provided to test"

Make sure the fixture is:
1. Defined in fixture file
2. Added to `Fixtures` type
3. Implemented in `test.extend<Fixtures>()`
4. Requested in test signature

```typescript
test('my test', async ({ playLab }) => {
  // ↑ Make sure 'playLab' is requested here
});
```

### ❌ "Cannot use async/await in fixture constructor"

Fixtures must be initialized in the fixture definition, not in page object constructors:

```typescript
// ❌ Wrong
export class PlayLabHome {
  constructor(page: Page) {
    await page.goto('/');  // ❌ Can't await here
  }
}

// ✅ Right: Async work in fixture or test
playLab: async ({ page }, use) => {
  await page.goto('/');  // ✅ Can await here
  await use(new PlayLabHome(page));
},
```

## Summary

| Concept | Purpose |
|---------|---------|
| **Fixture** | Per-test dependency, initialized automatically |
| **test.extend()** | Add custom fixtures to base test |
| **Fixtures type** | TypeScript definitions for fixture names |
| **use()** | Provide fixture to test, then cleanup |
| **Scope** | When fixture initializes (test, worker, suite) |
| **Composition** | One fixture depending on another |

---

**Next:** [Playwright Configuration](./8-Configuration.md)
