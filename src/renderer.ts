import { createCanvas } from '@napi-rs/canvas';
import type { GridConfig } from './config';

type PixelGrid = boolean[][];
type Color = string;

export class Renderer {
  private canvas: any;
  private ctx: any;
  private config: GridConfig;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(config: GridConfig) {
    this.config = config;
    this.canvasWidth = config.width * (config.pixelSize + config.spacing);
    this.canvasHeight = config.height * (config.pixelSize + config.spacing);
    this.canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    this.ctx = this.canvas.getContext('2d');
  }

  clearCanvas(): void {
    this.ctx.fillStyle = this.config.bgColor;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    if (this.config.gridColor) {
      this.renderGrid();
    }
  }

  renderGrid(): void {
    const { r, g, b } = this.parseHexColor(this.config.gridColor!);
    this.ctx.fillStyle = `rgb(${r},${g},${b})`;

    for (let gridY = 0; gridY < this.config.height; gridY++) {
      for (let gridX = 0; gridX < this.config.width; gridX++) {
        const x = gridX * (this.config.pixelSize + this.config.spacing);
        const y = gridY * (this.config.pixelSize + this.config.spacing);
        this.ctx.fillRect(x, y, this.config.pixelSize, this.config.pixelSize);
      }
    }
  }

  parseHexColor(hex: string): { r: number; g: number; b: number } {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }

  renderPixel(gridX: number, gridY: number, color: Color): void {
    const x = gridX * (this.config.pixelSize + this.config.spacing);
    const y = gridY * (this.config.pixelSize + this.config.spacing);

    const { r, g, b } = this.parseHexColor(color);
    this.ctx.fillStyle = `rgb(${r},${g},${b})`;
    this.ctx.fillRect(x, y, this.config.pixelSize, this.config.pixelSize);
  }

  renderTextGrid(
    textGrid: PixelGrid,
    offsetX: number,
    offsetY: number,
    color: Color
  ): void {
    for (let y = 0; y < textGrid.length; y++) {
      const row = textGrid[y];
      if (!row) continue;

      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          const gridX = offsetX + x;
          const gridY = offsetY + y;

          if (
            gridX >= 0 &&
            gridX < this.config.width &&
            gridY >= 0 &&
            gridY < this.config.height
          ) {
            this.renderPixel(gridX, gridY, color);
          }
        }
      }
    }
  }

  getCanvas(): any {
    return this.canvas;
  }

  getContext(): any {
    return this.ctx;
  }

  getCanvasWidth(): number {
    return this.canvasWidth;
  }

  getCanvasHeight(): number {
    return this.canvasHeight;
  }
}
