import { FrameLocator } from '@playwright/test';

export class IframeForm {
  readonly nameInput: ReturnType<FrameLocator['locator']>;
  readonly messageInput: ReturnType<FrameLocator['locator']>;
  readonly prioritySelect: ReturnType<FrameLocator['locator']>;
  readonly urgentCheckbox: ReturnType<FrameLocator['locator']>;
  readonly submitButton: ReturnType<FrameLocator['locator']>;
  readonly result: ReturnType<FrameLocator['locator']>;

  constructor(readonly frame: FrameLocator) {
    this.nameInput = frame.locator('[data-testid="iframe-input-name"]');
    this.messageInput = frame.locator('[data-testid="iframe-textarea"]');
    this.prioritySelect = frame.locator('[data-testid="iframe-select"]');
    this.urgentCheckbox = frame.locator('[data-testid="iframe-checkbox"]');
    this.submitButton = frame.locator('[data-testid="iframe-submit"]');
    this.result = frame.locator('[data-testid="iframe-result"]');
  }

  async submit(name: string, message: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.messageInput.fill(message);
    await this.prioritySelect.selectOption('high');
    await this.urgentCheckbox.check();
    await this.submitButton.click();
  }
}