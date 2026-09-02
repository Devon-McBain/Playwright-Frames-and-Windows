import { Page } from '@playwright/test';

export class LoginPage {
  readonly title = 'PlayLab - Login';

  async assertLoaded(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
    await page.locator('[data-testid="login-card"]').waitFor();
  }
}