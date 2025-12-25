import { existsSync, mkdirSync } from 'node:fs';
import { $ } from 'bun';

/**
 * Test different gifsicle resize methods to compare quality
 * Usage: bun test-resize-methods.ts <input.gif>
 */

const RESIZE_METHODS = [
  'sample', // No interpolation - best for pixel art
  'mix', // Blend colors - good for photos
  'box', // Box filter
  'catrom', // Catmull-Rom spline
  'mitchell', // Mitchell-Netravali filter
  'lanczos2', // Lanczos with a=2
  'lanczos3', // Lanczos with a=3
];

async function testResizeMethods(inputPath: string) {
  if (!existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  const outputDir = 'output/resize-tests';
  mkdirSync(outputDir, { recursive: true });

  console.log(`Testing resize methods on: ${inputPath}\n`);
  console.log('Target size: 2048x2048\n');

  const results: Array<{ method: string; size: number; time: number }> = [];

  for (const method of RESIZE_METHODS) {
    const outputPath = `${outputDir}/${method}.gif`;
    const startTime = Date.now();

    try {
      console.log(`Testing ${method}...`);

      await $`gifsicle --resize-fit 2048x2048 --resize-method=${method} --resize-colors=256 ${inputPath} -o ${outputPath}`.quiet();

      const endTime = Date.now();
      const stats = Bun.file(outputPath);
      const size = await stats.size;

      results.push({
        method,
        size: Math.round(size / 1024),
        time: endTime - startTime,
      });

      console.log(
        `  ✓ ${method}: ${Math.round(size / 1024)}KB (${endTime - startTime}ms)`,
      );
    } catch (error) {
      console.log(`  ✗ ${method}: Failed`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log('Method       | Size (KB) | Time (ms) | Recommendation');
  console.log('-'.repeat(60));

  // Sort by size (smallest first)
  results.sort((a, b) => a.size - b.size);

  for (const result of results) {
    const sizeStr = String(result.size).padEnd(9);
    const timeStr = String(result.time).padEnd(9);
    const methodStr = result.method.padEnd(12);

    let recommendation = '';
    if (result.method === 'sample') {
      recommendation = '← Best for pixel art';
    } else if (result.method === 'mix') {
      recommendation = '← Good for photos';
    }

    console.log(`${methodStr} | ${sizeStr} | ${timeStr} | ${recommendation}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`All test outputs saved to: ${outputDir}/`);
  console.log(
    `\nRecommendation: Use 'sample' for pixel art (sharp edges, no blur)`,
  );
  console.log(
    `                Use 'mix' for smooth graphics (photos, gradients)`,
  );
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: bun test-resize-methods.ts <input.gif>');
  console.error('Example: bun test-resize-methods.ts output/animation.gif');
  process.exit(1);
}

testResizeMethods(args[0]).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
