import { createCanvas, loadImage } from "@napi-rs/canvas";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VignetteBloomRenderer, createParams } from "../ascii-editor/vignette-bloom.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const sourcePath = path.join(repositoryRoot, "ascii-editor", "demos", "generated", "profile-source.png");
const outputDirectory = path.join(repositoryRoot, "assets");
const outputPath = path.join(outputDirectory, "profile-vignette-bloom.webp");

const width = 720;
const height = 720;
const frames = 24;
const framesPerSecond = 12;
const frameDelay = Math.round(1000 / framesPerSecond);

const params = createParams({
  renderMode: "mosaic",
  bgMode: "solid",
  bgColor: "#05080d",
  bgBlur: 12,
  bgOpacity: 90,
  cellSize: 16,
  coverage: 100,
  invert: false,
  brightness: 12,
  contrast: 115,
  edgeEmphasis: 0,
  density: 0,
  tint: "#3ca6ff",
  tintOpacity: 0,
  overlayBlend: "multiply",
  saturation: 100,
  grayscale: 0,
  blurType: "off",
  pfx: {
    vignette: { enabled: true, intensity: 38 },
    scanLines: { enabled: false, intensity: 40 },
    chromatic: { enabled: false, intensity: 15 },
    bloom: { enabled: true, intensity: 25 },
    filmGrain: { enabled: false, intensity: 30 },
    glitch: { enabled: false, intensity: 20 },
    pixelate: { enabled: false, intensity: 15 },
    halftone: { enabled: false, intensity: 20 },
    filmDust: { enabled: false, intensity: 20 },
  },
  animated: true,
  animStyle: "wave",
  animSpeed: { enabled: true, intensity: 100 },
  animIntensity: { enabled: true, intensity: 60 },
  lights: { enabled: false, points: [] },
  mask: { enabled: false, dataUrl: null, invert: false },
});

await mkdir(outputDirectory, { recursive: true });
const source = await loadImage(sourcePath);
const canvas = createCanvas(width, height);
const renderer = new VignetteBloomRenderer(canvas, {
  source,
  params,
  canvasFactory: (canvasWidth, canvasHeight) => createCanvas(canvasWidth, canvasHeight),
});

const bytesPerFrame = width * height * 4;
const stackedFrames = Buffer.allocUnsafe(bytesPerFrame * frames);
const context = canvas.getContext("2d", { willReadFrequently: true });

for (let frame = 0; frame < frames; frame += 1) {
  renderer.render((frame * 1000) / framesPerSecond);
  const pixels = context.getImageData(0, 0, width, height).data;
  Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength).copy(stackedFrames, frame * bytesPerFrame);
  process.stdout.write(`\rRendering Vignette Bloom frame ${String(frame + 1).padStart(2, "0")}/${frames}`);
}

await sharp(stackedFrames, {
  raw: {
    width,
    height: height * frames,
    channels: 4,
    pageHeight: height,
  },
  animated: true,
})
  .webp({
    quality: 84,
    alphaQuality: 92,
    effort: 5,
    loop: 0,
    delay: Array.from({ length: frames }, () => frameDelay),
  })
  .toFile(outputPath);

const metadata = await sharp(outputPath, { animated: true }).metadata();
process.stdout.write("\n");
console.log(`Wrote ${path.relative(repositoryRoot, outputPath)} (${metadata.width}x${metadata.pageHeight}, ${metadata.pages} frames)`);
