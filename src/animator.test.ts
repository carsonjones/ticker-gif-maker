import { describe, expect, test, beforeEach } from 'bun:test';
import { Animator } from './animator';
import type { AnimationConfig, GridConfig, PhraseConfig } from './config';
import type { TextEngine } from './text-engine';

// Mock TextEngine for testing
class MockTextEngine implements TextEngine {
  getTextWidth(_text: string, _scale: number): number {
    return 40; // Fixed width for testing
  }

  getTextHeight(): number {
    return 8; // Fixed height for testing
  }

  textToGrid(_text: string, _scale: number): boolean[][] {
    // Return a simple 8x40 grid for testing
    return Array(8).fill(Array(40).fill(true));
  }

  scaleGrid(grid: boolean[][], scale: number): boolean[][] {
    const height = grid.length * scale;
    const width = grid[0]?.length ? grid[0].length * scale : 0;
    return Array(height).fill(Array(width).fill(true));
  }
}

describe('Animator - Vertical Animation Directions', () => {
  let gridConfig: GridConfig;
  let textEngine: TextEngine;

  beforeEach(() => {
    gridConfig = {
      width: 600,
      height: 100,
      pixelSize: 8,
      spacing: 2,
      pixelColor: '#00ff00',
      bgColor: '#000000',
      gridColor: '#1a1a1a',
    };
    textEngine = new MockTextEngine();
  });

  describe('top-to-bottom animation direction', () => {
    test('should position text frames from top to center then to bottom', () => {
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames: 0,
        fps: 30,
        defaultEntry: 'from-top',
        defaultExit: 'to-bottom',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      // First frame should start above the grid (negative Y)
      expect(frames[0]?.textY).toBeLessThan(0);

      const centerY = Math.floor((gridConfig.height - textEngine.getTextHeight()) / 2);
      
      // Should have frames that reach or pass through center
      const centerFrame = frames.find(f => f.textY >= centerY && f.textY <= centerY + animationConfig.scrollSpeed);
      expect(centerFrame).toBeDefined();

      // Last frame should be moving toward or at bottom (exit animation)
      const lastFrame = frames[frames.length - 1];
      expect(lastFrame?.textY).toBeGreaterThan(centerY);
    });

    test('should use centerX for horizontal positioning', () => {
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames: 0,
        fps: 30,
        defaultEntry: 'from-top',
        defaultExit: 'to-bottom',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      const textWidth = textEngine.getTextWidth('TEST', 1);
      const centerX = Math.floor((gridConfig.width - textWidth) / 2);

      // All frames should have the same X position (centered)
      for (const frame of frames) {
        expect(frame.textX).toBe(centerX);
      }
    });
  });

  describe('bottom-to-top animation direction', () => {
    test('should position text frames from bottom to center then to top', () => {
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames: 0,
        fps: 30,
        defaultEntry: 'from-bottom',
        defaultExit: 'to-top',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      // First frame should start below the grid
      expect(frames[0]?.textY).toBeGreaterThanOrEqual(gridConfig.height);

      const centerY = Math.floor((gridConfig.height - textEngine.getTextHeight()) / 2);
      
      // Should have frames that reach or pass through center
      const centerFrame = frames.find(f => f.textY >= centerY - animationConfig.scrollSpeed && f.textY <= centerY);
      expect(centerFrame).toBeDefined();

      // Last frame should be moving toward or at top (exit animation)
      const lastFrame = frames[frames.length - 1];
      expect(lastFrame?.textY).toBeLessThan(centerY);
    });

    test('should use centerX for horizontal positioning', () => {
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames: 0,
        fps: 30,
        defaultEntry: 'from-bottom',
        defaultExit: 'to-top',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      const textWidth = textEngine.getTextWidth('TEST', 1);
      const centerX = Math.floor((gridConfig.width - textWidth) / 2);

      // All frames should have the same X position (centered)
      for (const frame of frames) {
        expect(frame.textX).toBe(centerX);
      }
    });
  });

  describe('center animation direction', () => {
    test('should position text at center without movement', () => {
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames: 10,
        fps: 30,
        defaultEntry: 'center',
        defaultExit: 'none',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      const textWidth = textEngine.getTextWidth('TEST', 1);
      const centerX = Math.floor((gridConfig.width - textWidth) / 2);
      const centerY = Math.floor((gridConfig.height - textEngine.getTextHeight()) / 2);

      // Should have pause frames at center position
      expect(frames.length).toBe(10);

      // All frames should be at center position
      for (const frame of frames) {
        expect(frame.textX).toBe(centerX);
        expect(frame.textY).toBe(centerY);
      }
    });

    test('should handle pauseFrames with center direction', () => {
      const pauseFrames = 15;
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames,
        fps: 30,
        defaultEntry: 'center',
        defaultExit: 'none',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      // Should generate exactly pauseFrames number of frames
      expect(frames.length).toBe(pauseFrames);

      const textWidth = textEngine.getTextWidth('TEST', 1);
      const centerX = Math.floor((gridConfig.width - textWidth) / 2);
      const centerY = Math.floor((gridConfig.height - textEngine.getTextHeight()) / 2);

      // All frames should be at center
      for (const frame of frames) {
        expect(frame.textX).toBe(centerX);
        expect(frame.textY).toBe(centerY);
      }
    });
  });

  describe('pauseFrames functionality with vertical animations', () => {
    test('should add pause frames at center position for top-to-bottom', () => {
      const pauseFrames = 10;
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames,
        fps: 30,
        defaultEntry: 'from-top',
        defaultExit: 'none',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      const textHeight = textEngine.getTextHeight();
      const centerY = Math.floor((gridConfig.height - textHeight) / 2);
      
      // Calculate expected scroll frames
      const scrollDistance = centerY + textHeight; // from -textHeight to centerY
      const expectedScrollFrames = Math.ceil(scrollDistance / animationConfig.scrollSpeed);

      // Total frames should be scroll frames + pause frames
      expect(frames.length).toBe(expectedScrollFrames + pauseFrames);

      // Last pauseFrames should all be at center position
      for (let i = frames.length - pauseFrames; i < frames.length; i++) {
        expect(frames[i]?.textY).toBe(centerY);
      }
    });

    test('should add pause frames at center position for bottom-to-top', () => {
      const pauseFrames = 10;
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames,
        fps: 30,
        defaultEntry: 'from-bottom',
        defaultExit: 'none',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      const textHeight = textEngine.getTextHeight();
      const centerY = Math.floor((gridConfig.height - textHeight) / 2);
      
      // Calculate expected scroll frames
      const scrollDistance = gridConfig.height - centerY;
      const expectedScrollFrames = Math.ceil(scrollDistance / animationConfig.scrollSpeed);

      // Total frames should be scroll frames + pause frames
      expect(frames.length).toBe(expectedScrollFrames + pauseFrames);

      // Last pauseFrames should all be at center position
      for (let i = frames.length - pauseFrames; i < frames.length; i++) {
        expect(frames[i]?.textY).toBe(centerY);
      }
    });

    test('should maintain consistent position during pause frames', () => {
      const pauseFrames = 20;
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames,
        fps: 30,
        defaultEntry: 'from-top',
        defaultExit: 'to-bottom',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      const textWidth = textEngine.getTextWidth('TEST', 1);
      const centerX = Math.floor((gridConfig.width - textWidth) / 2);
      const centerY = Math.floor((gridConfig.height - textEngine.getTextHeight()) / 2);

      // Find where pause frames should start (after entry animation)
      const textHeight = textEngine.getTextHeight();
      const entryDistance = centerY + textHeight;
      const entryFrames = Math.ceil(entryDistance / animationConfig.scrollSpeed);

      // Verify pause frames
      for (let i = entryFrames; i < entryFrames + pauseFrames; i++) {
        const frame = frames[i];
        expect(frame?.textX).toBe(centerX);
        expect(frame?.textY).toBe(centerY);
        expect(frame?.text).toBe('TEST');
      }
    });

    test('should respect pauseFrames = 0', () => {
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames: 0,
        fps: 30,
        defaultEntry: 'from-top',
        defaultExit: 'to-bottom',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      const textHeight = textEngine.getTextHeight();
      const centerY = Math.floor((gridConfig.height - textHeight) / 2);
      
      // Calculate expected frames (entry + exit, no pause)
      const entryDistance = centerY + textHeight;
      const entryFrames = Math.ceil(entryDistance / animationConfig.scrollSpeed);
      const exitDistance = gridConfig.height - centerY;
      const exitFrames = Math.ceil(exitDistance / animationConfig.scrollSpeed);
      
      expect(frames.length).toBe(entryFrames + exitFrames);
    });
  });

  describe('vertical animation with exit transitions', () => {
    test('should animate from top to center then to bottom', () => {
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames: 5,
        fps: 30,
        defaultEntry: 'from-top',
        defaultExit: 'to-bottom',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      const textHeight = textEngine.getTextHeight();
      const centerY = Math.floor((gridConfig.height - textHeight) / 2);

      // First frame should be above grid
      expect(frames[0]?.textY).toBeLessThan(0);

      // Find center frames
      const centerFrames = frames.filter(f => f.textY === centerY);
      expect(centerFrames.length).toBeGreaterThanOrEqual(5);

      // Last frame should be below grid or moving toward it
      const lastFrame = frames[frames.length - 1];
      expect(lastFrame?.textY).toBeGreaterThan(centerY);
    });

    test('should animate from bottom to center then to top', () => {
      const animationConfig: AnimationConfig = {
        phrases: [{ text: 'TEST' }],
        scrollSpeed: 4,
        pauseFrames: 5,
        fps: 30,
        defaultEntry: 'from-bottom',
        defaultExit: 'to-top',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      const textHeight = textEngine.getTextHeight();
      const centerY = Math.floor((gridConfig.height - textHeight) / 2);

      // First frame should be below grid
      expect(frames[0]?.textY).toBeGreaterThanOrEqual(gridConfig.height);

      // Find center frames
      const centerFrames = frames.filter(f => f.textY === centerY);
      expect(centerFrames.length).toBeGreaterThanOrEqual(5);

      // Last frame should be above grid or moving toward it
      const lastFrame = frames[frames.length - 1];
      expect(lastFrame?.textY).toBeLessThan(centerY);
    });
  });

  describe('per-phrase animation overrides', () => {
    test('should respect phrase-specific entry and exit for vertical animations', () => {
      const animationConfig: AnimationConfig = {
        phrases: [
          { text: 'FIRST', entry: 'from-top', exit: 'to-bottom' },
          { text: 'SECOND', entry: 'from-bottom', exit: 'to-top' },
        ],
        scrollSpeed: 4,
        pauseFrames: 5,
        fps: 30,
        defaultEntry: 'from-left',
        defaultExit: 'to-right',
      };

      const animator = new Animator(animationConfig, gridConfig, textEngine);
      const frames = animator.generateFrames();

      expect(frames.length).toBeGreaterThan(0);
      
      // Verify frames contain both phrases
      const firstPhraseFrames = frames.filter(f => f.text === 'FIRST');
      const secondPhraseFrames = frames.filter(f => f.text === 'SECOND');
      
      expect(firstPhraseFrames.length).toBeGreaterThan(0);
      expect(secondPhraseFrames.length).toBeGreaterThan(0);

      // First phrase should start from top
      expect(firstPhraseFrames[0]?.textY).toBeLessThan(0);
      
      // Second phrase should start from bottom
      expect(secondPhraseFrames[0]?.textY).toBeGreaterThanOrEqual(gridConfig.height);
    });
  });
});
