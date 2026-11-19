export const GRID_SIZES = ["1x1", "2x1", "1x2", "2x2", "3x1", "1x3", "3x2", "2x3", "3x3"] as const;

export type GridSize = (typeof GRID_SIZES)[number];

export type GridPlacement = {
  id: string;
  column: number;
  row: number;
  width: number;
  height: number;
};

export function getGridSize(value: string | undefined): GridSize {
  return GRID_SIZES.find((size) => size === value) || "1x1";
}

/** Find room positions inside a fixed 3 × 3 grid, keeping room order stable. */
export function packGrid(
  ids: readonly string[],
  sizes: Record<string, string | undefined>,
): GridPlacement[] | null {
  const dimensions = ids.map((id) => {
    const [width, height] = getGridSize(sizes[id]).split("x").map(Number);
    return { id, width, height };
  });
  if (dimensions.reduce((total, item) => total + item.width * item.height, 0) > 9) return null;

  const occupied = Array<boolean>(9).fill(false);
  const placements: GridPlacement[] = [];

  const place = (index: number): boolean => {
    if (index === dimensions.length) return true;
    const { id, width, height } = dimensions[index];

    for (let row = 0; row <= 3 - height; row++) {
      for (let column = 0; column <= 3 - width; column++) {
        const cells: number[] = [];
        for (let y = row; y < row + height; y++) {
          for (let x = column; x < column + width; x++) cells.push(y * 3 + x);
        }
        if (cells.some((cell) => occupied[cell])) continue;

        cells.forEach((cell) => (occupied[cell] = true));
        placements.push({ id, column: column + 1, row: row + 1, width, height });
        if (place(index + 1)) return true;
        placements.pop();
        cells.forEach((cell) => (occupied[cell] = false));
      }
    }
    return false;
  };

  return place(0) ? placements : null;
}
