import { $ } from 'bun';

export type CompressionConfig = {
  enabled: boolean;
  colors?: number; // max colors (default 256)
  lossy?: number; // lossy level 0-200 (default 80)
};

export async function compressGif(
  inputPath: string,
  compressionConfig: CompressionConfig
): Promise<void> {
  if (!compressionConfig.enabled) return;

  const colors = compressionConfig.colors || 256;
  const lossy = compressionConfig.lossy || 80;

  const tempPath = inputPath.replace(/\.gif$/, '.temp.gif');

  // Use gifsicle for compression
  // --colors reduces palette
  // --lossy applies lossy compression
  // --optimize=3 maximum optimization
  await $`gifsicle --colors ${colors} --lossy=${lossy} --optimize=3 ${inputPath} -o ${tempPath}`;

  // Replace original with compressed
  await $`mv ${tempPath} ${inputPath}`;
}
