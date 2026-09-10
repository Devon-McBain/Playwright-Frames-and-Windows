# Test Strategy

This guide explains the test organization philosophy, coverage approach, and how tests are written and structured in this project.

## Test Philosophy

### Core Principles

1. **Business-Focused** – Tests describe what users can do, not how the code works
2. **Semantic Labels** – Every test has a clear, human-readable name
3. **Independence** – Each test is standalone and doesn't depend on others
4. **Stability** – Tests assert observable behavior, not implementation details
5. **Maintainability** – Page objects encapsulate selectors; tests focus on behavior

### Why These Principles Matter

- **Business-focused:** Non-technical stakeholders can read test names and understand coverage
- **Semantic labels:** Test reports are self-documenting; no guessing what a test does
- **Independence:** Tests can run in any order; failures don't cascade
- **Stability:** UI changes don't break tests if behavior stays the same
- **Maintainability:** Updating a selector fixes 10 tests at once, not 10 places

## Test Coverage Summary

### Current Test Suite

| Area | File | Tests | Coverage |
|------|------|-------|----------|
| **Iframes** | `frames.spec.ts` | 2 | Basic iframe interaction (iframe 1 & 2) |
| **Popups/Modals** | `windows.spec.ts` | 2 | Modal open & close |
| **Total** | | 4 | Frame & window/modal interactions |

### Coverage by Scenario

#### Frame Tests (frames.spec.ts)

```typescript
test.describe('Frames | labeled frame interactions', () => {
  test('interacts with iframe 1', async ({ playLab }) => {
    // Validates: Navigate to frames section, access iframe 1, verify heading, verify button
  });

  test('interacts with iframe 2', async ({ playLab }) => {
    // Validates: Navigate to frames section, access iframe 2, verify heading, verify button
  });
});
```

**What's tested:**
- ✅ Navigation to frames section
- ✅ Access multiple iframes via FrameLocator
- ✅ Verify iframe content (text, visibility)
- ✅ Interact with iframe elements

**What's not tested (future work):**
- ❌ Nested frames (frames within frames)
- ❌ Cross-origin iframe access
- ❌ Form submission within iframe
- ❌ Reading frame content from Node.js

#### Window/Modal Tests (windows.spec.ts)

```typescript
test.describe('Windows | labeled popup interactions', () => {
  test('opens the success modal popup', async ({ playLab }) => {
    // Validates: Navigate to windows section, click modal button, verify modal visible
  });

  test('closes the success modal popup', async ({ playLab }) => {
    // Validates: Navigate, open modal, close modal, verify modal hidden
  });
});
```

**What's tested:**
- ✅ Navigation to windows section
- ✅ Opening a modal popup
- ✅ Modal visibility and content
- ✅ Closing a modal popup

**What's not tested (future work):**
- ❌ New tab (`target="_blank"`) handling
- ❌ `window.open()` popup handling
- ❌ Multiple simultaneous popups
- ❌ Cross-window communication

## Test Structure

### Anatomy of a Test

```typescript
test('descriptive test name', async ({ playLab, loginPage }) => {
  // 1. ARRANGE: Set up the test state
  await playLab.openFrames();
  
  // 2. ACT: Perform the action under test
  const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
  
  // 3. ASSERT: Verify the expected outcome
  await expect(frame.locator('[data-testid="iframe1-heading"]'))
    .toHaveText('I am iFrame 1');
});
```

### Test Naming Convention

Each test follows the pattern:

```
test('<feature area> | <scenario description>', async () => {
```

**Examples from this project:**

- `'Frames | labeled frame interactions'` (describe block)
- `'interacts with iframe 1'` (specific test)
- `'Windows | labeled popup interactions'` (describe block)
- `'opens the success modal popup'` (specific test)

**Benefits:**
- Test reports are self-documenting
- Search is predictable (`grep "Frames"` finds all frame tests)
- Scope is immediately clear in traces and videos

## Test Organization

### By File

```
e2e/
├── frames.spec.ts          # All frame-related tests (2 tests)
└── windows.spec.ts         # All window/modal-related tests (2 tests)
```

**Principle:** Group related tests by feature area.

### By Test.describe() Block

```typescript
test.describe('Frames | labeled frame interactions', () => {
  // All tests in this group share the same feature scope
  test('interacts with iframe 1', () => {});
  test('interacts with iframe 2', () => {});
});

test.describe('Windows | labeled popup interactions', () => {
  test('opens the success modal popup', () => {});
  test('closes the success modal popup', () => {});
});
```

**Benefits:**
- Group related tests logically
- Scope is clear in test output
- Can run a single describe block: `npm test -- --grep "Frames"`

## Assertion Patterns

### Pattern 1: Element Visibility

```typescript
// ✅ Good: Web-first, automatic retry
await expect(frame.locator('[data-testid="iframe1-heading"]')).toBeVisible();

// ❌ Bad: No retry, timing-dependent
expect(await frame.locator('[data-testid="iframe1-heading"]').isVisible()).toBe(true);
```

### Pattern 2: Text Content

```typescript
// ✅ Good: Exact match, automatic retry
await expect(frame.locator('[data-testid="iframe1-heading"]'))
  .toHaveText('I am iFrame 1');

// ✅ Also good: Partial match
await expect(playLab.successModalBody).toContainText('Modal Popup Body');

// ❌ Bad: No automatic wait
expect(await locator.textContent()).toContain('expected text');
```

### Pattern 3: Modal/Visibility State

```typescript
// ✅ Good: Verify modal is visible
await expect(playLab.successModal).toBeVisible();

// ✅ Good: Verify modal is hidden
await expect(playLab.successModal).toBeHidden();

// ❌ Bad: Arbitrary sleep
await page.waitForTimeout(1000);
expect(isVisible).toBe(true);
```

## Selector Strategy

### data-testid Selectors

All selectors in page objects use `data-testid`:

```typescript
// From playlab-home.ts
readonly iframe1: Locator = page.locator('[data-testid="iframe-frame-1"]');
readonly successModal: Locator = page.locator('[data-testid="modal-success"]');

// From iframe-form.ts
readonly nameInput = frame.locator('[data-testid="iframe-input-name"]');
readonly submitButton = frame.locator('[data-testid="iframe-submit"]');
```

**Why `data-testid`?**
- Developers can change CSS/layout without breaking tests
- Clear "this element is automatable" contract
- Decoupled from styling and structure
- Framework-agnostic (works with any frontend framework)

**What not to use:**
```typescript
// ❌ Brittle: changes with styling
page.locator('.btn-primary')
page.locator('#main > section > button:nth-child(3)')

// ❌ Fragile: DOM structure dependent
page.locator('button >> nth=2')
```

## Test Execution Modes

### Development (Local)

```bash
npm test
```

**Configuration:**
- ✅ Parallel execution (multiple workers)
- ✅ Headless mode (no browser window)
- ✅ No retries (fast feedback on failure)
- ✅ List reporter (readable output)
- ✅ HTML report generated

**Use when:** Writing/debugging tests locally

### Development with Browser (Headed)

```bash
npm run test:headed
```

**Configuration:**
- ✅ Parallel execution
- ✅ Browser window visible
- ✅ No retries
- ✅ Watch frame/modal interactions in real-time

**Use when:** Observing how tests interact with the app

### Debugging

```bash
npm run test:debug
```

**Configuration:**
- ✅ Single worker (sequential)
- ✅ Inspector paused at test start
- ✅ Step through code line-by-line
- ✅ Inspect page state at each step

**Use when:** Understanding why a test fails

### Continuous Integration

```bash
CI=true npm test
```

**Configuration:**
- ✅ Single worker (consistent popup/frame timing)
- ✅ Retries enabled (2 attempts per test)
- ✅ Compact output (CI logs)
- ✅ HTML report saved to `playwright-report/`
- ✅ Screenshots/videos on failure

**Use when:** Running in CI/CD pipeline

## Test Data Strategy

### Embedded Test Data

Tests use hardcoded expected values (no external data files):

```typescript
test('interacts with iframe 1', async ({ playLab }) => {
  await playLab.openFrames();
  
  const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
  
  // Expected text is hardcoded
  await expect(frame.locator('[data-testid="iframe1-heading"]'))
    .toHaveText('I am iFrame 1');  // ← Known at test time
});
```

**Benefits:**
- Tests are self-contained
- No external file dependencies
- Easy to understand what's being tested
- Easy to add new tests

### Future Considerations

If test data grows, consider:
- External JSON fixture files
- Environment-based data
- Parameterized tests with `test.describe.each()`

## Test Dependencies & Isolation

### Dependency Structure

```
Each test is independent ✓

frames.spec.ts test 1 → Does not depend on test 2
frames.spec.ts test 2 → Does not depend on test 1
windows.spec.ts test 1 → Does not depend on frame tests
windows.spec.ts test 2 → Does not depend on test 1
```

### Why Independence Matters

✅ Tests can run in any order
✅ Tests can run in parallel
✅ One failure doesn't cascade to others
✅ Easier to debug (isolate issues)
✅ Can run individual tests during development

### Per-Test Fixture Initialization

Each test gets fresh fixtures:

```typescript
// Frame tests use playLab fixture
test('interacts with iframe 1', async ({ playLab }) => {
  // playLab is a fresh instance of PlayLabHome
  await playLab.openFrames();
});

test('interacts with iframe 2', async ({ playLab }) => {
  // playLab is a fresh instance, separate from test 1
  await playLab.openFrames();
});
```

## Reporting

### Local Test Report

After any test run:
```bash
npm run report
```

Opens `playwright-report/index.html` with:
- ✅ Test summary (pass/fail, duration)
- ✅ Individual test details
- ✅ Screenshots on failure
- ✅ Videos on failure
- ✅ Execution traces

### CI Test Report

GitHub Actions stores test artifacts:
- HTML report in workflow artifacts
- Can download and view locally
- Screenshots and videos of failures

## Metrics & Monitoring

### Current Metrics

| Metric | Value |
|--------|-------|
| Total Tests | 4 |
| Estimated Runtime | < 15 seconds |
| Coverage | Frame & modal interactions |
| Flakiness | None (all deterministic) |
| Environment | Chromium only |

### Future Metrics to Track

- Test execution time trends
- Flake rate (if any)
- Coverage by feature area
- Browser compatibility (add Firefox, WebKit)

## Common Test Patterns

### Pattern 1: Navigate → Verify Element

```typescript
test('interacts with iframe 1', async ({ playLab }) => {
  await playLab.openFrames();  // Navigate
  
  const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
  await expect(frame.locator('[data-testid="iframe1-heading"]'))
    .toHaveText('I am iFrame 1');  // Verify
});
```

**Use for:** Page loads, element visibility, content verification

### Pattern 2: Navigate → Interact → Verify

```typescript
test('closes the success modal popup', async ({ playLab }) => {
  await playLab.openWindows();  // Navigate
  
  await playLab.successModalButton.click();  // Interact (open)
  await playLab.successModal.locator('[data-testid="modal-success-close-btn"]')
    .click();  // Interact (close)
  
  await expect(playLab.successModal).toBeHidden();  // Verify
});
```

**Use for:** User workflows, form submission, multi-step interactions

## Best Practices

### ✅ Do

- Use page objects for all selectors
- Use `data-testid` for all locators
- Name tests with clear, descriptive text
- Use semantic assertions (`toHaveText`, `toBeVisible`, etc.)
- Keep tests independent
- Group related tests in describe blocks
- Use fixtures for per-test setup

### ❌ Don't

- Use CSS selectors (`.btn-primary`)
- Use XPath unless absolutely necessary
- Hardcode selectors in tests
- Use arbitrary `sleep()` calls
- Depend on test execution order
- Mix multiple concerns in one test
- Use global setup/teardown for test isolation

## Maintenance & Updates

### Updating a Selector

If an element's selector changes:

1. Update only the page object
2. All tests using that page object automatically update

**Example:**
```typescript
// playlab-home.ts
readonly iframe1: Locator = page.locator('[data-testid="iframe-frame-1"]');
// ↑ Change selector here once

// frames.spec.ts (no changes needed)
test('interacts with iframe 1', async ({ playLab }) => {
  const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
  // ↑ Uses the page object property
});
```

### Adding a New Test

1. Create a new `test()` block in the appropriate `.spec.ts` file
2. Follow the naming convention
3. Use existing page objects or create new ones
4. Run `npm test` to verify

See [Development Workflow](./14-Development-Workflow.md) for detailed steps.

---

**Next:** [Playwright Framework Guide](./5-Playwright-Framework.md)
