import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { PlayLabHome } from '../pages/playlab-home';

type Fixtures = {
  playLab: PlayLabHome;
  loginPage: LoginPage;
};

export const test = base.extend<Fixtures>({
  playLab: async ({ page }, use) => {
    await use(new PlayLabHome(page));
  },
  loginPage: async ({}, use) => {
    await use(new LoginPage());
  },
});

export { expect };