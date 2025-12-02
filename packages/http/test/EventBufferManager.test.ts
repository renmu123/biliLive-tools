import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EventBufferManager,
  type MatchedEventPair,
} from "../src/services/webhook/EventBufferManager.js";
import type { Options } from "../src/types/webhook.js";

// Mock the log utility
vi.mock("@biliLive-tools/shared/utils/log.js", () => ({
  default: {
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

describe("EventBufferManager", () => {
  let manager: EventBufferManager;

  beforeEach(() => {
    manager = new EventBufferManager();
    vi.clearAllMocks();
  });

  const createMockEvent = (event: string, filePath: string): Options =>
    ({
      event,
      filePath,
      // Add other required properties based on Options type
    }) as Options;

  describe("addEvent", () => {
    it("should handle FileOpening events", () => {
      const event = createMockEvent("FileOpening", "/path/to/file.mp4");

      manager.addEvent(event);

      expect(manager.getBufferStatus()).toBe(1);
    });

    it("should handle FileClosed events", () => {
      const event = createMockEvent("FileClosed", "/path/to/file.mp4");

      manager.addEvent(event);

      expect(manager.getBufferStatus()).toBe(1);
    });

    it("should warn for unknown event types", () => {
      const event = createMockEvent("UnknownEvent", "/path/to/file.mp4");

      manager.addEvent(event);

      expect(manager.getBufferStatus()).toBe(0);
    });
  });

  describe("event matching", () => {
    it("should emit process event when open and close events match", () => {
      const manager = new EventBufferManager();
      const filePath = "/path/to/file.mp4";
      const openEvent = createMockEvent("FileOpening", filePath);
      const closeEvent = createMockEvent("FileClosed", filePath);

      manager.on("process", (pair: MatchedEventPair) => {
        expect(pair.open).toBe(openEvent);
        expect(pair.close).toBe(closeEvent);
        setTimeout(() => {
          expect(manager.getBufferStatus()).toBe(0);
        }, 0);
      });

      manager.addEvent(openEvent);
      manager.addEvent(closeEvent);
    });

    it("should emit process event regardless of event order", () => {
      const filePath = "/path/to/file.mp4";
      const openEvent = createMockEvent("FileOpening", filePath);
      const closeEvent = createMockEvent("FileClosed", filePath);

      manager.on("process", (pair: MatchedEventPair) => {
        expect(pair.open).toBe(openEvent);
        expect(pair.close).toBe(closeEvent);
      });

      manager.addEvent(closeEvent);
      manager.addEvent(openEvent);
    });

    it("should handle multiple file pairs independently", () => {
      const filePath1 = "/path/to/file1.mp4";
      const filePath2 = "/path/to/file2.mp4";
      const events: MatchedEventPair[] = [];

      manager.on("process", (pair: MatchedEventPair) => {
        events.push(pair);
      });

      manager.addEvent(createMockEvent("FileOpening", filePath1));
      manager.addEvent(createMockEvent("FileOpening", filePath2));
      manager.addEvent(createMockEvent("FileClosed", filePath1));
      manager.addEvent(createMockEvent("FileClosed", filePath2));

      expect(events).toHaveLength(2);
      expect(manager.getBufferStatus()).toBe(0);
    });

    it("should keep unpaired events in buffer", () => {
      manager.addEvent(createMockEvent("FileOpening", "/path/to/file1.mp4"));
      manager.addEvent(createMockEvent("FileClosed", "/path/to/file2.mp4"));

      expect(manager.getBufferStatus()).toBe(2);
    });
  });

  describe("clear", () => {
    it("should clear all events from buffer", () => {
      manager.addEvent(createMockEvent("FileOpening", "/path/to/file1.mp4"));
      manager.addEvent(createMockEvent("FileClosed", "/path/to/file2.mp4"));

      expect(manager.getBufferStatus()).toBe(2);

      manager.clear();

      expect(manager.getBufferStatus()).toBe(0);
    });
  });

  describe("getBufferStatus", () => {
    it("should return correct buffer size", () => {
      expect(manager.getBufferStatus()).toBe(0);

      manager.addEvent(createMockEvent("FileOpening", "/path/to/file1.mp4"));
      expect(manager.getBufferStatus()).toBe(1);

      manager.addEvent(createMockEvent("FileOpening", "/path/to/file2.mp4"));
      expect(manager.getBufferStatus()).toBe(2);

      manager.clear();
      expect(manager.getBufferStatus()).toBe(0);
    });
  });
});
