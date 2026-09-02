# Playwright Frames and Windows

A Playwright test project for the [PlayLab sandbox](https://playwrightlab.github.io/).
The suite demonstrates labeled page objects and fixtures for iframes, nested frames,
cross-origin frames, new tabs, and popup windows.

## Project structure

```text
.
├── e2e/
│   ├── fixtures/test.ts          # Shared labeled test fixture
│   ├── pages/
│   │   ├── iframe-form.ts        # Controls inside iframe-content.html
│   │   ├── login-page.ts         # Shared new-tab/popup destination
│   │   └── playlab-home.ts       # Frames and windows entry points
│   ├── frames.spec.ts             # Same-origin, nested, and external frames
│   └── windows.spec.ts            # New tab and popup workflows
├── playwright.config.ts          # Projects, retries, traces, and reporters
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js 18 or newer
- Network access to `https://playwrightlab.github.io/`
- Chromium and its Linux dependencies, installed by the command below

## Install and run

```bash
npm install
npx playwright install --with-deps chromium
npm test
```

`npm install` uses the committed lockfile for reproducible dependency resolution.
The browser install is required once per development container or CI image.

Useful commands:

```bash
# Run all frame and window scenarios.
npm test

# Run only one behavior area.
npm test -- e2e/frames.spec.ts
npm test -- e2e/windows.spec.ts

# Run one labeled scenario by part of its title.
npx playwright test --grep "nested"

# Watch the browser or step through the test with the inspector.
npm run test:headed
npm run test:debug
```

Use `npm run report` after a run to open the HTML report. `test:headed` is useful
for observing frame navigation; `test:debug` opens the Playwright inspector.

## When to run the tests

- Run `npm test` before opening a pull request or after changing fixtures, page
	objects, selectors, Playwright configuration, or browser dependencies.
- Run `npm test -- e2e/frames.spec.ts` when changing iframe markup, nested frame
	traversal, cross-origin behavior, or the embedded form.
- Run `npm test -- e2e/windows.spec.ts` when changing popup handling, new-tab
	navigation, login-page markup, or browser context behavior.
- Run the headed or debug command when a test passes or fails unexpectedly and you
	need to observe the browser state.
- Run with `CI=true npm test` in continuous integration or before merging a CI
	configuration change. CI enables retries and produces failure artifacts.

These tests are especially valuable as focused Playwright training examples and
as regression checks for browser-context boundaries. They exercise behavior that
ordinary page tests often miss: locating controls inside frames, crossing nested
frame boundaries, and attaching popup listeners before a user action creates a
new page.

## Coverage

The suite currently verifies:

- Same-origin iframe form entry, selection, checkbox state, submission, and result text
- Nested iframe traversal from the outer frame to the inner form
- Cross-origin iframe content access through Playwright's frame locator API
- New-tab navigation to the shared login page
- Popup-window navigation to the shared login page

The tests deliberately assert stable `data-testid` contracts and business-visible
results instead of CSS layout or implementation-specific frame URLs.

## CI guidance

Run the browser dependency installation during image setup, then execute `npm test`
with `CI=true`. CI enables retries, single-worker execution, compact output, and
HTML reporting. On failure, Playwright retains the screenshot and video and records
a trace on the first retry. The generated report is written to `playwright-report/`.

For pull requests, Chromium is the fast required check. Add Firefox and WebKit as
separate projects when the suite needs a browser compatibility matrix.

## Troubleshooting

- **Browser executable missing:** run `npx playwright install --with-deps chromium`.
- **Navigation timeout:** verify network access to the sandbox and retry; the suite
  intentionally tests a live external site rather than starting a local web server.
- **Popup timeout:** keep the `waitForEvent('popup')` listener before the button click.
- **Frame locator timeout:** confirm the iframe's `data-testid` in the sandbox before
	changing a page object selector.

## Design conventions

- Test files describe user behavior; page objects own selectors and interactions.
- `data-testid` selectors are preferred for the sandbox's stable automation contract.
- Every frame/window has a semantic label in the test title and trace output.
- `page.waitForEvent('popup')` and `context.waitForEvent('page')` are armed before
	the click that creates the new browsing context.
- Assertions use web-first Playwright assertions, with no arbitrary sleeps.
