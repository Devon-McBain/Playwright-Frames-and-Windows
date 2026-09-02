# Project Structure

This guide explains how the test project is organized, what each directory contains, and how the components interact.

## Directory Tree

```
Playwright-Frames-and-Windows/
│
├── docs/                          # Wiki documentation (you are here)
│   ├── Home.md                   # Overview & navigation
│   ├── 1-Setup-Installation.md   # Prerequisites & initial setup
│   ├── 2-Project-Structure.md    # This file
│   ├── 3-Architecture.md         # System design & conventions
│   ├── 4-Test-Strategy.md        # Test organization & coverage
│   ├── 5-Playwright-Framework.md # Core APIs & patterns
│   ├── 6-Page-Objects.md         # Page object design
│   ├── 7-Fixtures-Setup.md       # Custom fixtures
│   ├── 8-Configuration.md        # Config files
│   ├── 9-Running-Tests.md        # Test execution
│   ├── 10-Frames-Deep-Dive.md    # iframe handling
│   ├── 11-Windows-Contexts.md    # Windows & popups
│   ├── 12-CI-CD.md               # Continuous integration
│   ├── 13-Troubleshooting.md     # Common issues
│   └── 14-Development-Workflow.md # Development process
│
├── e2e/                           # End-to-end test suites
│   ├── fixtures/
│   │   └── test.ts               # Custom test fixture extending @playwright/test
│   │
│   ├── pages/                    # Page objects (encapsulate selectors & interactions)
│   │   ├── playlab-home.ts       # Main page: navigation, frame/window entry points
│   │   ├── iframe-form.ts        # Form abstraction for iframe interactions
│   │   └── login-page.ts         # Secondary destination for new tabs/popups
│   │
│   ├── frames.spec.ts            # Frame test scenarios (3 tests)
│   └── windows.spec.ts           # Window test scenarios (2 tests)
│
├── node_modules/                 # Installed packages (created by npm install)
│   └── @playwright/              # Playwright and TypeScript
│
├── .playwright/                  # Browser cache (created by playwright install)
│   └── chromium/                 # Chromium binary
│
├── playwright-report/            # Test report (created after test runs)
│   ├── index.html                # Main report page
│   ├── data/                     # Test results & artifacts
│   └── trace/                    # Execution traces (*.zip)
│
├── playwright.config.ts          # Test runner configuration (timeouts, reporters, projects)
├── tsconfig.json                 # TypeScript compiler settings
├── package.json                  # npm dependencies & scripts
├── package-lock.json             # Locked dependency versions (committed)
├── README.md                      # Project overview (original)
└── .gitignore                    # Git exclusions (node_modules, reports, etc.)
```

## Directory Roles

### `e2e/` – Test Source Code

The heart of the project. Contains all test code, page objects, and fixtures.

```
e2e/
├── fixtures/test.ts              (18 lines)
├── pages/
│   ├── playlab-home.ts          (42 lines)
│   ├── iframe-form.ts           (27 lines)
│   └── login-page.ts            (10 lines)
├── frames.spec.ts                (39 lines)
└── windows.spec.ts               (31 lines)

Total: ~167 lines of test code
```

**Key characteristic:** Every test file ends in `.spec.ts` – this is the Playwright naming convention for test files.

### `e2e/fixtures/` – Test Fixtures

**File:** `test.ts`

Extends the base Playwright test fixture with custom dependencies.

```typescript
// What it exports:
export const test        // Enhanced test() function
export { expect }        // Assertion library
```

**Injected into tests:**
- `playLab` – PlayLabHome page object (for all tests)
- `loginPage` – LoginPage page object (for window tests)

See [Fixtures & Setup](./7-Fixtures-Setup.md) for full details.

### `e2e/pages/` – Page Objects

Three semantic abstractions for different parts of the application:

#### `playlab-home.ts` (42 lines)
The main entry point. Encapsulates:
- Navigation to the root page (`/`)
- Opening the Frames section of the demo site
- Locators for iframe elements
- Frame locators for navigating into iframes

Used by all tests.

#### `iframe-form.ts` (27 lines)
A form automation abstraction. Encapsulates:
- Form field locators (name, message, priority, urgent checkbox)
- The `submit()` method that fills and submits the form
- Result display locator for assertions

Used by frame tests.

#### `login-page.ts` (10 lines)
A minimal assertion helper. Encapsulates:
- Expected page title
- `assertLoaded()` method that waits for DOM and login card

Used by window tests to verify new tabs/popups.

### `e2e/frames.spec.ts` – Frame Tests

3 test scenarios covering iframe interactions:

1. **Same-origin iframe** – Interact with a form inside an iframe on the same domain
2. **Nested frames** – Navigate through a hierarchy: outer frame → nested-frames.html → iframe-content.html
3. **Cross-origin iframe** – Read content from an iframe on a different domain

All tests:
- Use `playLab` fixture to navigate
- Use `IframeForm` to abstract form interactions
- Assert business-visible results (form submission, text content)

See [Frames Deep Dive](./10-Frames-Deep-Dive.md) for detailed patterns.

### `e2e/windows.spec.ts` – Window Tests

2 test scenarios covering new browsing contexts:

1. **New tab** – Click a button that opens a link in a new tab (`target="_blank"`)
2. **Popup window** – Click a button that calls `window.open()`

Both tests:
- Use `playLab` fixture to trigger the action
- Use `loginPage` fixture to verify the new page loaded
- Demonstrate the pattern: `waitForEvent('popup')` before the click

See [Windows & Contexts](./11-Windows-Contexts.md) for detailed patterns.

## Configuration Files

### `playwright.config.ts` (21 lines)

The test runner configuration. Defines:
- Test directory (`./e2e`)
- Browser project (Chromium)
- Timeouts (navigation: 30s, action: 10s)
- Reporters (list output, HTML report)
- Retry logic (0 in dev, 2 in CI)
- Parallel execution (unlimited workers in dev, 1 in CI)
- Screenshot/video/trace retention

See [Playwright Configuration](./8-Configuration.md) for full breakdown.

### `tsconfig.json` (11 lines)

TypeScript compiler settings. Configures:
- Target: ES2022 (modern JavaScript)
- Module: CommonJS (Node.js compatibility)
- Strict mode: enabled (catches errors)
- No emit: true (Playwright handles compilation)
- Type definitions: Node.js + @playwright/test

See [TypeScript Configuration](./8-Configuration.md#typescript-configuration) for details.

### `package.json` (16 lines)

npm configuration. Defines:
- Project name: `playwright-frames-and-windows`
- Version: `1.0.0`
- npm scripts (test, test:headed, test:debug, report)
- Dev dependencies: @playwright/test, typescript, @types/node

### `package-lock.json`

Locked versions of all dependencies. Always committed to ensure reproducible installs.

## Runtime Artifacts

These directories are created during test execution and are **not committed**:

### `node_modules/`
Installed npm packages. Created by `npm install`. Contains ~500 MB for Playwright.

### `.playwright/`
Cached browser binaries. Created by `npx playwright install`. Contains Chromium (~300 MB).

### `playwright-report/`
HTML test report. Created after each test run. View with `npm run report`.

Includes:
- Test results (pass/fail, duration)
- Screenshots on failure
- Videos on failure
- Traces for debugging

## Component Interactions

### Test Execution Flow

```
npm test
    ↓
playwright.config.ts (determines config)
    ↓
e2e/*.spec.ts (test files discovered)
    ↓
For each test:
    ├── e2e/fixtures/test.ts (fixtures initialized)
    │   ├── playLab = new PlayLabHome(page)
    │   └── loginPage = new LoginPage()
    ├── page.goto('https://playwrightlab.github.io/')
    └── Test logic executes
    ↓
playwright-report/ (results written)
```

### Page Object Usage Pattern

```
Test (frames.spec.ts)
    ↓
PlayLabHome page object
    ├── Locators (moreMenu, framesSection, practiceFrame, etc.)
    ├── Methods (open(), openFramesSection())
    └── Frame locators (practiceFrameLocator(), nestedInnerFrameLocator())
    ↓
IframeForm page object (received via frameLocator)
    ├── Locators scoped to iframe (nameInput, messageInput, etc.)
    └── Methods (submit())
    ↓
Playwright Locator API
    ↓
Browser executes action
```

## Dependency Graph

```
Test files
├── frames.spec.ts
│   ├── imports: test, expect (from fixtures/test.ts)
│   ├── imports: IframeForm (from pages/iframe-form.ts)
│   └── uses: playLab fixture → PlayLabHome (from pages/playlab-home.ts)
│
└── windows.spec.ts
    ├── imports: test, expect (from fixtures/test.ts)
    └── uses: playLab, loginPage fixtures
        ├── PlayLabHome (from pages/playlab-home.ts)
        └── LoginPage (from pages/login-page.ts)

Fixtures (fixtures/test.ts)
├── imports: LoginPage (from pages/login-page.ts)
├── imports: PlayLabHome (from pages/playlab-home.ts)
└── extends: test, expect (from @playwright/test)

Page objects
├── playlab-home.ts → Locator, Page (from @playwright/test)
├── iframe-form.ts → FrameLocator (from @playwright/test)
└── login-page.ts → Page (from @playwright/test)

Configuration
├── playwright.config.ts → defineConfig, devices (from @playwright/test)
└── tsconfig.json → typescript compiler settings
```

## Code Organization Principles

### Separation of Concerns

- **Tests (`*.spec.ts`):** Describe user behavior in plain English
- **Page objects (`pages/*.ts`):** Encapsulate selectors and interactions
- **Fixtures (`fixtures/test.ts`):** Inject dependencies into tests
- **Configuration:** Kept in dedicated config files, not scattered in code

### Single Responsibility

Each class has one job:
- `PlayLabHome` – Navigate the main page
- `IframeForm` – Interact with the form inside any iframe
- `LoginPage` – Verify the login page loaded
- Custom `test` fixture – Provide initialized page objects

### Reusability

- `IframeForm` is used by 2 different tests (same-origin and nested)
- `loginPage` fixture is reused for both tab and popup tests
- Frame locators are methods that can be called multiple times

## File Metrics

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| playlab-home.ts | Page Object | 42 | Main navigation & frame/window entry points |
| frames.spec.ts | Tests | 39 | 3 frame test scenarios |
| windows.spec.ts | Tests | 31 | 2 window test scenarios |
| iframe-form.ts | Page Object | 27 | Form interaction abstraction |
| playwright.config.ts | Config | 21 | Test execution settings |
| test.ts | Fixture | 18 | Custom test base |
| login-page.ts | Page Object | 10 | Login page assertion helper |
| **Total** | | **188** | **All production code** |

## Adding New Tests

When adding a new test:

1. **Create a new page object** (e.g., `e2e/pages/my-page.ts`) if needed
2. **Import it in `e2e/fixtures/test.ts`** and add a fixture
3. **Create `e2e/my-feature.spec.ts`** with test scenarios
4. **Import the custom `test`** from fixtures: `import { test, expect } from './fixtures/test'`

Example:
```typescript
// e2e/my-feature.spec.ts
import { test, expect } from './fixtures/test';

test('my scenario', async ({ playLab }) => {
  await playLab.open();
  // ... test logic
});
```

See [Development Workflow](./14-Development-Workflow.md) for full guidance.

---

**Next:** [Architecture Overview](./3-Architecture.md)
