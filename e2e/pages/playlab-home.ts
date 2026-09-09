import { Locator, Page } from '@playwright/test';

export class PlayLabHome {
  readonly page: Page;
  readonly iframe1: Locator;
  readonly iframe2: Locator;
  readonly successModalButton: Locator;
  readonly successModal: Locator;
  readonly successModalTitle: Locator;
  readonly successModalBody: Locator;

  constructor(page: Page) {
    this.page = page;
    this.iframe1 = page.locator('[data-testid="iframe-frame-1"]');
    this.iframe2 = page.locator('[data-testid="iframe-frame-2"]');
    this.successModalButton = page.locator('[data-testid="modal-open-success-btn"]');
    this.successModal = page.locator('[data-testid="modal-success"]');
    this.successModalTitle = page.locator('[data-testid="modal-success-title"]');
    this.successModalBody = page.locator('[data-testid="modal-success-body"]');
  }

  async openFrames(): Promise<void> {
    await this.page.goto('iframe.php');
  }

  async openWindows(): Promise<void> {
    await this.page.goto('window-popup-modal.php');
  }
}