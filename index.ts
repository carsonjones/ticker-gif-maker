import { Animator } from './src/animator';
import { DEFAULT_CONFIG } from './src/config';
import { GifExporter } from './src/gif-exporter';
import { Mp4Exporter } from './src/mp4-exporter';
import { generatePreview } from './src/preview';
import { TextEngine } from './src/text-engine';

async function main() {
  const config = DEFAULT_CONFIG;

  const textEngine = new TextEngine('fonts/block.json');
  await textEngine.initialize();

  if (config.output.previewMode) {
    console.log('Preview mode - generating single frame PNG...');
    const previewPath = config.output.previewPath || 'output/preview.png';
    await generatePreview(
      config.animation,
      config.grid,
      textEngine,
      previewPath,
    );
    console.log(`Preview saved to ${previewPath}`);
    return;
  }

  const format = config.output.format || 'gif';
  console.log(`Generating animation (format: ${format})...`);

  const animator = new Animator(config.animation, config.grid, textEngine);

  console.log('Rendering frames...');
  const contexts = await animator.renderFrames();
  console.log(`Generated ${contexts.length} frames`);

  const canvasWidth =
    config.grid.width * (config.grid.pixelSize + config.grid.spacing);
  const canvasHeight =
    config.grid.height * (config.grid.pixelSize + config.grid.spacing);

  // Export GIF if requested
  if (format === 'gif' || format === 'both') {
    const gifExporter = new GifExporter(
      canvasWidth,
      canvasHeight,
      config.animation.fps,
    );

    console.log(`Exporting GIF to ${config.output.path}...`);
    await gifExporter.exportGif(
      contexts,
      config.output.path,
      config.output.resize,
    );
  }

  // Export MP4 if requested
  if (format === 'mp4' || format === 'both') {
    const mp4Exporter = new Mp4Exporter(
      canvasWidth,
      canvasHeight,
      config.animation.fps,
    );

    // Determine MP4 output path
    const mp4Path =
      config.output.mp4?.path || config.output.path.replace(/\.gif$/i, '.mp4');

    console.log(`Exporting MP4 to ${mp4Path}...`);
    await mp4Exporter.exportMp4(
      contexts,
      mp4Path,
      config.output.resize,
      config.output.mp4,
    );
  }

  console.log('Done!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
