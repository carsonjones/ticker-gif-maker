import type { GridConfig } from './config';

type FontData = {
  height: number;
  characters: Record<string, string[]>;
};

export function calculateOptimalScale(
  text: string,
  grid: GridConfig,
  fontData: FontData,
  maxWidthRatio = 0.95, // use 95% of available width
  maxHeightRatio = 0.45  // use 45% of available height (for vertical movement)
): number {
  // Calculate text width in font pixels
  let textWidth = 0;
  for (const char of text) {
    const charData = fontData.characters[char] || fontData.characters[' '];
    if (charData && charData[0]) {
      textWidth += charData[0].length + 1; // +1 for spacing between chars
    }
  }
  textWidth -= 1; // remove trailing space

  const textHeight = fontData.height;

  // Available space in grid pixels
  const availableWidth = grid.width - (grid.horizontalPadding || 0) * 2;
  const availableHeight = grid.height - (grid.verticalPadding || 0) * 2;

  // Calculate max scale for width and height
  const maxScaleWidth = Math.floor((availableWidth * maxWidthRatio) / textWidth);
  const maxScaleHeight = Math.floor((availableHeight * maxHeightRatio) / textHeight);

  // Use the smaller of the two
  return Math.max(1, Math.min(maxScaleWidth, maxScaleHeight));
}
