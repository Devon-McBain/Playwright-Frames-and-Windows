import { Locator, Page } from '@playwright/test';

export class PlayLabHome {
  readonly page: Page;
  readonly moreMenu: Locator;
  readonly framesSection: Locator;
  readonly practiceFrame: Locator;
  readonly nestedFramesFrame: Locator;
  readonly externalFrame: Locator;
  readonly newTabButton: Locator;
  readonly popupButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.moreMenu = page.locator('[data-testid="nav-more"]');
    this.framesSection = page.locator('[data-testid="nav-frames"]');
    this.practiceFrame = page.locator('[data-testid="practice-iframe"]');
    this.nestedFramesFrame = page.locator('[data-testid="nested-frames-iframe"]');
    this.externalFrame = page.locator('[data-testid="external-iframe"]');
    this.newTabButton = page.locator('[data-testid="new-tab-btn"]');
    this.popupButton = page.locator('[data-testid="popup-btn"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async openFramesSection(): Promise<void> {
    await this.moreMenu.click();
    await this.framesSection.click();
  }

  practiceFrameLocator() {
    return this.page.frameLocator('[data-testid="practice-iframe"]');
  }

  nestedInnerFrameLocator() {
    return this.page
      .frameLocator('[data-testid="nested-frames-iframe"]')
      .frameLocator('[data-testid="inner-frame"]');
  }
}