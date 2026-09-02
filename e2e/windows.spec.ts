import { test, expect } from './fixtures/test';

test.describe('Windows | labeled browsing contexts', () => {
  test('opens the labeled link in a new tab', async ({ playLab, loginPage }) => {
    await playLab.open();
    await playLab.openFramesSection();

    // Register the listener before the click so a fast popup cannot be missed.
    const newTabPromise = playLab.page.waitForEvent('popup');
    await playLab.newTabButton.click();
    const newTab = await newTabPromise;
    await loginPage.assertLoaded(newTab);

    await expect(newTab).toHaveURL(/\/login\.html$/);
    await expect(newTab.locator('[data-testid="login-title"]')).toHaveText('Welcome back');
  });

  test('opens the labeled control in a popup window', async ({ playLab, loginPage }) => {
    await playLab.open();
    await playLab.openFramesSection();

    // window.open creates a Page in the same browser context, including named popups.
    const popupPromise = playLab.page.waitForEvent('popup');
    await playLab.popupButton.click();
    const popup = await popupPromise;
    await loginPage.assertLoaded(popup);

    await expect(popup).toHaveURL(/\/login\.html$/);
    await expect(popup.locator('[data-testid="login-title"]')).toHaveText('Welcome back');
  });
});