from:

```ts
test('candidate can be created', async ({ page }) => {
  await page.goto('/candidates');
  await page.getByRole('button', { name: 'New Candidate' }).click();
  await page.getByLabel('First name').fill('John');
  await page.getByLabel('Last name').fill('Smith');
  await page.getByLabel('Email').fill('john@test.com');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Candidate created')).toBeVisible();
});
```

to an enterprise-quality Playwright framework is **not primarily about adding more Playwright commands**.

It is about changing the **level at which the test expresses behaviour**.

A useful target is:

```text
                         ENTERPRISE TEST
                              │
                    "What are we proving?"
                              │
                              ▼
                       BUSINESS WORKFLOW
                              │
                 "How does the user do it?"
                              │
                              ▼
                    PAGE / COMPONENT API
                              │
                  "How does the UI work?"
                              │
                              ▼
                    PLAYWRIGHT LOCATORS
                              │
                              ▼
                         APPLICATION
```

The test should increasingly live at the top of that diagram.

---

# 1. First, understand what you are trying to eliminate

The junior pattern is not inherently bad:

```ts
test('create candidate', async ({ page }) => {
  await page.goto('/candidates');
  await page.getByRole('button', { name: 'New Candidate' }).click();
  await page.getByLabel('First name').fill('John');
  await page.getByLabel('Last name').fill('Smith');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(...).toBeVisible();
});
```

It becomes problematic when **every test is written this way**.

Imagine 100 tests containing:

```ts
page.goto(...)
page.getByRole(...)
page.getByLabel(...)
page.locator(...)
page.click(...)
page.fill(...)
expect(...)
```

You now have:

* UI implementation details everywhere
* duplicated workflows
* duplicated selectors
* duplicated authentication
* duplicated test data
* difficult maintenance
* poor reuse
* tests that are difficult to read as requirements
* changes to the UI potentially affecting dozens of tests

The issue is therefore not:

> "I am using `getByRole()`."

That is actually a good Playwright practice.

The issue is:

> **The test itself knows too much about the UI implementation.**

---

# 2. The first architectural step: Page Objects

Start by moving UI mechanics out of the test.

### Test

```ts
test('recruiter can create a candidate', async ({ page }) => {
  const candidatePage = new CandidatePage(page);

  await candidatePage.open();

  await candidatePage.createCandidate({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@test.com'
  });

  await candidatePage.expectCandidateToExist('John Smith');
});
```

### Page Object

```ts
export class CandidatePage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/candidates');
  }

  async createCandidate(candidate: Candidate): Promise<void> {
    await this.page.getByRole('button', {
      name: 'New Candidate'
    }).click();

    await this.page.getByLabel('First name')
      .fill(candidate.firstName);

    await this.page.getByLabel('Last name')
      .fill(candidate.lastName);

    await this.page.getByLabel('Email')
      .fill(candidate.email);

    await this.page.getByRole('button', {
      name: 'Save'
    }).click();
  }

  async expectCandidateToExist(name: string): Promise<void> {
    await expect(
      this.page.getByRole('row', { name })
    ).toBeVisible();
  }
}
```

Already, your test is substantially more readable.

But **do not stop here**.

---

# 3. The next level: do not make Page Objects just collections of clicks

This is one of the most common mistakes in enterprise Playwright frameworks.

Bad abstraction:

```ts
await candidatePage.clickNewCandidate();
await candidatePage.enterFirstName('John');
await candidatePage.enterLastName('Smith');
await candidatePage.enterEmail('john@test.com');
await candidatePage.clickSave();
```

You have merely moved the junior implementation somewhere else.

The test still describes UI mechanics.

Prefer:

```ts
await candidatePage.createCandidate(candidate);
```

The Page Object exposes a **meaningful operation**.

This is an important principle:

> **Expose business-relevant operations, not individual browser actions.**

---

# 4. Then introduce domain objects

Instead of passing loose strings around:

```ts
await candidatePage.createCandidate(
  'John',
  'Smith',
  'john@test.com'
);
```

create a domain model:

```ts
export interface Candidate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}
```

Then:

```ts
const candidate: Candidate = {
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@test.com'
};

await candidatePage.createCandidate(candidate);
```

Now your automation begins to model the **application domain** rather than merely the browser.

---

# 5. Next: test data factories

Hard-coded test data becomes a serious problem as the suite grows.

Instead of:

```ts
const candidate = {
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@test.com'
};
```

use:

```ts
const candidate = candidateFactory.create();
```

For example:

```ts
export const candidateFactory = {
  create(overrides: Partial<Candidate> = {}): Candidate {
    return {
      firstName: 'Test',
      lastName: 'Candidate',
      email: `candidate-${Date.now()}@example.com`,
      ...overrides
    };
  }
};
```

Then tests can be explicit when necessary:

```ts
const candidate = candidateFactory.create({
  firstName: 'John',
  lastName: 'Smith'
});
```

Or:

```ts
const candidate = candidateFactory.create({
  email: existingCandidate.email
});
```

for a duplicate-email scenario.

---

# 6. Then introduce Components

A large application should not have one enormous Page Object.

Suppose your candidate page contains:

```text
CandidatePage
│
├── Header
├── CandidateSearch
├── CandidateTable
├── CandidateForm
├── Filters
├── Pagination
└── Toast
```

Do not create:

```text
CandidatePage.ts
```

with 2,000 lines.

Instead:

```text
pages/
    candidates/
        CandidateListPage.ts
        CandidateDetailsPage.ts
        CandidateCreatePage.ts

components/
    CandidateForm.ts
    CandidateTable.ts
    SearchComponent.ts
    FilterComponent.ts
    ToastComponent.ts
    PaginationComponent.ts
```

For example:

```ts
export class CandidateTable {
  constructor(private readonly page: Page) {}

  async openCandidate(name: string): Promise<void> {
    await this.page
      .getByRole('row', { name })
      .getByRole('link')
      .click();
  }

  async expectCandidate(name: string): Promise<void> {
    await expect(
      this.page.getByRole('row', { name })
    ).toBeVisible();
  }
}
```

And:

```ts
export class CandidateListPage {
  readonly table: CandidateTable;
  readonly search: SearchComponent;

  constructor(private readonly page: Page) {
    this.table = new CandidateTable(page);
    this.search = new SearchComponent(page);
  }

  async open(): Promise<void> {
    await this.page.goto('/candidates');
  }
}
```

Now you have composable UI abstractions.

---

# 7. The next major jump: Fixtures

This is where the framework begins to feel substantially more mature.

Instead of every test doing:

```ts
const candidatePage = new CandidatePage(page);
const loginPage = new LoginPage(page);

await loginPage.login(...);
```

create custom fixtures.

```ts
type TestFixtures = {
  candidatePage: CandidatePage;
  candidateApi: CandidateApi;
};
```

Then:

```ts
export const test = base.extend<TestFixtures>({
  candidatePage: async ({ page }, use) => {
    await use(new CandidatePage(page));
  },

  candidateApi: async ({ request }, use) => {
    await use(new CandidateApi(request));
  }
});
```

Your test becomes:

```ts
test('recruiter can create a candidate', async ({
  candidatePage
}) => {

  const candidate = candidateFactory.create();

  await candidatePage.open();
  await candidatePage.createCandidate(candidate);

  await candidatePage.expectCandidateToExist(candidate);
});
```

The test no longer cares how `CandidatePage` is constructed.

That is a major architectural improvement.

---

# 8. Authentication should disappear from most tests

Another common junior pattern:

```ts
test('create candidate', async ({ page }) => {

  await page.goto('/login');

  await page.getByLabel('Username').fill(...);
  await page.getByLabel('Password').fill(...);
  await page.getByRole('button', { name: 'Login' }).click();

  // actual test starts here
});
```

Now every test spends time establishing the same state.

Instead, establish authentication through fixtures or Playwright's authenticated storage state.

Conceptually:

```text
global authentication
        │
        ▼
authenticated browser state
        │
        ▼
candidate test
```

Your test becomes:

```ts
test('recruiter can create candidate', async ({
  candidatePage
}) => {
  await candidatePage.open();

  // actual scenario
});
```

The authentication mechanism becomes infrastructure rather than test logic.

---

# 9. Then separate UI setup from API setup

This is one of the biggest improvements you can make.

Suppose you need an existing candidate before testing editing.

Do **not** necessarily do this through the UI:

```ts
await candidatePage.open();
await candidatePage.createCandidate(candidate);
await candidatePage.openCandidate(candidate);
await candidatePage.editCandidate(...);
```

That makes the test dependent upon another UI workflow.

If the API can create the candidate:

```ts
const candidate =
  await candidateApi.create(candidateFactory.create());
```

then:

```ts
await candidatePage.open(candidate.id);

await candidatePage.editCandidate({
  firstName: 'Updated'
});

await candidatePage.expectCandidate(candidate.id, {
  firstName: 'Updated'
});
```

Now:

```text
API
 ↓
Test data state
 ↓
UI
 ↓
Business behaviour
```

This is substantially faster and isolates the behaviour under test.

---

# 10. This gives you a hybrid UI/API architecture

For an enterprise application, I would aim for something like:

```text
                    TEST
                      │
          ┌───────────┴───────────┐
          │                       │
       UI Layer               API Layer
          │                       │
     Page Objects             API Clients
          │                       │
     Components              Test Data
          │                       │
          └───────────┬───────────┘
                      │
                 APPLICATION
```

For example:

```ts
test('recruiter can edit candidate', async ({
  candidateApi,
  candidatePage
}) => {

  const candidate =
    await candidateApi.create(
      candidateFactory.create()
    );

  await candidatePage.open(candidate.id);

  await candidatePage.edit({
    firstName: 'James'
  });

  await candidatePage.expectDetails({
    firstName: 'James'
  });
});
```

This is a much more meaningful test.

---

# 11. Assertions should also become domain-oriented

Instead of scattering raw Playwright assertions everywhere:

```ts
await expect(page.locator('.toast')).toContainText(
  'Candidate created'
);

await expect(page.locator('[data-testid="candidate-name"]'))
  .toHaveText('John Smith');

await expect(page.locator('.status'))
  .toHaveText('Active');
```

you can provide meaningful assertions:

```ts
await candidatePage.expectCreated(candidate);

await candidatePage.expectStatus(
  candidate,
  'Active'
);
```

However, there is an important balance here.

I would **not create an abstraction for every assertion**.

This:

```ts
await candidatePage.expectFirstNameToBe(candidate, 'John');
```

is probably unnecessary.

This:

```ts
await candidatePage.expectCandidateStatus(candidate, 'Active');
```

can be justified if it represents a meaningful domain concept.

---

# 12. Introduce a workflow layer carefully

For complex applications, you may eventually have workflows spanning several pages.

For example:

```text
Create Job
   ↓
Publish Job
   ↓
Create Candidate
   ↓
Apply Candidate
   ↓
Schedule Interview
   ↓
Move Candidate
```

Putting that entire thing inside a Page Object is inappropriate.

Instead:

```ts
export class RecruitmentWorkflow {
  constructor(
    private readonly jobs: JobPage,
    private readonly candidates: CandidatePage,
    private readonly interviews: InterviewPage
  ) {}

  async moveCandidateThroughInterview(
    candidate: Candidate,
    job: Job
  ): Promise<void> {

    await this.candidates.applyToJob(candidate, job);

    await this.interviews.schedule(candidate);

    await this.candidates.moveToInterviewStage(candidate);
  }
}
```

Then:

```ts
test('candidate progresses through interview stage', async ({
  recruitment
}) => {

  const candidate = candidateFactory.create();
  const job = jobFactory.create();

  await recruitment.moveCandidateThroughInterview(
    candidate,
    job
  );
});
```

Now you have:

```text
Test
 ↓
Workflow
 ↓
Pages / Components
 ↓
Playwright
```

But use this only when the workflow is genuinely reused or represents an important business process.

---

# 13. Your final test should increasingly look like a requirement

Compare these.

### Level 1 — UI script

```ts
test('candidate creation', async ({ page }) => {
  await page.goto('/candidates');
  await page.getByRole('button', { name: 'New Candidate' }).click();
  await page.getByLabel('First name').fill('John');
  await page.getByLabel('Last name').fill('Smith');
  await page.getByLabel('Email').fill('john@test.com');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Created')).toBeVisible();
});
```

### Level 2 — Page Object

```ts
test('recruiter can create a candidate', async ({
  candidatePage
}) => {
  const candidate = candidateFactory.create();

  await candidatePage.open();
  await candidatePage.createCandidate(candidate);
  await candidatePage.expectCandidateToExist(candidate);
});
```

### Level 3 — Fixtures + domain model

```ts
test('recruiter can create a candidate', async ({
  candidates
}) => {
  const candidate = candidateFactory.create();

  await candidates.create(candidate);

  await candidates.expectToExist(candidate);
});
```

### Level 4 — Business workflow

```ts
test('recruiter can add a candidate to a job', async ({
  recruitment
}) => {
  const candidate = candidateFactory.create();
  const job = jobFactory.create();

  await recruitment.addCandidateToJob(candidate, job);

  await recruitment.expectCandidateInJob(
    candidate,
    job
  );
});
```

### Level 5 — Specification-oriented

You can go even further and make the test communicate the scenario:

```ts
test.describe('Candidate management', () => {

  test('a recruiter can add a new candidate to an open job', async ({
    recruitment
  }) => {

    const candidate = candidateFactory.create();
    const job = jobFactory.create({ status: 'Open' });

    await recruitment.addCandidateToJob(candidate, job);

    await recruitment.expectCandidateInJob(candidate, job);
  });

});
```

That is where I would aim.

---

# 14. But there is another dimension: test architecture

Enterprise quality is **not just abstraction**.

You also need to think about:

### Test isolation

Each test should establish its own required state.

```text
Test A ── independent
Test B ── independent
Test C ── independent
```

Avoid:

```text
Test A
  ↓
Test B depends on A
  ↓
Test C depends on B
```

### Deterministic data

Avoid:

```ts
email: 'test@test.com'
```

for every test.

Prefer generated/controlled data.

### Environment configuration

```text
.env.dev
.env.qa
.env.staging
```

and:

```ts
baseURL: process.env.BASE_URL
```

rather than embedding environments throughout tests.

### Authentication state

```text
auth/
    recruiter.json
    hiring-manager.json
    administrator.json
```

### Tagging

```ts
test('@smoke recruiter can create candidate', ...)
```

```ts
test('@regression recruiter can filter candidates', ...)
```

```ts
test('@critical candidate can be moved to interview', ...)
```

Then:

```bash
npx playwright test --grep @smoke
```

---

# 15. Build around capabilities, not pages

This is another important distinction.

A weak architecture might become:

```text
pages/
    LoginPage
    HomePage
    CandidatesPage
    JobsPage
    InterviewPage
    SettingsPage
```

That is fine initially, but eventually your architecture should reflect **capabilities and domain boundaries**.

For an ATS:

```text
automation/
│
├── domains/
│   ├── candidates/
│   ├── jobs/
│   ├── applications/
│   ├── interviews/
│   ├── talent-pools/
│   └── users/
│
├── shared/
│   ├── components/
│   ├── fixtures/
│   ├── assertions/
│   └── utilities/
│
└── infrastructure/
    ├── api/
    ├── authentication/
    ├── configuration/
    └── test-data/
```

This scales better because your automation starts reflecting the **product architecture**.

---

# 16. Do not hide Playwright completely

This is an important counterargument.

You might think:

> "An enterprise framework should never have `page.getByRole()` inside tests."

That is not necessarily true.

A small, simple test can legitimately be:

```ts
test('search button is accessible', async ({ page }) => {
  await page.goto('/candidates');

  await expect(
    page.getByRole('button', { name: 'Search' })
  ).toBeVisible();
});
```

Creating:

```ts
await candidatePage.expectSearchButtonToBeVisible();
```

would actually make the framework **worse**.

Therefore:

> **Abstract complexity, not Playwright itself.**

Keep simple UI-level tests simple.

---

# 17. Where I would draw the architectural boundary

A useful rule is:

| Concern                     | Belongs in               |
| --------------------------- | ------------------------ |
| Business scenario           | Test                     |
| Test orchestration          | Test                     |
| Candidate creation workflow | Domain/workflow layer    |
| Candidate page interaction  | Page Object              |
| Candidate table             | Component                |
| Locator                     | Page/component           |
| Authentication              | Fixture                  |
| API setup                   | API client               |
| Test data generation        | Factory                  |
| Environment URL             | Configuration            |
| Generic waiting             | Usually Playwright       |
| Screenshot/tracing          | Playwright configuration |
| Reporting                   | Test infrastructure      |

This prevents the classic problem of creating a gigantic `BasePage` containing every conceivable function.

---

# 18. A realistic enterprise example

Imagine your ATS has:

```text
Candidate
 ├── Personal information
 ├── Contact information
 ├── CV
 ├── Skills
 ├── Applications
 ├── Interviews
 └── Activity
```

A candidate test might become:

```ts
test.describe('Candidate management', () => {

  test('recruiter can create a candidate and attach them to a job', async ({
    recruitment
  }) => {

    const candidate = candidateFactory.create({
      firstName: 'Sarah',
      lastName: 'Williams'
    });

    const job = jobFactory.create({
      status: 'Open'
    });

    await recruitment.createCandidate(candidate);

    await recruitment.addCandidateToJob(
      candidate,
      job
    );

    await recruitment.expectCandidateApplication(
      candidate,
      job
    );
  });

});
```

Notice what is **not** present:

```text
goto()
click()
fill()
locator()
waitForTimeout()
```

Those things have not disappeared.

They have moved to the appropriate architectural layer.

That is the real transition.

---

# 19. What I would build if this were your framework

I would use approximately this architecture:

```text
tests/
│
├── candidates/
│   ├── candidate-create.spec.ts
│   ├── candidate-edit.spec.ts
│   ├── candidate-search.spec.ts
│   └── candidate-permissions.spec.ts
│
├── jobs/
│   └── ...
│
├── applications/
│   └── ...
│
├── interviews/
│   └── ...
│
├── pages/
│   ├── candidates/
│   ├── jobs/
│   └── interviews/
│
├── components/
│   ├── data-table/
│   ├── modal/
│   ├── search/
│   ├── filters/
│   └── navigation/
│
├── workflows/
│   ├── recruitment.workflow.ts
│   └── candidate.workflow.ts
│
├── api/
│   ├── candidates.api.ts
│   ├── jobs.api.ts
│   └── applications.api.ts
│
├── factories/
│   ├── candidate.factory.ts
│   ├── job.factory.ts
│   └── application.factory.ts
│
├── fixtures/
│   ├── auth.fixture.ts
│   └── application.fixture.ts
│
├── assertions/
│   └── ...
│
└── playwright.config.ts
```

And the conceptual dependency direction should be:

```text
                 SPECIFICATIONS
                       │
                       ▼
                     TESTS
                       │
                       ▼
                   WORKFLOWS
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        PAGE OBJECTS          API CLIENTS
             │                   │
             ▼                   ▼
        COMPONENTS           TEST DATA
             │
             ▼
          PLAYWRIGHT
```

Not everything needs every layer.

That is critical.

---

# 20. The maturity model I would use

Think of your framework progressing through these stages:

### Level 0 — Browser scripting

```ts
goto
click
fill
expect
```

Everything is in the test.

### Level 1 — Page Objects

```ts
candidatePage.createCandidate()
```

UI mechanics are encapsulated.

### Level 2 — Components

```ts
candidatePage.table
candidatePage.search
candidatePage.filters
```

Reusable UI behaviour is separated.

### Level 3 — Fixtures

```ts
test(..., async ({ candidatePage, recruiter }) => {})
```

Infrastructure and state creation are managed automatically.

### Level 4 — Domain/data architecture

```ts
candidateFactory
candidateApi
jobFactory
applicationApi
```

Tests operate on domain entities rather than raw UI fields.

### Level 5 — Workflows

```ts
recruitment.addCandidateToJob()
```

Complex cross-page business processes become reusable capabilities.

### Level 6 — Enterprise engineering

Add:

```text
CI/CD
│
├── parallel execution
├── test sharding
├── retries
├── trace collection
├── screenshots/video on failure
├── environment management
├── authentication strategies
├── API + UI testing
├── test data lifecycle
├── tagging
├── reporting
├── observability
└── failure diagnostics
```

But I would **not implement Level 6 before Levels 1–5 are structurally sound**.

---

# The most important principle

Do not judge the maturity of your framework by how sophisticated the test file looks.

A test such as:

```ts
test('recruiter can create candidate', async ({
  recruitment
}) => {
  const candidate = candidateFactory.create();

  await recruitment.createCandidate(candidate);

  await recruitment.expectCandidateToExist(candidate);
});
```

looks almost trivial.

That is **a feature, not a weakness**, provided the complexity is properly engineered underneath it.

The sophistication should be in the **architecture, isolation, data management, fixtures, diagnostics, API integration, domain modelling, reliability and maintainability**.

The test should be boring.

That is usually a sign that the framework is doing its job.

---

## A practical next step

If you want to make the transition systematically, I would take **one real workflow from your current Playwright project** and refactor it through these six stages:

```text
Your current test
       ↓
Page Object
       ↓
Component Objects
       ↓
Custom Fixtures
       ↓
Test Data Factory + API setup
       ↓
Domain/Workflow abstraction
       ↓
Enterprise-quality spec
```

For example, take your existing **PlayLab test or ATS candidate test** and provide the current `.spec.ts` plus the relevant Page Object. I can then show you, line by line, **what should remain in the test, what should move into a Page Object, what should become a component, what belongs in fixtures, and what should be API-driven**, and produce the resulting folder structure and code.
