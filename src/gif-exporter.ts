import type { Canvas } from '@napi-rs/canvas';
import { $ } from 'bun';
import { mkdirSync, rmSync } from 'node:fs';

export class GifExporter {
  private width: number;
  private height: number;
  private fps: number;

  constructor(width: number, height: number, fps: number) {
    this.width = width;
    this.height = height;
    this.fps = fps;
  }

  async exportGif(
    contexts: { canvas: Canvas }[],
    outputPath: string,
  ): Promise<void> {
    const tempDir = '.tmp-frames';

    // Create temp dir
    mkdirSync(tempDir, { recursive: true });

    try {
      // Export frames as PNGs
      console.log(`Exporting ${contexts.length} frames...`);
      for (let i = 0; i < contexts.length; i++) {
        const buffer = await contexts[i]!.canvas.encode('png');
        await Bun.write(`${tempDir}/frame-${String(i).padStart(5, '0')}.png`, buffer);
      }

      // Use ffmpeg to create GIF
      console.log('Encoding GIF with ffmpeg...');
      await $`ffmpeg -y -framerate ${this.fps} -i ${tempDir}/frame-%05d.png -vf "split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" ${outputPath}`;
    } finally {
      // Clean up temp files
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}
