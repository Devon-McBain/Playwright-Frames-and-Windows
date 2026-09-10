# Setup and Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required

- **Node.js**: Version 18.0.0 or newer
  - Download: https://nodejs.org/
  - Verify: `node --version` (should output v18.0.0 or higher)
  - npm automatically installed with Node.js

- **Network Access**: Must have access to https://testing.qaautomationlabs.com/
  - Tests run against the live QA Automation Labs playground
  - No local server setup required

### Optional but Recommended

- **Git**: For cloning and managing the repository
  - Download: https://git-scm.com/
  
- **VS Code**: Recommended IDE with Playwright extension support
  - Download: https://code.visualstudio.com/
  - Extension: [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

## Installation Steps

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
- Reads dependencies from `package.json`
- Uses the committed `package-lock.json` for reproducible installs
- Installs Playwright as a dev dependency
- Sets up all TypeScript and testing tools

**What gets installed:**
- `@playwright/test`: ^1.52.0 - Playwright testing framework
- `typescript`: ^5.7.2 - TypeScript compiler
- `@types/node`: ^22.10.2 - Node.js type definitions

### 3. Install Browser Binaries

```bash
npx playwright install --with-deps chromium
```

This command:
- Downloads and installs Chromium browser binary
- Installs system dependencies (Linux only) with `--with-deps`
- Creates `.cache/ms-playwright` directory with browser files
- **Required**: Run this once per development environment or CI image

**Why `--with-deps`?**
- Ensures all system libraries are available on Linux systems
- On macOS and Windows, system dependencies are typically pre-installed
- Safe to run multiple times (skips already-installed dependencies)

#### For CI/CD Environments

In containerized CI environments:

```dockerfile
# During image build
RUN npm install
RUN npx playwright install --with-deps chromium
```

#### Troubleshooting Browser Installation

**Problem**: "Chromium executable not found"

```bash
# Re-run installation
npx playwright install --with-deps chromium

# Or clean and reinstall
npx playwright install --with-deps
rm -rf node_modules/.cache/ms-playwright
npx playwright install chromium
```

**Problem**: Missing system dependencies on Linux

```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 \
  libgtk-3-0 libgbm-dev libnss3 libxss1 libasound2

# Or use Playwright's system dependency installer
npx playwright install-deps chromium
```

## Verification

### Verify Installation

```bash
# Check Node.js
node --version
# Expected: v18.x.x or higher

# Check npm
npm --version
# Expected: 9.x.x or higher

# Check Playwright installation
npx playwright --version
# Expected: 1.52.0 or higher
```

### Run a Quick Test

```bash
# Run tests in headless mode
npm test

# Expected output:
# ✓ e2e/frames.spec.ts (2 tests)
# ✓ e2e/windows.spec.ts (2 tests)
# 4 passed (5s)
```

## Configuration

### Default Configuration

The project comes with sensible defaults in `playwright.config.ts`:

- **Browser**: Chromium
- **Base URL**: https://testing.qaautomationlabs.com/
- **Timeout**: 30 seconds per test
- **Retry**: 0 retries (locally), enabled in CI
- **Workers**: 4 (locally), 1 (CI)
- **Screenshot**: On failure
- **Video**: Retain on failure
- **Trace**: On first retry

### Environment Variables

Configure behavior with environment variables:

```bash
# Enable CI mode (retries, compact output, single worker)
CI=true npm test

# Run with specific trace mode
TRACE=on npm test

# Run with specific video mode
VIDEO=on npm test

# Run with specific screenshot mode
SCREENSHOT=on npm test
```

### Customizing Configuration

Edit `playwright.config.ts` to customize:

```typescript
// Increase timeout
timeout: 60_000,

// Enable retries
retries: 2,

// Change browser
use: { browser: 'firefox' },

// Add authentication/cookies
use: { storageState: 'auth.json' },
```

After changes, re-run tests:

```bash
npm test
```

## Development Setup

### Optional: Install VS Code Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Playwright Test"
4. Install "Playwright Test for VS Code" by Microsoft

**Features:**
- Run/debug tests from editor
- View test results inline
- Inspect elements during test
- Auto-generate locators

### Optional: Configure IDE

**VS Code settings** (`.vscode/settings.json`):

```json
{
  "[typescript]": {
    "editor.defaultFormatter": "ms-vscode.vscode-typescript-next"
  },
  "playwright.reuseBrowser": true
}
```

## Updating Dependencies

### Check for Updates

```bash
npm outdated
```

Shows outdated packages.

### Update Playwright

```bash
npm install @playwright/test@latest
npx playwright install chromium
```

### Update All Dependencies

```bash
npm update
npx playwright install chromium
```

### Update Lock File Only

```bash
npm ci
```

Uses exact versions from `package-lock.json` (recommended for CI).

## Uninstallation

To completely remove the project:

```bash
# Remove node_modules
rm -rf node_modules

# Remove Playwright cache
rm -rf ~/.cache/ms-playwright

# Remove test results
rm -rf playwright-report test-results

# Or simply delete the cloned directory
rm -rf Playwright-Frames-and-Windows
```

## Network Configuration

### Behind a Proxy

If behind a corporate proxy, configure npm:

```bash
npm config set proxy http://[user:password@]proxy.example.com:8080
npm config set https-proxy http://[user:password@]proxy.example.com:8080
npm config set registry https://registry.npmjs.org/

# Then install normally
npm install
npx playwright install chromium
```

### DNS Issues

If DNS resolution fails:

```bash
# Use Google DNS
npm config set strict-ssl false  # Not recommended for production

# Or configure system DNS
# Linux: Edit /etc/resolv.conf
# macOS: System Preferences → Network → DNS
# Windows: Settings → Network & Internet → Change adapter options
```

### Firewall/Blocked Ports

Ensure these are accessible:
- `https://registry.npmjs.org` (npm packages)
- `https://testing.qaautomationlabs.com` (playground)
- `https://api.github.com` (GitHub API, if installing from git)

## Common Setup Issues

### Issue: `npm install` fails with permission error

**Solution:**
```bash
# macOS/Linux: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Then reinstall
npm install
```

### Issue: Playwright installation hangs

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Increase timeout
npm config set fetch-timeout 60000

# Retry installation
npx playwright install chromium
```

### Issue: "Cannot find module '@playwright/test'"

**Solution:**
```bash
# Ensure dependencies are installed
npm install

# Check installation
npm ls @playwright/test
```

### Issue: Browser crashes during test

**Solution:**
```bash
# Reinstall browser with dependencies
npx playwright install --with-deps chromium

# On Linux, install system dependencies
npx playwright install-deps chromium
```

### Issue: Tests timeout connecting to playground

**Verify network access:**
```bash
# Check connectivity
ping testing.qaautomationlabs.com
curl https://testing.qaautomationlabs.com/

# Check firewall/proxy settings
npm config get proxy
npm config get https-proxy
```

## Next Steps

1. ✅ Verify installation with `npm test`
2. 📖 Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand project design
3. 🔍 Review [PAGE-OBJECTS.md](PAGE-OBJECTS.md) for available selectors
4. 🧪 Study [TESTS.md](TESTS.md) for test scenarios
5. 🐛 Bookmark [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for reference

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [QA Automation Labs Playground](https://testing.qaautomationlabs.com/)
