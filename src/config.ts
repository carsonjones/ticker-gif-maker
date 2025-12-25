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
  format?: 'gif' | 'mp4' | 'both'; // Output format (default: gif)
  mp4?: {
    path?: string; // Optional separate path for MP4 (default: replace .gif with .mp4)
    quality?: number; // CRF value: 0-51, lower is better (default: 18)
    preset?:
      | 'ultrafast'
      | 'superfast'
      | 'veryfast'
      | 'faster'
      | 'fast'
      | 'medium'
      | 'slow'
      | 'slower'
      | 'veryslow';
    pixelFormat?: 'yuv420p' | 'yuv444p'; // yuv420p for compatibility, yuv444p for quality
  };
  compress?: {
    enabled: boolean;
    colors?: number;
    lossy?: number;
  };
  resize?: {
    enabled: boolean;
    maxWidth?: number;
    maxHeight?: number;
    method?:
      | 'sample'
      | 'mix'
      | 'box'
      | 'catrom'
      | 'mitchell'
      | 'lanczos2'
      | 'lanczos3';
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
    height: 80,
    pixelSize: 8,
    spacing: 2,
    pixelColor: '#00ff00',
    bgColor: '#000000',
    // gridColor: '#000000',
    gridColor: '#1a1a1a',
    verticalPadding: 40,
    horizontalPadding: 40,
  },
  animation: {
    phrases: [
      {
        text: 'HOWDY',
        pauseBeforeSeconds: 1,
        pauseDuringSeconds: 2,
        entry: 'from-left',
        exit: 'to-bottom',
        flashColors: ['#00ff00', '#ffff00', '#ff8800', '#ff0000'],
      },
      {
        text: "I'M CARSON",
        pauseBeforeSeconds: 1,
        pauseDuringSeconds: 2,
        entry: 'from-right',
        exit: 'to-top',
        flashColors: ['#00ff00', '#ffff00', '#ff8800', '#00ff00'],
      },
      {
        text: "LET'S BUILD",
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
    textScale: 7,
    defaultEntry: 'from-left',
    defaultExit: 'to-right',
  },
  output: {
    path: 'output/animation.gif',
    previewMode: false,
    previewPath: 'output/preview.png',
    format: 'both', // 'gif', 'mp4', or 'both'
    mp4: {
      // path: 'output/animation.mp4', // Optional: defaults to replacing .gif with .mp4
      quality: 18, // Lower = better quality (0-51, default 23)
      preset: 'medium', // Encoding speed vs compression ratio
      pixelFormat: 'yuv420p', // yuv420p for compatibility, yuv444p for quality
    },
    compress: {
      enabled: true,
      colors: 256,
      lossy: 20,
    },
    resize: {
      enabled: true,
      // maxWidth: 2048,
      // maxHeight: 2048,
      maxWidth: 1280,
      maxHeight: 1280,
      method: 'sample', // best for pixel art - no antialiasing
    },
  },
};
