# Playwright Frames and Windows

An enterprise-style Playwright test project for the [QA Automation Labs playground](https://testing.qaautomationlabs.com/).
The suite demonstrates labeled page objects and fixtures for independent iframes and
modal popup interactions.

## Project structure

```text
.
├── e2e/
│   ├── fixtures/test.ts          # Shared labeled test fixture
│   ├── pages/
│   │   └── playlab-home.ts       # Frames and popup entry points
│   ├── frames.spec.ts             # Independent iframe workflows
│   └── windows.spec.ts            # Modal popup workflows
├── playwright.config.ts          # Projects, retries, traces, and reporters
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js 18 or newer
- Network access to `https://testing.qaautomationlabs.com/`
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

# Run one scenario by part of its title.
npx playwright test --grep "iframe 1"

# Watch the browser or step through the test with the inspector.
npm run test:headed
npm run test:debug
```

Use `npm run report` after a run to open the HTML report. `test:headed` is useful
for observing frame navigation; `test:debug` opens the Playwright inspector.

## When to run the tests

- Run `npm test` before opening a pull request or after changing fixtures, page
	objects, selectors, Playwright configuration, or browser dependencies.
- Run `npm test -- e2e/frames.spec.ts` when changing iframe markup or frame
	traversal.
- Run `npm test -- e2e/windows.spec.ts` when changing modal popup handling or
	modal markup.
- Run the headed or debug command when a test passes or fails unexpectedly and you
	need to observe the browser state.
- Run with `CI=true npm test` in continuous integration or before merging a CI
	configuration change. CI enables retries and produces failure artifacts.

These tests are especially valuable as focused Playwright training examples and
as regression checks for iframe and modal behavior. They exercise behavior that
ordinary page tests often miss: locating controls inside independent frames and
verifying modal visibility and dismissal.

## Coverage

The suite currently verifies:

- Independent iframe traversal through Playwright's frame locator API
- Frame-specific headings and controls inside both embedded frames
- Modal popup opening and closing

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
- **Navigation timeout:** verify network access to the playground and retry; the suite
  intentionally tests a live external site rather than starting a local web server.

- **Modal timeout:** confirm the modal open button and modal `data-testid` values in
	the playground before changing a page object selector.
- **Frame locator timeout:** confirm the iframe's `data-testid` in the playground before
	changing a page object selector.

## Design conventions

- Test files describe user behavior; page objects own selectors and interactions.
- `data-testid` selectors are preferred for the playground's stable automation contract.
- Every frame/modal has a semantic label in the test title and trace output.
- Assertions use web-first Playwright assertions, with no arbitrary sleeps.
