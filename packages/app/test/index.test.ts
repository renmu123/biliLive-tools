import { describe, expect, it, vi } from "vitest";

import { PowerSaveController } from "../src/main/utils/powerSave";

describe("PowerSaveController", () => {
  it("starts only one blocker and stops it when disabled", () => {
    const blocker = {
      start: vi.fn(() => 7),
      stop: vi.fn(),
      isStarted: vi.fn(() => true),
    };
    const controller = new PowerSaveController(blocker);

    controller.setEnabled(true);
    controller.setEnabled(true);
    controller.setEnabled(false);
    controller.setEnabled(false);

    expect(blocker.start).toHaveBeenCalledOnce();
    expect(blocker.start).toHaveBeenCalledWith("prevent-app-suspension");
    expect(blocker.stop).toHaveBeenCalledOnce();
    expect(blocker.stop).toHaveBeenCalledWith(7);
  });
});
