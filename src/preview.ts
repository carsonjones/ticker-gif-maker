import type { AnimationConfig, GridConfig } from './config';
import { Renderer } from './renderer';
import type { TextEngine } from './text-engine';

export async function generatePreview(
  animationConfig: AnimationConfig,
  gridConfig: GridConfig,
  textEngine: TextEngine,
  outputPath: string,
): Promise<void> {
  // Use first phrase for preview
  const text = animationConfig.phrases[0]?.text || '';
  let textGrid = textEngine.textToGrid(text, 1);

  const scale = animationConfig.textScale || 1;
  if (scale > 1) {
    textGrid = textEngine.scaleGrid(textGrid, scale);
  }

  const textWidth = textGrid[0]?.length || 0;
  const textHeight = textGrid.length;

  const renderer = new Renderer(gridConfig);
  renderer.clearCanvas();

  const centerX = Math.floor((gridConfig.width - textWidth) / 2);
  const centerY = Math.floor((gridConfig.height - textHeight) / 2);

  const color = animationConfig.flashColors?.[0] || gridConfig.pixelColor;
  renderer.renderTextGrid(textGrid, centerX, centerY, color);

  const canvas = renderer.getCanvas();
  const buffer = await canvas.encode('png');
  await Bun.write(outputPath, buffer);
}
