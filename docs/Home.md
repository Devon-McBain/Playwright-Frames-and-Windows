# Playwright Frames and Windows – Complete Documentation

Welcome to the comprehensive Wiki for the **Playwright Frames and Windows** test suite. This project demonstrates enterprise-grade automation patterns for testing complex browser interactions including iframes, nested frames, cross-origin frames, new tabs, and popup windows using the Playwright framework.

## 📋 Quick Navigation

### Getting Started
- **[Setup & Installation](./1-Setup-Installation.md)** – Prerequisites, environment setup, and first run
- **[Quick Start Commands](./1-Setup-Installation.md#quick-start-commands)** – Common npm scripts and how to use them
- **[Project Structure](./2-Project-Structure.md)** – Directory layout and file organization

### Core Architecture & Design
- **[Architecture Overview](./3-Architecture.md)** – System design, component interactions, and data flow
- **[Design Conventions](./3-Architecture.md#design-conventions)** – Code standards, naming patterns, and best practices
- **[Technology Stack](./3-Architecture.md#technology-stack)** – Dependencies and their roles

### Test Implementation
- **[Test Strategy](./4-Test-Strategy.md)** – Test coverage, naming, and organization philosophy
- **[Playwright Framework Guide](./5-Playwright-Framework.md)** – Core Playwright APIs and patterns used
- **[Page Objects](./6-Page-Objects.md)** – How page objects are structured and used
- **[Fixtures & Setup](./7-Fixtures-Setup.md)** – Custom fixtures and test initialization

### Configuration & Execution
- **[Playwright Configuration](./8-Configuration.md)** – `playwright.config.ts` deep-dive
- **[TypeScript Configuration](./8-Configuration.md#typescript-configuration)** – `tsconfig.json` settings
- **[Running Tests](./9-Running-Tests.md)** – All test execution patterns and options

### Advanced Topics
- **[Frames Deep Dive](./10-Frames-Deep-Dive.md)** – Same-origin, nested, cross-origin iframe handling
- **[Windows & Contexts](./11-Windows-Contexts.md)** – New tabs, popups, and browser context management
- **[CI/CD Integration](./12-CI-CD.md)** – GitHub Actions, Docker, and continuous integration
- **[Troubleshooting](./13-Troubleshooting.md)** – Common issues and solutions
- **[Development Workflow](./14-Development-Workflow.md)** – Pull request process and development patterns

## 🎯 What This Project Does

This is an **enterprise-style test suite** for the [PlayLab sandbox](https://playwrightlab.github.io/), an interactive Playwright learning environment. The project demonstrates:

1. **Frame Automation** – Interacting with form elements inside single-origin iframes, navigating nested frame hierarchies, and reading content from cross-origin frames
2. **Window Management** – Opening and interacting with new tabs and popup windows
3. **Page Objects & Fixtures** – Labeled, semantic components that make tests readable and maintainable
4. **Enterprise Patterns** – CI/CD integration, configuration management, and professional test organization

## 🏗️ Project at a Glance

```
DevOps & Configuration
├── playwright.config.ts     ← Test execution, retries, reporters, timeouts
├── tsconfig.json           ← TypeScript compilation settings
├── package.json            ← Dependencies & scripts
└── .github/workflows/      ← CI/CD (if configured)

Test Suites
├── e2e/frames.spec.ts      ← Same-origin, nested, and cross-origin frame tests
└── e2e/windows.spec.ts     ← New tab and popup window tests

Infrastructure
├── e2e/fixtures/test.ts    ← Custom test fixture extending @playwright/test
└── e2e/pages/              ← Page objects for semantic test code
    ├── playlab-home.ts     ← Main navigation and frame/window entry points
    ├── iframe-form.ts      ← Form interaction abstraction
    └── login-page.ts       ← Secondary destination for new tabs/popups
```

## 🚀 Quick Start

**For existing team members:**
```bash
npm install
npx playwright install --with-deps chromium
npm test
```

**For new developers:**
1. Read **[Setup & Installation](./1-Setup-Installation.md)** – 5 min
2. Read **[Project Structure](./2-Project-Structure.md)** – 3 min
3. Read **[Architecture Overview](./3-Architecture.md)** – 10 min
4. Run `npm test` and review **[Test Strategy](./4-Test-Strategy.md)** – 5 min
5. Pick a test, trace through **[Page Objects](./6-Page-Objects.md)** – 10 min

## 📚 Understanding the Project by Role

### **QA Engineer / Test Developer**
Start with:
1. [Setup & Installation](./1-Setup-Installation.md)
2. [Test Strategy](./4-Test-Strategy.md)
3. [Page Objects](./6-Page-Objects.md)
4. [Running Tests](./9-Running-Tests.md)
5. [Frames Deep Dive](./10-Frames-Deep-Dive.md)
6. [Windows & Contexts](./11-Windows-Contexts.md)

Then explore individual tests and modify page objects as needed.

### **DevOps / CI Engineer**
Start with:
1. [Setup & Installation](./1-Setup-Installation.md)
2. [Playwright Configuration](./8-Configuration.md)
3. [CI/CD Integration](./12-CI-CD.md)
4. [Troubleshooting](./13-Troubleshooting.md)

Focus on configuration, environment setup, and test execution patterns.

### **Tech Lead / Architect**
Start with:
1. [Architecture Overview](./3-Architecture.md)
2. [Design Conventions](./3-Architecture.md#design-conventions)
3. [Test Strategy](./4-Test-Strategy.md)
4. [Playwright Framework Guide](./5-Playwright-Framework.md)

Review design decisions, architectural patterns, and extension points.

### **New Team Member (Full Path)**
1. [Quick Start Commands](./1-Setup-Installation.md#quick-start-commands) – 2 min
2. [Project Structure](./2-Project-Structure.md) – 5 min
3. [Architecture Overview](./3-Architecture.md) – 15 min
4. [Test Strategy](./4-Test-Strategy.md) – 10 min
5. [Playwright Framework Guide](./5-Playwright-Framework.md) – 20 min
6. [Page Objects](./6-Page-Objects.md) – 15 min
7. Run tests and trace through code – 30 min
8. [Development Workflow](./14-Development-Workflow.md) – 10 min

## 🔑 Key Concepts

| Concept | Page | What It Is |
|---------|------|-----------|
| **Page Object** | [Page Objects](./6-Page-Objects.md) | A class that encapsulates selectors and interactions for a page or component |
| **Fixture** | [Fixtures & Setup](./7-Fixtures-Setup.md) | A reusable test dependency (e.g., pre-configured page objects) injected per test |
| **FrameLocator** | [Frames Deep Dive](./10-Frames-Deep-Dive.md) | Playwright API for scoping selectors inside iframes |
| **Context** | [Windows & Contexts](./11-Windows-Contexts.md) | A browser session with isolated cookies, local storage, and pages |
| **Popup** | [Windows & Contexts](./11-Windows-Contexts.md) | A new page opened by `window.open()` in the same context |
| **Test Project** | [Playwright Configuration](./8-Configuration.md) | A browser/device configuration for running the full test suite |

## ✅ Test Coverage Summary

| Area | Tests | Details |
|------|-------|---------|
| **Same-Origin Frames** | 1 | Form entry, selection, checkbox state, submission, result text |
| **Nested Frames** | 1 | Frame hierarchy traversal from outer to inner frame |
| **Cross-Origin Frames** | 1 | Content access via FrameLocator without DOM access from Node.js |
| **New Tabs** | 1 | Navigation, URL verification, element interaction |
| **Popup Windows** | 1 | Window.open() handling, context isolation, page assertion |

All tests use `data-testid` selectors (not CSS) and assert business-visible behavior rather than implementation details.

## 🔗 Important Files Quick Reference

| File | Purpose | Lines |
|------|---------|-------|
| `playwright.config.ts` | Test execution config, timeouts, reporters | 21 |
| `e2e/fixtures/test.ts` | Custom test base with page objects | 18 |
| `e2e/pages/playlab-home.ts` | Entry point navigation & frame locators | 42 |
| `e2e/pages/iframe-form.ts` | Form interaction abstraction | 27 |
| `e2e/pages/login-page.ts` | Secondary destination validation | 10 |
| `e2e/frames.spec.ts` | 3 frame tests (same-origin, nested, cross-origin) | 39 |
| `e2e/windows.spec.ts` | 2 window tests (new tab, popup) | 31 |

## 🆘 Getting Help

- **Test won't run?** → [Troubleshooting](./13-Troubleshooting.md)
- **Don't understand a test?** → [Test Strategy](./4-Test-Strategy.md) + [Playwright Framework Guide](./5-Playwright-Framework.md)
- **Need to add a test?** → [Development Workflow](./14-Development-Workflow.md)
- **Frame selector timing out?** → [Frames Deep Dive](./10-Frames-Deep-Dive.md#troubleshooting)
- **Popup not detected?** → [Windows & Contexts](./11-Windows-Contexts.md#popup-handling)
- **CI is failing?** → [CI/CD Integration](./12-CI-CD.md)

## 📖 Document Conventions

Throughout this Wiki:
- **Code blocks** show actual file contents or example commands
- **Bold text** highlights key terms defined in the glossary
- **Links** point to related sections for deeper understanding
- **Examples** use real selectors and test data from this project
- **⚠️ Warnings** flag common mistakes and gotchas

---

**Last updated:** 2026  
**Project version:** 1.0.0  
**Playwright version:** 1.52.0
