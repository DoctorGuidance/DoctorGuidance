import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RENDER_MODES, VignetteBloomRenderer, createParams } from "../ascii-editor/vignette-bloom.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await loadImage(path.join(repositoryRoot, "ascii-editor", "demos", "generated", "ref-008.webp"));
const width = 192;
const height = 108;
const canvas = createCanvas(width, height);
const canvasFactory = (canvasWidth, canvasHeight) => createCanvas(canvasWidth, canvasHeight);
const disabledPfx = {
  scanLines: { enabled: false, intensity: 30 },
  vignette: { enabled: false, intensity: 30 },
  bloom: { enabled: false, intensity: 30 },
  chromatic: { enabled: false, intensity: 30 },
  filmGrain: { enabled: false, intensity: 30 },
  glitch: { enabled: false, intensity: 30 },
  halftone: { enabled: false, intensity: 30 },
  pixelate: { enabled: false, intensity: 30 },
  filmDust: { enabled: false, intensity: 30 },
};
const renderer = new VignetteBloomRenderer(canvas, {
  source,
  canvasFactory,
  params: createParams({ cellSize: 9, pfx: disabledPfx }),
});

function assertVisible(label) {
  const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, width, height).data;
  let energy = 0;
  for (let offset = 0; offset < pixels.length; offset += 256) {
    energy += pixels[offset] + pixels[offset + 1] + pixels[offset + 2] + pixels[offset + 3];
  }
  if (energy <= 0) throw new Error(`${label} produced an empty frame`);
}

for (const mode of RENDER_MODES) {
  renderer.setParams({ renderMode: mode, blurType: "off", pfx: disabledPfx, mask: { enabled: false }, lights: { enabled: false } });
  renderer.render(420);
  assertVisible(`renderMode=${mode}`);
}

for (const blurType of ["off", "gaussian", "directional", "tilt-shift", "lens", "progressive"]) {
  renderer.setParams({ renderMode: "mosaic", blurType, blurAmount: 28, pfx: disabledPfx });
  renderer.render(530);
  assertVisible(`blurType=${blurType}`);
}

for (const effect of Object.keys(disabledPfx)) {
  renderer.setParams({
    blurType: "off",
    pfx: { ...disabledPfx, [effect]: { enabled: true, intensity: 35 } },
  });
  renderer.render(640);
  assertVisible(`pfx=${effect}`);
}

renderer.setParams({
  pfx: disabledPfx,
  lights: { enabled: true, points: [{ x: 0.4, y: 0.4, radius: 0.35, intensity: 70, color: "#3ca6ff" }] },
});
renderer.render(750);
assertVisible("lights");

const mask = createCanvas(width, height);
const maskContext = mask.getContext("2d");
const maskGradient = maskContext.createLinearGradient(0, 0, width, 0);
maskGradient.addColorStop(0, "black");
maskGradient.addColorStop(1, "white");
maskContext.fillStyle = maskGradient;
maskContext.fillRect(0, 0, width, height);
renderer.setMask(mask).setParams({
  lights: { enabled: false, points: [] },
  mask: { enabled: true, invert: false },
});
renderer.render(860);
assertVisible("mask");

console.log(`Validated ${RENDER_MODES.length} render modes, 6 blur paths, 9 post-effects, lights, and mask.`);
