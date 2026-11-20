import { describe, expect, it } from "vitest";
import { getGridSize, packGrid } from "./grid";

describe("monitor room grid", () => {
  it("fills nine single cells and rejects a tenth", () => {
    const ids = Array.from({ length: 9 }, (_, index) => String(index));
    const placements = packGrid(ids, {});
    expect(placements).toHaveLength(9);
    expect(placements?.[0]).toMatchObject({ column: 1, row: 1, width: 1, height: 1 });
    expect(placements?.[8]).toMatchObject({ column: 3, row: 3, width: 1, height: 1 });
    expect(packGrid([...ids, "9"], {})).toBeNull();
  });

  it("fits mixed spans without overlapping cells", () => {
    const placements = packGrid(["wide", "tall", "large", "single"], {
      wide: "2x1",
      tall: "1x2",
      large: "2x2",
    });
    expect(placements).toHaveLength(4);

    const cells = new Set<string>();
    for (const placement of placements || []) {
      for (let row = placement.row; row < placement.row + placement.height; row++) {
        for (let column = placement.column; column < placement.column + placement.width; column++) {
          expect(row).toBeLessThanOrEqual(3);
          expect(column).toBeLessThanOrEqual(3);
          const cell = `${row},${column}`;
          expect(cells.has(cell)).toBe(false);
          cells.add(cell);
        }
      }
    }
  });

  it("rejects shapes that cannot fit and defaults unknown saved sizes", () => {
    expect(packGrid(["a", "b"], { a: "2x2", b: "2x2" })).toBeNull();
    expect(getGridSize("invalid")).toBe("1x1");
  });
});
