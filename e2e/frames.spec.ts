import { test, expect } from './fixtures/test';

test.describe('Frames | labeled frame interactions', () => {
  test('interacts with iframe 1', async ({ playLab }) => {
    await playLab.openFrames();

    const frame = playLab.page.frameLocator('[data-testid="iframe-frame-1"]');
    await expect(frame.locator('[data-testid="iframe1-heading"]')).toHaveText('I am iFrame 1');
    await expect(frame.locator('[data-testid="iframe1-button"]')).toBeVisible();
  });

  test('interacts with iframe 2', async ({ playLab }) => {
    await playLab.openFrames();

    const frame = playLab.page.frameLocator('[data-testid="iframe-frame-2"]');
    await expect(frame.locator('[data-testid="iframe2-heading"]')).toHaveText('I am IFrame 2');
    await expect(frame.locator('[data-testid="iframe2-button"]')).toBeVisible();
  });
});