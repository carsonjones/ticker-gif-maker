import GifEncoder from 'gif-encoder-2';

export class GifExporter {
  private width: number;
  private height: number;
  private fps: number;

  constructor(width: number, height: number, fps: number) {
    this.width = width;
    this.height = height;
    this.fps = fps;
  }

  async exportGif(contexts: any[], outputPath: string): Promise<void> {
    const encoder = new GifEncoder(this.width, this.height, 'octree');

    encoder.setRepeat(0);
    encoder.setDelay(Math.floor(1000 / this.fps));
    encoder.setQuality(10);

    encoder.start();

    for (const ctx of contexts) {
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      encoder.addFrame(imageData.data);
    }

    encoder.finish();

    const buffer = encoder.out.getData();
    await Bun.write(outputPath, buffer);
  }
}
