import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { $ } from 'bun';

/**
 * Utility to verify and fix GIF files that may have incorrect format
 */
export async function verifyAndFixGif(filePath: string): Promise<void> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileBuffer = readFileSync(filePath);

  // Check if file is actually a GIF (GIF87a or GIF89a)
  const isGif =
    fileBuffer[0] === 0x47 && // 'G'
    fileBuffer[1] === 0x49 && // 'I'
    fileBuffer[2] === 0x46; // 'F'

  if (isGif) {
    console.log(`✓ ${filePath} is a valid GIF file`);
    return;
  }

  // Check if it's a PNG
  const isPng =
    fileBuffer[0] === 0x89 &&
    fileBuffer[1] === 0x50 && // 'P'
    fileBuffer[2] === 0x4e && // 'N'
    fileBuffer[3] === 0x47; // 'G'

  if (isPng) {
    console.log(`! ${filePath} is actually a PNG file, not a GIF!`);
    console.log('Converting PNG to GIF...');

    const tempPath = filePath + '.tmp.gif';

    // Convert PNG to GIF using ffmpeg with proper palette generation
    await $`ffmpeg -y -i ${filePath} -vf "split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" ${tempPath}`.quiet();

    // Verify the conversion worked
    const convertedBuffer = readFileSync(tempPath);
    const isConvertedGif =
      convertedBuffer[0] === 0x47 &&
      convertedBuffer[1] === 0x49 &&
      convertedBuffer[2] === 0x46;

    if (!isConvertedGif) {
      throw new Error('Conversion failed - output is still not a valid GIF');
    }

    // Replace original with converted file
    writeFileSync(filePath, convertedBuffer);

    console.log(`✓ Successfully converted ${filePath} to GIF format`);
    return;
  }

  // Check if it's a JPEG
  const isJpeg =
    fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff;

  if (isJpeg) {
    console.log(`! ${filePath} is actually a JPEG file, not a GIF!`);
    console.log('Converting JPEG to GIF...');

    const tempPath = filePath + '.tmp.gif';

    // Convert JPEG to GIF
    await $`ffmpeg -y -i ${filePath} -vf "split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" ${tempPath}`.quiet();

    // Verify and replace
    const convertedBuffer = readFileSync(tempPath);
    const isConvertedGif =
      convertedBuffer[0] === 0x47 &&
      convertedBuffer[1] === 0x49 &&
      convertedBuffer[2] === 0x46;

    if (!isConvertedGif) {
      throw new Error('Conversion failed - output is still not a valid GIF');
    }

    writeFileSync(filePath, convertedBuffer);
    console.log(`✓ Successfully converted ${filePath} to GIF format`);
    return;
  }

  throw new Error(
    `Unknown file format. First 4 bytes: ${fileBuffer.slice(0, 4).toString('hex')}`,
  );
}

/**
 * CLI usage
 */
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: bun src/fix-gif.ts <path-to-gif-file>');
    process.exit(1);
  }

  const filePath = args[0];

  verifyAndFixGif(filePath)
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
