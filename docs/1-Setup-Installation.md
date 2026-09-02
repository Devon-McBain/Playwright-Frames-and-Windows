# Setup & Installation

This guide covers environment setup, dependency installation, and initial configuration to run the Playwright test suite locally or in CI.

## Prerequisites

Before installing, verify you have:

- **Node.js 18 or newer** – Check with `node --version`
- **npm** – Included with Node.js; check with `npm --version`
- **Git** – For cloning the repository
- **Network access** to `https://playwrightlab.github.io/` – Required by all tests
- **~500 MB disk space** – For Chromium browser and dependencies

### Optional but Recommended

- **Visual Studio Code** – With the "Playwright Test for VSCode" extension for test execution UI
- **Docker** – For CI environment replication
- **Linux development tools** – If on macOS/Windows, Docker is easier than native browser deps

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Devon-McBain/Playwright-Frames-and-Windows.git
cd Playwright-Frames-and-Windows
```

### 2. Install Node Dependencies

```bash
npm install
```

This command:
- Reads `package.json` and the committed `package-lock.json`
- Installs exact versions for reproducibility
- Places packages in `node_modules/`

**Why use the lockfile?** Every developer and CI system runs the same dependency versions, preventing "it works on my machine" issues.

### 3. Install Playwright Browser & Dependencies

```bash
npx playwright install --with-deps chromium
```

This command:
- Downloads the Chromium browser binary (~300 MB)
- Installs Linux system dependencies (glibc, libx11, etc.) if on Linux
- Caches the browser for reuse across test runs

**⚠️ Important:** Run this step:
- Once per development machine
- During Docker image setup (in CI)
- After upgrading Playwright in `package.json`

### 4. Verify Installation

```bash
npm test
```

Expected output:
```
✓ 5 passed (8s)
```

If all 5 tests pass, your environment is ready. If tests fail, see [Troubleshooting](./13-Troubleshooting.md).

## Project Dependencies

### Development Dependencies (from `package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `@playwright/test` | ^1.52.0 | Core test runner and browser automation API |
| `typescript` | ^5.7.2 | TypeScript compiler for `.ts` → `.js` transformation |
| `@types/node` | ^22.10.2 | Type definitions for Node.js built-in modules |

**No runtime dependencies** – The project only uses dev dependencies because it's a test suite, not a runtime application.

### Playwright API Breakdown

From `@playwright/test`, key exports used in this project:

- **`test`** – Base test fixture extended by custom fixtures
- **`expect`** – Assertion library for test validation
- **`Page`** – Main browser tab abstraction
- **`FrameLocator`** – API for scoping selectors inside iframes
- **`Locator`** – Element query object with web-first semantics
- **`devices`** – Pre-configured browser/device profiles

See [Playwright Framework Guide](./5-Playwright-Framework.md) for detailed usage.

## Environment Variables

### Development (optional)

The test suite automatically detects the development environment. No env vars required.

### Continuous Integration

Set the `CI` environment variable before running tests:

```bash
CI=true npm test
```

This enables:
- **Retries:** 2 automatic retries on failure
- **Single-worker mode:** Sequential execution for consistent frame/popup timing
- **Compact reporters:** Dot output to CI logs (quiet)
- **HTML report:** Saved to `playwright-report/` for artifacts
- **Failure artifacts:** Screenshots, videos, and traces retained

See [CI/CD Integration](./12-CI-CD.md) for full CI setup.

## Quick Start Commands

After setup, use these commands during development:

### Run All Tests
```bash
npm test
```
- Runs all tests in `e2e/*.spec.ts`
- Headless mode (no browser UI)
- Default: parallel workers, no retries
- Exit code 0 if all pass, 1 if any fail

### Run Tests in Browser
```bash
npm run test:headed
```
- Same tests, but you watch the browser in real-time
- Useful for observing frame navigation and popup timing
- Pause/step through actions manually

### Run Tests with Inspector
```bash
npm run test:debug
```
- Launches the Playwright Inspector
- Pause and step through test code line-by-line
- Inspect page state (DOM, console, network) at each step
- Essential for debugging timing or selector issues

### Run a Single Spec File
```bash
npm test -- e2e/frames.spec.ts
npm test -- e2e/windows.spec.ts
```
- Runs only tests in that file
- Faster feedback during focused development

### Run Tests Matching a Pattern
```bash
npx playwright test --grep "nested"
```
- Runs tests whose title contains "nested"
- Useful for testing a single scenario
- Supports regex: `--grep "nested|popup"`

### View HTML Report
```bash
npm run report
```
- Opens the latest test report in your default browser
- Shows test duration, screenshots, videos, and traces
- Auto-generated after each test run

### Run Tests in CI Mode Locally
```bash
CI=true npm test
```
- Mimics CI environment settings
- Enables retries and single-worker mode
- Helpful for debugging CI failures

## Typescript Compilation

Tests are written in TypeScript but run as JavaScript. The compilation is **implicit**:

1. Playwright's test runner detects `.ts` files
2. TypeScript is compiled in-memory via `tsconfig.json`
3. Compiled `.js` is cached and executed

**No manual compilation step is needed.** If there are TypeScript errors, `npm test` will report them and exit.

See [TypeScript Configuration](./8-Configuration.md#typescript-configuration) for compiler settings.

## File Structure After Setup

After `npm install` and `npx playwright install`, your directory looks like:

```
Playwright-Frames-and-Windows/
├── node_modules/              # Installed packages (includes @playwright/test)
├── .playwright/               # Cached Chromium browser binary
├── e2e/                        # Test files (unchanged)
├── docs/                       # Wiki (you are here)
├── playwright.config.ts        # Unchanged
├── package.json               # Unchanged
├── package-lock.json          # Unchanged
├── tsconfig.json              # Unchanged
└── README.md                  # Unchanged
```

## Troubleshooting Setup

### ❌ "Command not found: npm"
- Ensure Node.js is installed: `node --version`
- Restart your terminal after Node.js installation
- If on macOS with Homebrew: `brew install node`

### ❌ "Chromium executable not found"
```bash
npx playwright install --with-deps chromium
```
- Ensure you run `playwright install`, not just `npm install`

### ❌ "Missing Linux dependencies" (on Linux)
```bash
npx playwright install --with-deps chromium
```
- The `--with-deps` flag installs system packages automatically
- If using a restricted package manager, see your DevOps team

### ❌ "Cannot find module '@playwright/test'"
- Ensure `npm install` completed without errors
- Delete `node_modules/` and retry: `rm -rf node_modules && npm install`

### ❌ "Tests time out on network"
- Verify internet access to `https://playwrightlab.github.io/`
- Try running a single test: `npm test -- e2e/frames.spec.ts`
- Increase timeout if on slow network: See [Playwright Configuration](./8-Configuration.md)

## Next Steps

Once setup is complete:

1. **Understand the project:** Read [Project Structure](./2-Project-Structure.md)
2. **Learn the design:** Read [Architecture Overview](./3-Architecture.md)
3. **Run your first test:** Execute `npm test` and watch the browser with `npm run test:headed`
4. **Trace a test:** Pick `frames.spec.ts` and read [Test Strategy](./4-Test-Strategy.md)
5. **Modify a page object:** Edit `e2e/pages/iframe-form.ts` and read [Page Objects](./6-Page-Objects.md)

## Development Container / Docker

To run tests inside a container (recommended for CI):

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/playwright:v1.52.0-focal

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx playwright install --with-deps chromium

COPY . .
CMD ["npm", "test"]
```

Build and run:
```bash
docker build -t playwright-frames-windows .
docker run playwright-frames-windows
```

The official Playwright Docker image includes all system dependencies, so no `--with-deps` headaches.

---

**Next:** [Project Structure](./2-Project-Structure.md)
