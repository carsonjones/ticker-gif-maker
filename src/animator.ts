import type { AnimationConfig, GridConfig } from './config';
import { Renderer } from './renderer';
import { TextEngine } from './text-engine';

type Frame = {
  textX: number;
  textY: number;
  color: string;
  text?: string; // store text for rendering
};

export class Animator {
  private animationConfig: AnimationConfig;
  private gridConfig: GridConfig;
  private textEngine: TextEngine;
  private textHeight: number;

  constructor(
    animationConfig: AnimationConfig,
    gridConfig: GridConfig,
    textEngine: TextEngine
  ) {
    this.animationConfig = animationConfig;
    this.gridConfig = gridConfig;
    this.textEngine = textEngine;
    const scale = animationConfig.textScale || 1;
    this.textHeight = textEngine.getTextHeight() * scale;
  }

  easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  easeBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  applyEasing(t: number, curve: 'linear' | 'ease' | 'bounce'): number {
    switch (curve) {
      case 'linear':
        return t;
      case 'ease':
        return this.easeInOutQuad(t);
      case 'bounce':
        return this.easeBounce(t);
      default:
        return t;
    }
  }

  interpolateColor(color1: string, color2: string, t: number): string {
    const parseHex = (hex: string) => {
      const clean = hex.replace('#', '');
      return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16),
      };
    };

    const c1 = parseHex(color1);
    const c2 = parseHex(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getColorAtFrame(frameIndex: number, totalFrames: number): string {
    if (!this.animationConfig.flashColors || this.animationConfig.flashColors.length === 0) {
      return this.gridConfig.pixelColor;
    }

    const colors = this.animationConfig.flashColors;
    if (colors.length === 1) {
      return colors[0];
    }

    const t = frameIndex / Math.max(1, totalFrames - 1);
    const easedT = this.applyEasing(t, this.animationConfig.flashCurve || 'linear');

    const segmentCount = colors.length - 1;
    const segmentIndex = Math.min(
      Math.floor(easedT * segmentCount),
      segmentCount - 1
    );
    const segmentT = (easedT * segmentCount) - segmentIndex;

    return this.interpolateColor(
      colors[segmentIndex],
      colors[segmentIndex + 1],
      segmentT
    );
  }

  generatePhraseFrames(text: string, textWidth: number, centerY: number): Frame[] {
    const frames: Frame[] = [];
    const direction = this.animationConfig.direction || 'right-to-left';

    let startX: number;
    let endX: number;
    let moveDirection: number;

    if (direction === 'left-to-right') {
      startX = -textWidth;
      if (this.animationConfig.stopAtCenter) {
        endX = Math.floor((this.gridConfig.width - textWidth) / 2);
      } else {
        endX = this.gridConfig.width;
      }
      moveDirection = 1;
    } else {
      startX = this.gridConfig.width;
      if (this.animationConfig.stopAtCenter) {
        endX = Math.floor((this.gridConfig.width - textWidth) / 2);
      } else {
        endX = -textWidth;
      }
      moveDirection = -1;
    }

    const scrollDistance = Math.abs(endX - startX);
    const scrollFrames = Math.ceil(scrollDistance / this.animationConfig.scrollSpeed);

    for (let i = 0; i < scrollFrames; i++) {
      const currentX = startX + i * this.animationConfig.scrollSpeed * moveDirection;
      frames.push({
        textX: currentX,
        textY: centerY,
        color: this.getColorAtFrame(i, scrollFrames),
        text,
      });
    }

    if (this.animationConfig.stopAtCenter) {
      const finalX = frames[frames.length - 1]?.textX || endX;
      for (let i = 0; i < this.animationConfig.pauseFrames; i++) {
        frames.push({
          textX: finalX,
          textY: centerY,
          color: this.getColorAtFrame(
            scrollFrames + i,
            scrollFrames + this.animationConfig.pauseFrames
          ),
          text,
        });
      }
    } else {
      const centerX = Math.floor((this.gridConfig.width - textWidth) / 2);

      let pauseStartFrame = -1;
      for (let i = 0; i < frames.length; i++) {
        if (
          (moveDirection === 1 && frames[i].textX >= centerX) ||
          (moveDirection === -1 && frames[i].textX <= centerX)
        ) {
          pauseStartFrame = i;
          break;
        }
      }

      if (pauseStartFrame >= 0 && this.animationConfig.pauseFrames > 0) {
        const pauseX = frames[pauseStartFrame].textX;
        const pauseFrames: Frame[] = [];

        for (let i = 0; i < this.animationConfig.pauseFrames; i++) {
          pauseFrames.push({
            textX: pauseX,
            textY: centerY,
            color: this.getColorAtFrame(
              pauseStartFrame + i,
              scrollFrames + this.animationConfig.pauseFrames
            ),
            text,
          });
        }

        frames.splice(pauseStartFrame, 0, ...pauseFrames);
      }
    }

    return frames;
  }

  generateFrames(): Frame[] {
    const allFrames: Frame[] = [];
    const centerY = Math.floor((this.gridConfig.height - this.textHeight) / 2);

    for (const phrase of this.animationConfig.phrases) {
      // Add pause frames before this phrase
      if (phrase.pauseBeforeSeconds && phrase.pauseBeforeSeconds > 0) {
        const pauseFrameCount = Math.ceil(phrase.pauseBeforeSeconds * this.animationConfig.fps);
        for (let i = 0; i < pauseFrameCount; i++) {
          allFrames.push({
            textX: -10000, // offscreen
            textY: centerY,
            color: this.gridConfig.pixelColor,
            text: '', // blank frame
          });
        }
      }

      // Generate frames for this phrase
      const scale = this.animationConfig.textScale || 1;
      const textWidth = this.textEngine.getTextWidth(phrase.text, 1) * scale;
      const phraseFrames = this.generatePhraseFrames(phrase.text, textWidth, centerY);
      allFrames.push(...phraseFrames);
    }

    return allFrames;
  }

  async renderFrames(): Promise<any[]> {
    const frames = this.generateFrames();
    const contexts: any[] = [];
    const scale = this.animationConfig.textScale || 1;

    // Cache text grids to avoid re-computing
    const textGridCache = new Map<string, any>();

    for (const frame of frames) {
      const renderer = new Renderer(this.gridConfig);
      renderer.clearCanvas();

      if (frame.text && frame.text.length > 0) {
        // Get or create text grid for this phrase
        let textGrid = textGridCache.get(frame.text);
        if (!textGrid) {
          textGrid = this.textEngine.textToGrid(frame.text, 1);
          if (scale > 1) {
            textGrid = this.textEngine.scaleGrid(textGrid, scale);
          }
          textGridCache.set(frame.text, textGrid);
        }

        renderer.renderTextGrid(textGrid, frame.textX, frame.textY, frame.color);
      }

      const ctx = renderer.getContext();
      contexts.push(ctx);
    }

    return contexts;
  }
}
