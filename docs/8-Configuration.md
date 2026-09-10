# Playwright Configuration

This guide explains the configuration files that control how tests run, with detailed breakdowns of each setting.

## Configuration Files Overview

The project has three configuration files:

| File | Purpose | Lines |
|------|---------|-------|
| `playwright.config.ts` | Test runner settings (timeouts, reporters, retries) | 25 |
| `tsconfig.json` | TypeScript compiler settings | 11 |
| `package.json` | npm dependencies and scripts | 17 |

## playwright.config.ts

### Full Configuration

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['dot'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://testing.qaautomationlabs.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 10_000,
    headless: false,
    launchOptions: {
      slowMo: 1000
    }
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### Top-Level Settings

#### testDir

```typescript
testDir: './e2e',
```

**Purpose:** Where to find test files

**Value:** `./e2e` – All `.spec.ts` files in this directory

**Notes:**
- Recursively scans for `*.spec.ts` and `*.test.ts`
- Relative to config file location

#### fullyParallel

```typescript
fullyParallel: true,
```

**Purpose:** Run all tests in parallel (when workers > 1)

**Value:** `true` – Tests run concurrently

**Options:**
- `true` – All tests in parallel
- `false` – Only within each file; different files run sequentially

**Current behavior:**
- Dev: Parallel (undefined workers = machine CPU count)
- CI: Sequential (workers = 1, ignores this setting)

#### forbidOnly

```typescript
forbidOnly: !!process.env.CI,
```

**Purpose:** Prevent `.only` tests from running in CI

**What it does:**
- In CI: `.only` causes build to fail (prevents accidental commits)
- Locally: Allows `.only` for focused testing

**Example:**
```typescript
// This runs in dev...
test.only('my focused test', async () => {});

// ...but fails in CI (forbidOnly: true)
```

#### retries

```typescript
retries: process.env.CI ? 2 : 0,
```

**Purpose:** How many times to retry failed tests

**Values:**
- Dev: `0` – Fail immediately
- CI: `2` – Retry twice on failure

**Why:** CI is more flaky (network, timing); dev needs fast feedback

**Behavior:**
```
Test fails
  ↓ (in CI only)
Retry 1: If passes, test passes. If fails, continue.
  ↓
Retry 2: If passes, test passes. If fails, test fails.
```

**Note:** Each retry is a fresh browser instance.

#### workers

```typescript
workers: process.env.CI ? 1 : undefined,
```

**Purpose:** Number of parallel workers

**Values:**
- Dev: `undefined` – Auto-detect (uses machine CPU count)
- CI: `1` – Single worker (sequential execution)

**Why CI uses 1 worker:**
- Frame/popup timing is consistent
- No flakiness from parallel race conditions
- Easier to debug failures

**Example values:**
```typescript
workers: 4,        // Run 4 tests at once
workers: 1,        // Sequential
workers: undefined // Auto-detect (CPU count)
```

#### reporter

```typescript
reporter: process.env.CI ? [['dot'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
```

**Purpose:** How to report test results

**Dev reporters:**
```typescript
[['list'], ['html', { open: 'never' }]]
```

- `'list'` – Detailed list output (readable in terminal)
- `'html'` – HTML report (in `playwright-report/`)
- `{ open: 'never' }` – Don't auto-open in browser

**Example output:**
```
✓ frames.spec.ts (2 tests)
✓ windows.spec.ts (2 tests)
```

**CI reporters:**
```typescript
[['dot'], ['html', { open: 'never' }]]
```

- `'dot'` – One character per test (compact for CI logs)
- `'html'` – HTML report (saved as artifact)
- `{ open: 'never' }` – Don't open in browser

**Example output:**
```
....
```

**Other reporters:**
```typescript
'list'      // Detailed list
'dot'       // One character per test
'json'      // Machine-readable JSON
'junit'     // JUnit XML (CI integration)
'html'      // Interactive HTML report
'github'    // GitHub Actions annotations
```

### use: Global Test Options

These apply to all tests unless overridden:

#### baseURL

```typescript
baseURL: 'https://testing.qaautomationlabs.com/',
```

**Purpose:** Base URL for all navigations

**How it works:**
```typescript
// With baseURL set:
await page.goto('iframe.php');
// ↓ Actually navigates to:
// https://testing.qaautomationlabs.com/iframe.php
```

**Benefits:**
- Shorter test code
- Easy to change environment (dev/staging/prod)
- Relative URLs work consistently

#### trace

```typescript
trace: 'on-first-retry',
```

**Purpose:** Record execution trace for debugging

**Options:**
- `'off'` – No trace
- `'on'` – Always record
- `'on-first-retry'` – Only on first retry
- `'retain-on-failure'` – Only if test fails

**Why `'on-first-retry'`?**
- Records when test fails and is retried
- Shows what went wrong before retry
- Saves disk space (not recording all tests)

**What's in a trace:**
- Browser actions (click, fill, etc.)
- Network requests
- Screenshots
- Console logs
- DOM snapshots

**Viewing a trace:**
```bash
npx playwright show-trace trace.zip
```

#### screenshot

```typescript
screenshot: 'only-on-failure',
```

**Purpose:** Capture screenshots

**Options:**
- `'off'` – No screenshots
- `'on'` – Always
- `'only-on-failure'` – Only when test fails

**Usage:** Debugging failed tests, visual regression detection

#### video

```typescript
video: 'retain-on-failure',
```

**Purpose:** Record video of test execution

**Options:**
- `'off'` – No video
- `'on'` – Always record
- `'retain-on-failure'` – Only when test fails
- `'on-first-retry'` – On first retry only

**Why `'retain-on-failure'`?**
- Video takes disk space
- Only useful for debugging failures
- Saves space for passing tests

**Video location:** `playwright-report/` (view via HTML report)

#### navigationTimeout

```typescript
navigationTimeout: 30_000,
```

**Purpose:** Timeout for page navigation (milliseconds)

**Value:** `30_000` = 30 seconds

**Used by:**
- `page.goto()`
- `page.reload()`
- `page.goBack()`

**Why 30s?**
- External site may be slow
- Network variability
- Longer than action timeout (allows time to fetch)

**Per-test override:**
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60_000);  // 60 seconds total
  await page.goto(url, { timeout: 45_000 });  // 45 seconds
});
```

#### actionTimeout

```typescript
actionTimeout: 10_000,
```

**Purpose:** Timeout for actions (milliseconds)

**Value:** `10_000` = 10 seconds

**Used by:**
- `locator.click()`
- `locator.fill()`
- `locator.select()`
- `expect()`

**Why 10s?**
- Standard interaction timing
- Shorter than navigation (most actions are local)
- Allows web-first waits to find elements

#### headless

```typescript
headless: false,
```

**Purpose:** Run browser in headless mode (no UI)

**Value:** `false` – Show browser window

**⚠️ Warning:** This is unusual! Most projects set `true` (default).

**Why set to false here?**
- Good for debugging locally
- See frame/modal interactions in real-time
- But CI won't see it (headless forced in CI)

**Better practice:**
```typescript
headless: process.env.CI ? true : false,
```

#### launchOptions

```typescript
launchOptions: {
  slowMo: 1000
}
```

**Purpose:** Browser launch options

**slowMo: 1000** – Slow down actions by 1 second each

**Why?**
- Makes frame/modal interactions visible
- Easier to watch what test is doing
- Good for debugging locally

**⚠️ Warning:** This slows down tests!

**Better practice:**
```typescript
launchOptions: process.env.CI ? {} : { slowMo: 1000 },
```

### projects: Browser Configurations

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
],
```

**Purpose:** Define which browsers/devices to test

**Current setup:** Only Chromium

**What `devices['Desktop Chrome']` includes:**
```typescript
{
  browserName: 'chromium',
  headless: true,
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
  userAgent: '...'  // Chrome user agent
}
```

**Multiple browsers:**
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
```

**Mobile devices:**
```typescript
projects: [
  { name: 'pixel5', use: { ...devices['Pixel 5'] } },
  { name: 'iphone12', use: { ...devices['iPhone 12'] } },
],
```

**To run specific project:**
```bash
npm test -- --project=chromium
npm test -- --project=firefox
```

## tsconfig.json

### Full Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "types": ["node", "@playwright/test"]
  },
  "include": ["playwright.config.ts", "e2e/**/*.ts"]
}
```

### Compiler Options

#### target

```json
"target": "ES2022",
```

**Purpose:** JavaScript version to compile to

**ES2022 features:**
- Modern async/await
- Arrow functions
- Classes
- Spread operator
- Promises

**Other options:**
- `ES5` – Very old (2009), rarely used
- `ES2020` – Modern but slightly older
- `ES2022` – Latest stable, good browser support

#### module

```json
"module": "CommonJS",
```

**Purpose:** Module system to generate

**CommonJS:**
```typescript
import { test } from '@playwright/test';
export const test;
```

**Becomes:**
```javascript
const test = require('@playwright/test').test;
module.exports = { test };
```

**Other options:**
- `ES2015` / `ES2020` / `ESNext` – Modern imports/exports
- `CommonJS` – Node.js default
- `AMD` – Old browser standard (rarely used)

**Why CommonJS?** Node.js default, works everywhere.

#### moduleResolution

```json
"moduleResolution": "Node",
```

**Purpose:** How to resolve imports

**Node resolution:**
```typescript
import { test } from '@playwright/test';
// Looks for:
// 1. node_modules/@playwright/test
// 2. node_modules/@playwright/test/index.js
// 3. node_modules/@playwright/test/package.json
```

**Other options:**
- `'classic'` – Old resolution algorithm
- `'node'` – Node.js algorithm (modern standard)

#### strict

```json
"strict": true,
```

**Purpose:** Enable all strict type checks

**Enables:**
- `noImplicitAny` – Can't use `any` without explicit type
- `strictNullChecks` – Can't use `null` without explicit type
- `strictFunctionTypes` – Stricter function type checking
- `strictBindCallApply` – Stricter `.call()/.bind()` checking

**Benefits:**
- Catch more errors at compile time
- Safer code
- Better IDE support

**Example:**
```typescript
// With strict: true
const x = null;  // ❌ Error: null not allowed
const x: string | null = null;  // ✅ OK: explicit type

function greet(name) {  // ❌ Error: implicit any
  console.log(name);
}

function greet(name: string) {  // ✅ OK: explicit type
  console.log(name);
}
```

#### noEmit

```json
"noEmit": true,
```

**Purpose:** Don't emit compiled `.js` files

**Why:** Playwright handles compilation internally (in-memory)

**If false:**
```
src/
├── test.ts
└── test.js  ← Compiled JavaScript file
```

**With noEmit (current):**
```
src/
└── test.ts  ← Only TypeScript, Playwright compiles on the fly
```

#### esModuleInterop

```json
"esModuleInterop": true,
```

**Purpose:** Better CommonJS/ES module compatibility

**Enables easier default imports:**
```typescript
// With esModuleInterop: true
import express from 'express';  // ✅ Works

// Without:
import * as express from 'express';  // ✅ Required
```

#### types

```json
"types": ["node", "@playwright/test"]
```

**Purpose:** Include type definitions for these packages

**Packages:**
- `"node"` – Node.js built-in types (fs, path, etc.)
- `"@playwright/test"` – Playwright test types (Page, Locator, etc.)

**What it enables:**
```typescript
import { Page } from '@playwright/test';
// Page type is known (IDE autocomplete, error checking)

import * as fs from 'fs';
// fs methods are known (Node.js types)
```

### include/exclude

#### include

```json
"include": ["playwright.config.ts", "e2e/**/*.ts"]
```

**Purpose:** Which files to compile

**Pattern:**
- `"playwright.config.ts"` – Specific file
- `"e2e/**/*.ts"` – All `.ts` files in e2e (and subdirectories)

**Matches:**
```
e2e/frames.spec.ts ✓
e2e/windows.spec.ts ✓
e2e/fixtures/test.ts ✓
e2e/pages/playlab-home.ts ✓
playwright.config.ts ✓
```

**Default exclude:**
```json
"exclude": ["node_modules", ".git"]
```

## package.json

### Full File

```json
{
  "name": "playwright-frames-and-windows",
  "version": "1.0.0",
  "private": true,
  "description": "Playwright automation for QA Automation Labs frames and modal popups",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@playwright/test": "^1.52.0",
    "typescript": "^5.7.2"
  }
}
```

### Metadata

#### name

```json
"name": "playwright-frames-and-windows",
```

Unique package identifier (for npm registry, if published)

#### version

```json
"version": "1.0.0",
```

Current version (follows [semantic versioning](https://semver.org/))

**Format:** `MAJOR.MINOR.PATCH`
- `1.0.0` – Initial release
- `1.1.0` – New features added
- `1.0.1` – Bug fix

#### private

```json
"private": true,
```

Prevents accidental npm publish

#### description

```json
"description": "Playwright automation for QA Automation Labs frames and modal popups",
```

Short description (used by npm, GitHub)

### scripts: npm Commands

Each script is a shortcut for running commands.

#### test

```json
"test": "playwright test"
```

**Run:**
```bash
npm test
```

**Does:** Runs Playwright test runner on all tests

**Equivalent to:**
```bash
npx playwright test
```

#### test:headed

```json
"test:headed": "playwright test --headed"
```

**Run:**
```bash
npm run test:headed
```

**Does:** Runs tests with browser window visible

**Options:**
- `--headed` – Show browser
- `--workers=1` – Run sequentially

#### test:debug

```json
"test:debug": "playwright test --debug"
```

**Run:**
```bash
npm run test:debug
```

**Does:** Launches Inspector for step-by-step debugging

**Features:**
- Pause before each action
- Step through code
- Inspect page state
- View element properties

#### report

```json
"report": "playwright show-report"
```

**Run:**
```bash
npm run report
```

**Does:** Opens the latest HTML test report in browser

**Opens:** `playwright-report/index.html`

### devDependencies

Development dependencies (only needed for testing, not production).

#### @playwright/test

```json
"@playwright/test": "^1.52.0"
```

**Purpose:** Test runner and browser automation framework

**Version:** `^1.52.0` means:
- Current: `1.52.0`
- Can update to: `1.52.x` or `1.53.x`, etc.
- Cannot: `2.0.0` (major version bump is breaking)

**What it provides:**
- `test()` function
- `expect()` assertion library
- `Page`, `Locator`, `FrameLocator` classes
- Browser automation APIs

#### typescript

```json
"typescript": "^5.7.2"
```

**Purpose:** TypeScript compiler

**Compiles:** `.ts` → `.js`

#### @types/node

```json
"@types/node": "^22.10.2"
```

**Purpose:** Type definitions for Node.js built-ins

**Enables:**
```typescript
import * as fs from 'fs';
// fs methods are type-checked
```

## Environment-Based Configuration

Tests behave differently based on the `CI` environment variable:

### Development (CI not set)

```bash
npm test
```

**Configuration applied:**
- ✅ Parallel workers (undefined = auto-detect)
- ✅ No retries (0)
- ✅ List reporter (readable)
- ✅ Browser visible (headless: false)
- ✅ Slow motion on (slowMo: 1000)

**For debugging:**
```bash
npm run test:headed
npm run test:debug
```

### Continuous Integration (CI=true)

```bash
CI=true npm test
```

**Configuration applied:**
- ✅ Single worker (1)
- ✅ Retries enabled (2)
- ✅ Compact reporter (dot)
- ✅ HTML report generated
- ✅ Browser headless
- ✅ No slow motion

## Modifying Configuration

### Add Firefox Browser

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
],
```

Run all projects:
```bash
npm test
```

Run only Firefox:
```bash
npm test -- --project=firefox
```

### Increase Timeout for Slow Tests

```typescript
use: {
  navigationTimeout: 60_000,  // 60 seconds
  actionTimeout: 20_000,      // 20 seconds
}
```

Or per-test:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(120_000);  // 2 minutes
});
```

### Change Base URL

```typescript
use: {
  baseURL: process.env.TEST_URL || 'https://testing.qaautomationlabs.com/',
}
```

Run against different environment:
```bash
TEST_URL=https://staging.example.com npm test
```

### Save All Artifacts

```typescript
use: {
  trace: 'on',
  screenshot: 'on',
  video: 'on',
}
```

## Best Practices

| Practice | Why |
|----------|-----|
| Use `baseURL` for relative navigation | Easy to change environments |
| Set retries in CI only | Dev needs fast feedback |
| Use single worker in CI | Consistent timing for popups/frames |
| Enable trace/screenshot on failure | Helps debug failures without slow recording all tests |
| Keep timeouts realistic | Too short = flaky, too long = slow feedback |
| Use strict TypeScript | Catch errors at compile time |
| Export config from function | Allows runtime configuration |

---

**Next:** [Running Tests](./9-Running-Tests.md)
