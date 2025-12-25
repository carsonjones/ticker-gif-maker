import type { SKRSContext2D } from '@napi-rs/canvas';
import type { AnimationConfig, GridConfig } from './config';
import { Renderer } from './renderer';
import type { TextEngine } from './text-engine';

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
    textEngine: TextEngine,
  ) {
    this.animationConfig = animationConfig;
    this.gridConfig = gridConfig;
    this.textEngine = textEngine;
    const scale = animationConfig.textScale || 1;
    this.textHeight = textEngine.getTextHeight() * scale;
  }

  easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }

  easeBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      const t2 = t - 1.5 / d1;
      return n1 * t2 * t2 + 0.75;
    } else if (t < 2.5 / d1) {
      const t2 = t - 2.25 / d1;
      return n1 * t2 * t2 + 0.9375;
    } else {
      const t2 = t - 2.625 / d1;
      return n1 * t2 * t2 + 0.984375;
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

  getColorAtFrame(frameIndex: number, totalFrames: number, phrase?: import('./config').PhraseConfig): string {
    const colors = phrase?.flashColors || this.animationConfig.flashColors;
    const curve = phrase?.flashCurve || this.animationConfig.flashCurve || 'linear';

    if (!colors || colors.length === 0) {
      return this.gridConfig.pixelColor;
    }

    if (colors.length === 1) {
      return colors[0]!;
    }

    const t = frameIndex / Math.max(1, totalFrames - 1);
    const easedT = this.applyEasing(t, curve);

    const segmentCount = colors.length - 1;
    const segmentIndex = Math.min(
      Math.floor(easedT * segmentCount),
      segmentCount - 1,
    );
    const segmentT = easedT * segmentCount - segmentIndex;

    return this.interpolateColor(
      colors[segmentIndex]!,
      colors[segmentIndex + 1]!,
      segmentT,
    );
  }

  generatePhraseFrames(
    phrase: import('./config').PhraseConfig,
    textWidth: number,
    centerY: number,
  ): Frame[] {
    const frames: Frame[] = [];
    const centerX = Math.floor((this.gridConfig.width - textWidth) / 2);

    const entry = phrase.entry || this.animationConfig.defaultEntry;
    const exit = phrase.exit || this.animationConfig.defaultExit;

    let totalFrameCount = 0;

    // Generate entry frames
    const entryFrames = this.generateTransitionFrames(
      entry,
      true,
      centerX,
      centerY,
      textWidth,
      phrase.text,
      phrase,
    );
    frames.push(...entryFrames);
    totalFrameCount += entryFrames.length;

    // Generate pause frames at center
    const pauseFrameCount = phrase.pauseDuringSeconds !== undefined
      ? Math.ceil(phrase.pauseDuringSeconds * this.animationConfig.fps)
      : this.animationConfig.pauseFrames;

    for (let i = 0; i < pauseFrameCount; i++) {
      frames.push({
        textX: centerX,
        textY: centerY,
        color: this.getColorAtFrame(totalFrameCount + i, totalFrameCount + pauseFrameCount, phrase),
        text: phrase.text,
      });
    }
    totalFrameCount += pauseFrameCount;

    // Generate exit frames
    if (exit !== 'stay' && exit !== 'none') {
      const exitFrames = this.generateTransitionFrames(
        exit,
        false,
        centerX,
        centerY,
        textWidth,
        phrase.text,
        phrase,
      );
      frames.push(...exitFrames);
    }

    return frames;
  }

  generateTransitionFrames(
    transition: import('./config').TransitionDirection | import('./config').ExitTransition,
    isEntry: boolean,
    centerX: number,
    centerY: number,
    textWidth: number,
    text: string,
    phrase?: import('./config').PhraseConfig,
  ): Frame[] {
    const frames: Frame[] = [];

    let startX: number = centerX;
    let startY: number = centerY;
    let endX: number = centerX;
    let endY: number = centerY;

    switch (transition) {
      case 'from-left':
      case 'to-left':
        if (transition === 'from-left') {
          startX = -textWidth;
          endX = centerX;
        } else {
          startX = centerX;
          endX = -textWidth;
        }
        break;
      case 'from-right':
      case 'to-right':
        if (transition === 'from-right') {
          startX = this.gridConfig.width;
          endX = centerX;
        } else {
          startX = centerX;
          endX = this.gridConfig.width;
        }
        break;
      case 'from-top':
      case 'to-top':
        if (transition === 'from-top') {
          startY = -this.textHeight;
          endY = centerY;
        } else {
          startY = centerY;
          endY = -this.textHeight;
        }
        break;
      case 'from-bottom':
      case 'to-bottom':
        if (transition === 'from-bottom') {
          startY = this.gridConfig.height;
          endY = centerY;
        } else {
          startY = centerY;
          endY = this.gridConfig.height;
        }
        break;
      case 'center':
        // no movement, just return empty frames
        return frames;
    }

    const distanceX = Math.abs(endX - startX);
    const distanceY = Math.abs(endY - startY);
    const distance = Math.max(distanceX, distanceY);

    if (distance === 0) return frames;

    const frameCount = Math.ceil(distance / this.animationConfig.scrollSpeed);
    const directionX = endX > startX ? 1 : endX < startX ? -1 : 0;
    const directionY = endY > startY ? 1 : endY < startY ? -1 : 0;

    for (let i = 0; i < frameCount; i++) {
      const x = startX + i * this.animationConfig.scrollSpeed * directionX;
      const y = startY + i * this.animationConfig.scrollSpeed * directionY;

      frames.push({
        textX: x,
        textY: y,
        color: this.getColorAtFrame(i, frameCount, phrase),
        text,
      });
    }

    return frames;
  }

  generateFrames(): Frame[] {
    const allFrames: Frame[] = [];
    const vPadding = this.gridConfig.verticalPadding ?? 2;
    const centerY = vPadding + Math.floor((this.gridConfig.height - this.textHeight - vPadding * 2) / 2);

    for (const phrase of this.animationConfig.phrases) {
      // Add pause frames before this phrase
      if (phrase.pauseBeforeSeconds && phrase.pauseBeforeSeconds > 0) {
        const pauseFrameCount = Math.ceil(
          phrase.pauseBeforeSeconds * this.animationConfig.fps,
        );
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
      const phraseFrames = this.generatePhraseFrames(
        phrase,
        textWidth,
        centerY,
      );
      allFrames.push(...phraseFrames);
    }

    return allFrames;
  }

  async renderFrames(): Promise<{ canvas: import('@napi-rs/canvas').Canvas; context: SKRSContext2D }[]> {
    const frames = this.generateFrames();
    const results: { canvas: import('@napi-rs/canvas').Canvas; context: SKRSContext2D }[] = [];
    const scale = this.animationConfig.textScale || 1;

    // Cache text grids to avoid re-computing
    const textGridCache = new Map<string, boolean[][]>();

    for (const frame of frames) {
      // Create new renderer per frame to get separate canvas
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

        renderer.renderTextGrid(
          textGrid,
          frame.textX,
          frame.textY,
          frame.color,
        );
      }

      results.push({
        canvas: renderer.getCanvas(),
        context: renderer.getContext(),
      });
    }

    return results;
  }
}
