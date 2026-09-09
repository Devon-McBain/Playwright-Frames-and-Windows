import { test, expect } from './fixtures/test';
import { IframeForm } from './pages/iframe-form';

test.describe('Frames | labeled frame interactions', () => {
  test('interacts with the same-origin practice iframe', async ({ playLab }) => {
    await playLab.open();
    //await playLab.openFramesSection();

    // FrameLocator waits for the iframe and keeps every child selector scoped to it.
    const form = new IframeForm(playLab.practiceFrameLocator());
    await expect(form.frame.locator('[data-testid="iframe-title"]')).toHaveText('iFrame Form');
    await form.submit('Ada Lovelace', 'Frame message');

    // The result proves that the fields and submit action were executed inside the iframe.
    await expect(form.result).toContainText('Submitted! Name: Ada Lovelace');
    await expect(form.result).toContainText('Priority: high, Urgent: true');
  });

  test('traverses the labeled nested frame hierarchy', async ({ playLab }) => {
    await playLab.open();
    //await playLab.openFramesSection();

    // The nested locator enters nested-frames.html, then its iframe-content.html child.
    const nestedForm = new IframeForm(playLab.nestedInnerFrameLocator());
    await expect(nestedForm.frame.locator('[data-testid="iframe-title"]')).toHaveText('iFrame Form');
    await nestedForm.submit('Grace Hopper', 'Nested frame message');

    await expect(nestedForm.result).toContainText('Name: Grace Hopper');
  });

  test('reads content from the labeled cross-origin frame', async ({ playLab }) => {
    await playLab.open();
    //await playLab.openFramesSection();

    // Cross-origin content can be queried through FrameLocator without accessing frame DOM from Node.
    const externalFrame = playLab.page.frameLocator('[data-testid="external-iframe"]');
    await expect(externalFrame.locator('body')).toContainText('Playwright');
  });
});