import { vi } from "vitest";

vi.mock("ntsuspend", () => ({
  suspend: vi.fn(),
  resume: vi.fn(),
}));
