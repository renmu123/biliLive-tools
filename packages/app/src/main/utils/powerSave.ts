interface PowerSaveBlocker {
  start(type: "prevent-app-suspension"): number;
  stop(id: number): void;
  isStarted(id: number): boolean;
}

export class PowerSaveController {
  private blockerId: number | undefined;

  constructor(private readonly powerSaveBlocker: PowerSaveBlocker) {}

  setEnabled(enabled: boolean) {
    if (enabled) {
      if (this.blockerId === undefined || !this.powerSaveBlocker.isStarted(this.blockerId)) {
        this.blockerId = this.powerSaveBlocker.start("prevent-app-suspension");
      }
      return;
    }

    if (this.blockerId !== undefined) {
      if (this.powerSaveBlocker.isStarted(this.blockerId)) {
        this.powerSaveBlocker.stop(this.blockerId);
      }
      this.blockerId = undefined;
    }
  }
}
