import { test, expect } from './fixtures/test';

test.describe('Windows | labeled popup interactions', () => {
  test('opens the success modal popup', async ({ playLab }) => {
    await playLab.openWindows();
    await playLab.successModalButton.click();

    await expect(playLab.successModal).toBeVisible();
    await expect(playLab.successModalTitle).toHaveText('Success Modal Popup');
    await expect(playLab.successModalBody).toContainText('Modal Popup Body');
  });

  test('closes the success modal popup', async ({ playLab }) => {
    await playLab.openWindows();
    await playLab.successModalButton.click();
    await playLab.successModal.locator('[data-testid="modal-success-close-btn"]').click();

    await expect(playLab.successModal).toBeHidden();
  });
});