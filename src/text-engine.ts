type FontDefinition = {
  name: string;
  height: number;
  characters: Record<string, string[]>;
};

type PixelGrid = boolean[][];

const BLOCK_CHARS = new Set([
  '█',
  '▀',
  '▄',
  '▌',
  '▐',
  '▖',
  '▗',
  '▘',
  '▝',
  '▞',
  '▟',
  '▙',
  '▚',
  '▛',
  '▜',
  '▀',
  '▄',
]);

export class TextEngine {
  private font: FontDefinition;

  constructor(fontPath: string) {
    const fontFile = Bun.file(fontPath);
    this.font = fontFile.json() as FontDefinition;
  }

  async initialize(): Promise<void> {
    this.font = await Bun.file('fonts/block.json').json();
  }

  convertCharToGrid(charLines: string[]): PixelGrid {
    const grid: PixelGrid = [];

    for (const line of charLines) {
      const row: boolean[] = [];
      for (const char of line) {
        row.push(BLOCK_CHARS.has(char) || char !== ' ');
      }
      grid.push(row);
    }

    return grid;
  }

  getCharWidth(char: string): number {
    const charLines = this.font.characters[char.toUpperCase()];
    if (!charLines || charLines.length === 0) {
      return 0;
    }
    return charLines[0].length;
  }

  textToGrid(text: string, charSpacing: number = 1): PixelGrid {
    const upperText = text.toUpperCase();
    const grids: PixelGrid[] = [];

    for (const char of upperText) {
      const charLines = this.font.characters[char];
      if (!charLines) {
        continue;
      }
      const charGrid = this.convertCharToGrid(charLines);
      grids.push(charGrid);
    }

    if (grids.length === 0) {
      return [[]];
    }

    const height = this.font.height;
    const totalWidth = grids.reduce((sum, grid, index) => {
      const gridWidth = grid[0]?.length || 0;
      return sum + gridWidth + (index < grids.length - 1 ? charSpacing : 0);
    }, 0);

    const composedGrid: PixelGrid = Array.from({ length: height }, () =>
      Array(totalWidth).fill(false),
    );

    let currentX = 0;
    for (let gridIndex = 0; gridIndex < grids.length; gridIndex++) {
      const grid = grids[gridIndex];
      const gridWidth = grid[0]?.length || 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < gridWidth; x++) {
          if (grid[y]?.[x]) {
            composedGrid[y][currentX + x] = true;
          }
        }
      }

      currentX += gridWidth + charSpacing;
    }

    return composedGrid;
  }

  getTextWidth(text: string, charSpacing: number = 1): number {
    const upperText = text.toUpperCase();
    let totalWidth = 0;

    for (let i = 0; i < upperText.length; i++) {
      const char = upperText[i];
      totalWidth += this.getCharWidth(char);
      if (i < upperText.length - 1) {
        totalWidth += charSpacing;
      }
    }

    return totalWidth;
  }

  getTextHeight(): number {
    return this.font.height;
  }

  scaleGrid(grid: PixelGrid, scale: number): PixelGrid {
    if (scale <= 1 || grid.length === 0) {
      return grid;
    }

    const scaledHeight = grid.length * scale;
    const scaledWidth = (grid[0]?.length || 0) * scale;
    const scaledGrid: PixelGrid = Array.from({ length: scaledHeight }, () =>
      Array(scaledWidth).fill(false),
    );

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < (grid[y]?.length || 0); x++) {
        if (grid[y][x]) {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              scaledGrid[y * scale + sy][x * scale + sx] = true;
            }
          }
        }
      }
    }

    return scaledGrid;
  }
}
