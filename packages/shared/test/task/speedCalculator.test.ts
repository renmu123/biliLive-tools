import { describe, it, expect, beforeEach } from "vitest";
import { SpeedCalculator } from "../../src/utils/speedCalculator.js";

describe("SpeedCalculator", () => {
  let calculator: SpeedCalculator;

  beforeEach(() => {
    calculator = new SpeedCalculator();
  });

  describe("constructor", () => {
    it("should use default window size of 3000ms", () => {
      const calc = new SpeedCalculator();
      expect(calc).toBeDefined();
    });

    it("should accept custom window size", () => {
      const calc = new SpeedCalculator(5000);
      expect(calc).toBeDefined();
    });
  });

  describe("reset", () => {
    it("should clear progress history", () => {
      calculator.init(1000);
      calculator.calculateSpeed(1024, 1100);
      calculator.reset();

      const speed = calculator.calculateSpeed(1024, 2000);
      expect(speed).toBe("0.00 MB/s");
    });
  });

  describe("init", () => {
    it("should initialize with starting timestamp and zero loaded", () => {
      calculator.init(1000);
      const speed = calculator.calculateSpeed(1048576, 2000); // 1MB in 1 second
      expect(speed).toBe("1.00 MB/s");
    });
  });

  describe("calculateSpeed", () => {
    it("should return 0.00 MB/s when no previous data exists", () => {
      const speed = calculator.calculateSpeed(1024, 1000);
      expect(speed).toBe("0.00 MB/s");
    });

    it("should calculate correct speed for 1MB/s", () => {
      calculator.init(1000);
      const speed = calculator.calculateSpeed(1048576, 2000); // 1MB in 1 second
      expect(speed).toBe("1.00 MB/s");
    });

    it("should calculate correct speed for 2MB/s", () => {
      calculator.init(1000);
      const speed = calculator.calculateSpeed(2097152, 2000); // 2MB in 1 second
      expect(speed).toBe("2.00 MB/s");
    });

    it("should return 0.00 MB/s when time difference is zero", () => {
      calculator.init(1000);
      const speed = calculator.calculateSpeed(1048576, 1000); // same timestamp
      expect(speed).toBe("0.00 MB/s");
    });

    it("should return 0.00 MB/s when data difference is zero", () => {
      calculator.init(1000);
      const speed = calculator.calculateSpeed(0, 2000); // no data transferred
      expect(speed).toBe("0.00 MB/s");
    });

    it("should return 0.00 MB/s when data difference is negative", () => {
      calculator.calculateSpeed(1048576, 1000);
      const speed = calculator.calculateSpeed(524288, 2000); // less data than before
      expect(speed).toBe("0.00 MB/s");
    });

    it("should clean up old history outside time window", () => {
      const calc = new SpeedCalculator(1000); // 1 second window
      calc.init(1000);
      calc.calculateSpeed(1048576, 1500); // 0.5 seconds
      calc.calculateSpeed(2097152, 2500); // 1.5 seconds (should clean up init data)

      const speed = calc.calculateSpeed(3145728, 3000); // 2 seconds
      // Should calculate from 1500ms point, not from init
      expect(speed).toBe("2.00 MB/s"); // 1MB in 0.5 seconds
    });

    it("should handle multiple data points correctly", () => {
      calculator.init(1000);
      calculator.calculateSpeed(524288, 1250); // 0.5MB at 0.25s
      calculator.calculateSpeed(1048576, 1500); // 1MB at 0.5s
      calculator.calculateSpeed(1572864, 1750); // 1.5MB at 0.75s
      const speed = calculator.calculateSpeed(2097152, 2000); // 2MB at 1s

      expect(speed).toBe("2.00 MB/s"); // 2MB in 1 second total
    });

    it("should format speed with 2 decimal places", () => {
      calculator.init(1000);
      const speed = calculator.calculateSpeed(1572864, 2000); // 1.5MB in 1 second
      expect(speed).toBe("1.50 MB/s");
    });

    it("should handle fractional speeds correctly", () => {
      calculator.init(1000);
      const speed = calculator.calculateSpeed(524288, 2000); // 0.5MB in 1 second
      expect(speed).toBe("0.50 MB/s");
    });
  });
});
