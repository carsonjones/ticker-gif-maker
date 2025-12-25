export type GridConfig = {
  width: number;
  height: number;
  pixelSize: number;
  spacing: number;
  pixelColor: string;
  bgColor: string;
  gridColor?: string;
  verticalPadding?: number;
  horizontalPadding?: number;
};

export type TransitionDirection =
  | 'from-left'
  | 'from-right'
  | 'from-top'
  | 'from-bottom'
  | 'center';

export type ExitTransition =
  | 'to-left'
  | 'to-right'
  | 'to-top'
  | 'to-bottom'
  | 'stay'
  | 'none';

export type PhraseConfig = {
  text: string;
  pauseBeforeSeconds?: number;
  pauseDuringSeconds?: number; // override global pauseFrames
  entry?: TransitionDirection; // override global entry
  exit?: ExitTransition; // override global exit
  flashColors?: string[]; // override global flashColors
  flashCurve?: 'linear' | 'ease' | 'bounce'; // override global flashCurve
};

export type AnimationConfig = {
  phrases: PhraseConfig[];
  scrollSpeed: number;
  pauseFrames: number;
  flashColors?: string[];
  flashCurve?: 'linear' | 'ease' | 'bounce';
  fps: number;
  textScale?: number;
  defaultEntry: TransitionDirection;
  defaultExit: ExitTransition;
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
    height: 56,
    pixelSize: 8,
    spacing: 2,
    pixelColor: '#00ff00',
    bgColor: '#000000',
    gridColor: '#1a1a1a',
    verticalPadding: 40,
    horizontalPadding: 20,
  },
  animation: {
    phrases: [
      {
        text: 'WELCOME',
        pauseBeforeSeconds: 2,
        pauseDuringSeconds: 2,
        flashColors: ['#00ff00', '#ffff00', '#00ff00'],
      },
      {
        text: "LET'S GIF",
        pauseBeforeSeconds: 1,
        pauseDuringSeconds: 2,
        entry: 'from-top',
        exit: 'to-bottom',
        flashColors: ['#ff00ff', '#00ffff', '#ff00ff'],
      },
    ],
    scrollSpeed: 4,
    pauseFrames: 30,
    flashColors: [
      '#00ff00',
      '#ffff00',
      '#ff8800',
      '#ff0000',
      '#ff00ff',
      '#00ff00',
    ],
    flashCurve: 'ease',
    fps: 20, // lower FPS = faster export
    textScale: 9,
    defaultEntry: 'from-left',
    defaultExit: 'to-right',
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
