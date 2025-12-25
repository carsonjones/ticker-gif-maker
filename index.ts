import { Animator } from './src/animator';
import { DEFAULT_CONFIG } from './src/config';
import { GifExporter } from './src/gif-exporter';
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

  console.log('Generating full GIF animation...');

  const animator = new Animator(config.animation, config.grid, textEngine);

  console.log('Rendering frames...');
  const contexts = await animator.renderFrames();
  console.log(`Generated ${contexts.length} frames`);

  const canvasWidth =
    config.grid.width * (config.grid.pixelSize + config.grid.spacing);
  const canvasHeight =
    config.grid.height * (config.grid.pixelSize + config.grid.spacing);

  const gifExporter = new GifExporter(
    canvasWidth,
    canvasHeight,
    config.animation.fps,
  );

  console.log(`Exporting GIF to ${config.output.path}...`);
  await gifExporter.exportGif(contexts, config.output.path);

  console.log('Done!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
