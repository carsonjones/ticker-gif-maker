import type { Canvas } from '@napi-rs/canvas';
import { $ } from 'bun';
import { mkdirSync, rmSync, existsSync } from 'node:fs';

export type Mp4ResizeConfig = {
  enabled: boolean;
  maxWidth?: number;
  maxHeight?: number;
};

export type Mp4Config = {
  quality?: number; // CRF value: 0-51, lower is better quality (default 23)
  preset?:
    | 'ultrafast'
    | 'superfast'
    | 'veryfast'
    | 'faster'
    | 'fast'
    | 'medium'
    | 'slow'
    | 'slower'
    | 'veryslow';
  pixelFormat?: 'yuv420p' | 'yuv444p'; // yuv420p for compatibility, yuv444p for quality
};

export class Mp4Exporter {
  private width: number;
  private height: number;
  private fps: number;

  constructor(width: number, height: number, fps: number) {
    this.width = width;
    this.height = height;
    this.fps = fps;
  }

  async exportMp4(
    contexts: { canvas: Canvas }[],
    outputPath: string,
    resizeConfig?: Mp4ResizeConfig,
    mp4Config?: Mp4Config,
  ): Promise<void> {
    const tempDir = '.tmp-frames-mp4';

    // Create temp dir
    mkdirSync(tempDir, { recursive: true });

    try {
      // Export frames as PNGs in parallel
      console.log(`Exporting ${contexts.length} frames for MP4...`);
      await Promise.all(
        contexts.map(async (ctx, i) => {
          const buffer = await ctx.canvas.encode('png');
          await Bun.write(
            `${tempDir}/frame-${String(i).padStart(5, '0')}.png`,
            buffer,
          );
        }),
      );

      // Build ffmpeg command
      const quality = mp4Config?.quality ?? 18; // Lower CRF for better quality than default 23
      const preset = mp4Config?.preset ?? 'medium';
      const pixelFormat = mp4Config?.pixelFormat ?? 'yuv420p'; // yuv420p for better compatibility

      let videoFilter = '';

      // Add scaling filter if resize is enabled
      if (
        resizeConfig?.enabled &&
        (resizeConfig.maxWidth || resizeConfig.maxHeight)
      ) {
        const maxW = resizeConfig.maxWidth || -2;
        const maxH = resizeConfig.maxHeight || -2;

        if (resizeConfig.maxWidth && resizeConfig.maxHeight) {
          // Scale to fit within bounds, maintaining aspect ratio
          videoFilter = `scale='min(${maxW},iw)':min(${maxH},ih):force_original_aspect_ratio=decrease:flags=neighbor`;
        } else if (resizeConfig.maxWidth) {
          videoFilter = `scale=${maxW}:-2:flags=neighbor`;
        } else if (resizeConfig.maxHeight) {
          videoFilter = `scale=-2:${maxH}:flags=neighbor`;
        }
      }

      // Use ffmpeg to create MP4
      console.log('Encoding MP4 with ffmpeg...');
      console.log(
        `Settings: CRF=${quality}, preset=${preset}, pixel_format=${pixelFormat}`,
      );

      let ffmpegCmd: string[];

      if (videoFilter) {
        ffmpegCmd = [
          'ffmpeg',
          '-y',
          '-framerate',
          String(this.fps),
          '-i',
          `${tempDir}/frame-%05d.png`,
          '-vf',
          videoFilter,
          '-c:v',
          'libx264',
          '-preset',
          preset,
          '-crf',
          String(quality),
          '-pix_fmt',
          pixelFormat,
          '-movflags',
          '+faststart', // Enable fast start for web playback
          outputPath,
        ];
      } else {
        ffmpegCmd = [
          'ffmpeg',
          '-y',
          '-framerate',
          String(this.fps),
          '-i',
          `${tempDir}/frame-%05d.png`,
          '-c:v',
          'libx264',
          '-preset',
          preset,
          '-crf',
          String(quality),
          '-pix_fmt',
          pixelFormat,
          '-movflags',
          '+faststart',
          outputPath,
        ];
      }

      const result = await $`${ffmpegCmd}`.quiet();

      if (result.exitCode !== 0) {
        throw new Error(
          `ffmpeg failed with exit code ${result.exitCode}: ${result.stderr.toString()}`,
        );
      }

      // Verify the output exists
      if (!existsSync(outputPath)) {
        throw new Error(`Output file was not created: ${outputPath}`);
      }

      const stats = Bun.file(outputPath);
      const size = await stats.size;
      console.log(
        `✓ MP4 created: ${outputPath} (${Math.round(size / 1024)}KB)`,
      );
    } finally {
      // Clean up temp files
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}
