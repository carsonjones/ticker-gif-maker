import type { Canvas } from '@napi-rs/canvas';
import { $ } from 'bun';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';

export type ResizeConfig = {
  enabled: boolean;
  maxWidth?: number;
  maxHeight?: number;
  method?:
    | 'sample'
    | 'mix'
    | 'box'
    | 'catrom'
    | 'mitchell'
    | 'lanczos2'
    | 'lanczos3';
};

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
    resizeConfig?: ResizeConfig,
  ): Promise<void> {
    const tempDir = '.tmp-frames';

    // Create temp dir
    mkdirSync(tempDir, { recursive: true });

    try {
      // Export frames as PNGs in parallel
      console.log(`Exporting ${contexts.length} frames...`);
      await Promise.all(
        contexts.map(async (ctx, i) => {
          const buffer = await ctx.canvas.encode('png');
          await Bun.write(
            `${tempDir}/frame-${String(i).padStart(5, '0')}.png`,
            buffer,
          );
        }),
      );

      // Use ffmpeg to create GIF
      console.log('Encoding GIF with ffmpeg...');
      const result =
        await $`ffmpeg -y -framerate ${this.fps} -i ${tempDir}/frame-%05d.png -vf "split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" ${outputPath}`.quiet();

      if (result.exitCode !== 0) {
        throw new Error(
          `ffmpeg failed with exit code ${result.exitCode}: ${result.stderr.toString()}`,
        );
      }

      // Verify the output is actually a GIF
      if (!existsSync(outputPath)) {
        throw new Error(`Output file was not created: ${outputPath}`);
      }

      const fileBuffer = readFileSync(outputPath);
      const isGif =
        fileBuffer[0] === 0x47 &&
        fileBuffer[1] === 0x49 &&
        fileBuffer[2] === 0x46; // "GIF"

      if (!isGif) {
        throw new Error(
          `Output file is not a valid GIF format. File signature: ${fileBuffer.slice(0, 3).toString('hex')}`,
        );
      }

      console.log(
        `✓ Valid GIF created: ${outputPath} (${Math.round(fileBuffer.length / 1024)}KB)`,
      );

      // Resize with gifsicle if needed
      if (resizeConfig?.enabled) {
        await this.resizeGif(outputPath, resizeConfig);
      }
    } finally {
      // Clean up temp files
      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  private async resizeGif(
    gifPath: string,
    resizeConfig: ResizeConfig,
  ): Promise<void> {
    const maxWidth = resizeConfig.maxWidth;
    const maxHeight = resizeConfig.maxHeight;

    if (!maxWidth && !maxHeight) {
      return;
    }

    console.log(
      `Resizing GIF to fit within ${maxWidth || '∞'}x${maxHeight || '∞'}...`,
    );

    const originalBuffer = readFileSync(gifPath);
    const originalSize = Math.round(originalBuffer.length / 1024);

    const method = resizeConfig.method || 'sample';
    const tempOutput = gifPath + '.resized.gif';

    try {
      // Use gifsicle to resize with better quality settings
      // --resize-method: sample = best for pixel art (no blending/antialiasing)
      // --resize-colors=256 = allow full color palette
      if (maxWidth && maxHeight) {
        await $`gifsicle --resize-fit ${maxWidth}x${maxHeight} --resize-method=${method} --resize-colors=256 ${gifPath} -o ${tempOutput}`.quiet();
      } else if (maxWidth) {
        await $`gifsicle --resize-width ${maxWidth} --resize-method=${method} --resize-colors=256 ${gifPath} -o ${tempOutput}`.quiet();
      } else if (maxHeight) {
        await $`gifsicle --resize-height ${maxHeight} --resize-method=${method} --resize-colors=256 ${gifPath} -o ${tempOutput}`.quiet();
      } else {
        return;
      }

      // Verify the resized file exists and is valid
      if (!existsSync(tempOutput)) {
        throw new Error('Gifsicle failed to create resized file');
      }

      const resizedBuffer = readFileSync(tempOutput);
      const isGif =
        resizedBuffer[0] === 0x47 &&
        resizedBuffer[1] === 0x49 &&
        resizedBuffer[2] === 0x46;

      if (!isGif) {
        throw new Error('Resized file is not a valid GIF');
      }

      // Replace original with resized version
      rmSync(gifPath);
      await Bun.write(gifPath, resizedBuffer);

      const resizedSize = Math.round(resizedBuffer.length / 1024);
      console.log(`✓ Resized: ${originalSize}KB → ${resizedSize}KB`);
    } catch (error) {
      // Clean up temp file if it exists
      if (existsSync(tempOutput)) {
        rmSync(tempOutput);
      }
      throw error;
    }
  }
}
