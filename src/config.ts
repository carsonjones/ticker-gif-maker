export type GridConfig = {
  width: number;
  height: number;
  pixelSize: number;
  spacing: number;
  pixelColor: string;
  bgColor: string;
  gridColor?: string;
};

export type PhraseConfig = {
  text: string;
  pauseBeforeSeconds?: number; // pause before showing this phrase
};

export type AnimationConfig = {
  phrases: PhraseConfig[];
  scrollSpeed: number;
  pauseFrames: number;
  stopAtCenter: boolean;
  flashColors?: string[];
  flashCurve?: 'linear' | 'ease' | 'bounce';
  fps: number;
  textScale?: number;
  direction?: 'left-to-right' | 'right-to-left' | 'center' | 'top-to-bottom' | 'bottom-to-top';
};

export type OutputConfig = {
  path: string;
  previewMode?: false;
  previewPath?: string;
  compress?: {
    enabled: boolean;
    colors?: number;
    lossy?: number;
  };
};

export type Config = {
  grid: GridConfig;
  animation: AnimationConfig;
  output: OutputConfig;
};

export const DEFAULT_CONFIG: Config = {
  grid: {
    width: 600,
    height: 48,
    pixelSize: 8,
    spacing: 2,
    pixelColor: '#00ff00',
    bgColor: '#000000',
    gridColor: '#1a1a1a',
  },
  animation: {
    phrases: [
      { text: "HOWDY", pauseBeforeSeconds: 0 },
      { text: "FOLKS", pauseBeforeSeconds: 1 },
    ],
    scrollSpeed: 4,
    pauseFrames: 30,
    stopAtCenter: true,
    flashColors: ['#00ff00', '#ffff00', '#00ff00'],
    flashCurve: 'ease',
    fps: 30,
    textScale: 9,
    direction: 'left-to-right',
  },
  output: {
    path: 'output/animation.gif',
    previewMode: false,
    previewPath: 'output/preview.png',
    compress: {
      enabled: true,
      colors: 256,
      lossy: 80,
    },
  },
};
