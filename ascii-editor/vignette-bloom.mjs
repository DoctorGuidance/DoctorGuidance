export const RENDER_MODES = [
  "characters",
  "dither",
  "mosaic",
  "pixel",
  "dots",
  "cross",
  "diamond",
  "voxel",
  "lego",
  "mixed",
  "lines",
  "diagonal",
  "braille",
  "disco",
  "hexdump",
  "matrix",
  "rings",
  "hearts",
  "stars",
  "hexagons",
  "triangles",
  "bubbles",
  "hatch",
  "contour",
  "halfblocks",
];

export const DEFAULT_PARAMS = {
  renderMode: "mosaic",
  bgMode: "solid",
  bgColor: "#05080d",
  bgBlur: 12,
  bgOpacity: 90,
  cellSize: 8,
  coverage: 100,
  invert: false,
  styleBlend: "source-over",
  charSet: "standard",
  customChars: "",
  brightness: 12,
  contrast: 115,
  edgeEmphasis: 0,
  density: 0,
  toneCurve: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
  tint: "#3ca6ff",
  tintOpacity: 0,
  overlayBlend: "multiply",
  saturation: 100,
  grayscale: 0,
  blurType: "off",
  blurAmount: 35,
  blurAngle: 0,
  directionalBothSides: false,
  tiltFocus: 35,
  tiltPosition: 50,
  tiltFeather: 15,
  lensFocus: 40,
  blurCenterX: 50,
  blurCenterY: 50,
  progressivePosition: 55,
  progressiveReverse: false,
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
  mask: {
    enabled: false,
    tool: "freehand",
    brushSize: 30,
    showOverlay: false,
    invert: false,
    dataUrl: null,
    shapes: [],
  },
};

const CHARACTER_SETS = {
  standard: " .,:;irsXA253hMHGS#9B&@",
  compact: " .:-=+*#%@",
  blocks: " ░▒▓█",
  binary: " 01",
  code: " .<>/{}[]01",
};

const POST_EFFECT_ORDER = [
  "scanLines",
  "vignette",
  "bloom",
  "chromatic",
  "filmGrain",
  "glitch",
  "halftone",
  "pixelate",
  "filmDust",
];

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const COMPOSITE_MODES = new Set([
  "source-over",
  "screen",
  "multiply",
  "overlay",
  "soft-light",
  "hard-light",
  "lighten",
  "darken",
  "color-dodge",
  "color-burn",
  "difference",
  "exclusion",
  "lighter",
]);

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const lerp = (a, b, amount) => a + (b - a) * amount;
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
};

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return patch ?? base;
  const result = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base?.[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function createParams(overrides = {}) {
  return deepMerge(structuredCloneSafe(DEFAULT_PARAMS), overrides);
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function defaultCanvasFactory(width, height) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error("No Canvas2D factory is available. Pass canvasFactory to the renderer.");
}

function imageSize(image) {
  return {
    width: image?.naturalWidth || image?.videoWidth || image?.width || 1,
    height: image?.naturalHeight || image?.videoHeight || image?.height || 1,
  };
}

function drawCover(context, image, width, height, overscan = 0) {
  const source = imageSize(image);
  const scale = Math.max(width / source.width, height / source.height) * (1 + overscan);
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function parseHexColor(value) {
  const raw = String(value || "#ffffff").replace("#", "").trim();
  const hex = raw.length === 3 ? raw.split("").map((part) => part + part).join("") : raw.padEnd(6, "f").slice(0, 6);
  const number = Number.parseInt(hex, 16);
  return {
    r: Number.isFinite(number) ? (number >> 16) & 255 : 255,
    g: Number.isFinite(number) ? (number >> 8) & 255 : 255,
    b: Number.isFinite(number) ? number & 255 : 255,
  };
}

function rgb(color, alpha = 1) {
  return `rgba(${Math.round(clamp(color.r, 0, 255))},${Math.round(clamp(color.g, 0, 255))},${Math.round(clamp(color.b, 0, 255))},${clamp(alpha)})`;
}

function shade(color, multiplier) {
  return {
    r: clamp(color.r * multiplier, 0, 255),
    g: clamp(color.g * multiplier, 0, 255),
    b: clamp(color.b * multiplier, 0, 255),
  };
}

function luminance(color) {
  return (color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722) / 255;
}

function hash2(x, y, seed = 0) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function toneCurve(value, points) {
  const curve = Array.isArray(points) && points.length > 1
    ? [...points].sort((a, b) => a.x - b.x)
    : DEFAULT_PARAMS.toneCurve;
  const input = clamp(value);
  if (input <= curve[0].x) return clamp(curve[0].y);
  for (let index = 1; index < curve.length; index += 1) {
    const previous = curve[index - 1];
    const current = curve[index];
    if (input <= current.x) {
      return clamp(lerp(previous.y, current.y, (input - previous.x) / Math.max(0.0001, current.x - previous.x)));
    }
  }
  return clamp(curve[curve.length - 1].y);
}

function animationValue(style, column, row, columns, rows, time, speed) {
  switch (style) {
    case "pulse":
      return Math.sin(time * speed * 2.5);
    case "shimmer":
      return Math.sin((column + row) * 0.38 - time * speed * 4.2);
    case "ripple": {
      const dx = column - columns / 2;
      const dy = row - rows / 2;
      return Math.sin(Math.hypot(dx, dy) * 0.7 - time * speed * 4.5);
    }
    case "flicker":
      return hash2(column, row, Math.floor(time * speed * 12)) * 2 - 1;
    case "wave":
    default:
      return Math.sin(column * 0.48 + row * 0.11 - time * speed * 3.1);
  }
}

function averageRegion(data, width, height, startX, startY, regionWidth, regionHeight) {
  const x0 = Math.max(0, Math.floor(startX));
  const y0 = Math.max(0, Math.floor(startY));
  const x1 = Math.min(width, Math.ceil(startX + regionWidth));
  const y1 = Math.min(height, Math.ceil(startY + regionHeight));
  const step = Math.max(1, Math.floor(Math.min(regionWidth, regionHeight) / 7));
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3] / 255;
      r += data[offset] * alpha;
      g += data[offset + 1] * alpha;
      b += data[offset + 2] * alpha;
      count += alpha;
    }
  }
  if (count <= 0.0001) return { r: 0, g: 0, b: 0 };
  return { r: r / count, g: g / count, b: b / count };
}

function drawPolygon(context, points) {
  context.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
}

function drawHeart(context, centerX, centerY, size) {
  const top = centerY - size * 0.26;
  context.beginPath();
  context.moveTo(centerX, centerY + size * 0.42);
  context.bezierCurveTo(centerX - size * 0.58, centerY + size * 0.05, centerX - size * 0.5, top - size * 0.25, centerX, top + size * 0.12);
  context.bezierCurveTo(centerX + size * 0.5, top - size * 0.25, centerX + size * 0.58, centerY + size * 0.05, centerX, centerY + size * 0.42);
  context.closePath();
}

function drawStar(context, centerX, centerY, outerRadius, innerRadius, points = 5, rotation = -Math.PI / 2) {
  context.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (index * Math.PI) / points;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

export class VignetteBloomRenderer {
  constructor(canvas, options = {}) {
    if (!canvas?.getContext) throw new TypeError("VignetteBloomRenderer needs a Canvas2D-compatible canvas.");
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
    this.canvasFactory = options.canvasFactory || defaultCanvasFactory;
    this.params = createParams(options.params);
    this.source = options.source || null;
    this.maskImage = options.maskImage || null;
    this.layers = new Map();
    this.sampleCache = null;
  }

  setSource(source) {
    this.source = source;
    this.sampleCache = null;
    return this;
  }

  setMask(maskImage) {
    this.maskImage = maskImage;
    return this;
  }

  setParams(patch) {
    const previousCellSize = this.params.cellSize;
    this.params = deepMerge(this.params, patch || {});
    if (previousCellSize !== this.params.cellSize) this.sampleCache = null;
    return this;
  }

  resize(width, height) {
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    this.sampleCache = null;
    return this;
  }

  layer(name, width = this.canvas.width, height = this.canvas.height) {
    let canvas = this.layers.get(name);
    if (!canvas) {
      canvas = this.canvasFactory(width, height);
      this.layers.set(name, canvas);
    }
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    return canvas;
  }

  preparePhoto() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const photo = this.layer("photo");
    const context = photo.getContext("2d", { willReadFrequently: true });
    context.save();
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    drawCover(context, this.source, width, height);
    context.restore();
    return photo;
  }

  samplePhoto(photo) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cellSize = Math.max(3, Math.round(this.params.cellSize || 8));
    const columns = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const cacheKey = `${width}:${height}:${cellSize}:${columns}:${rows}`;
    if (this.sampleCache?.key === cacheKey && this.sampleCache.source === this.source) return this.sampleCache;

    const context = photo.getContext("2d", { willReadFrequently: true });
    const image = context.getImageData(0, 0, width, height);
    const cells = new Array(columns * rows);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = column * cellSize;
        const y = row * cellSize;
        const currentWidth = Math.min(cellSize, width - x);
        const currentHeight = Math.min(cellSize, height - y);
        const color = averageRegion(image.data, width, height, x, y, currentWidth, currentHeight);
        const top = averageRegion(image.data, width, height, x, y, currentWidth, currentHeight / 2);
        const bottom = averageRegion(image.data, width, height, x, y + currentHeight / 2, currentWidth, currentHeight / 2);
        cells[row * columns + column] = {
          x,
          y,
          width: currentWidth,
          height: currentHeight,
          color,
          top,
          bottom,
          luminance: luminance(color),
          edge: 0,
        };
      }
    }

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        const current = cells[index].luminance;
        const right = cells[row * columns + Math.min(columns - 1, column + 1)].luminance;
        const below = cells[Math.min(rows - 1, row + 1) * columns + column].luminance;
        cells[index].edge = clamp(Math.hypot(right - current, below - current) * 1.8);
      }
    }

    this.sampleCache = { key: cacheKey, source: this.source, image, cells, columns, rows, cellSize };
    return this.sampleCache;
  }

  drawBackground(context, photo) {
    const { width, height } = this.canvas;
    const params = this.params;
    const opacity = clamp(params.bgOpacity / 100);
    context.save();
    context.clearRect(0, 0, width, height);
    context.globalAlpha = opacity;
    switch (String(params.bgMode || "none").toLowerCase()) {
      case "blur":
      case "blurred":
        context.filter = `blur(${Math.max(0, params.bgBlur || 0)}px)`;
        drawCover(context, photo, width, height, Math.max(0, params.bgBlur || 0) / Math.max(width, height));
        break;
      case "photo":
      case "original":
        context.drawImage(photo, 0, 0, width, height);
        break;
      case "solid":
        context.fillStyle = params.bgColor || "#05080d";
        context.fillRect(0, 0, width, height);
        break;
      case "none":
      case "transparent":
      default:
        break;
    }
    context.restore();
  }

  drawCells(context, sample, timeSeconds) {
    const params = this.params;
    const mode = RENDER_MODES.includes(params.renderMode) ? params.renderMode : "characters";
    const coverage = clamp(params.coverage / 100);
    const density = clamp((Number(params.density || 0) + 100) / 200, 0, 1);
    const densityScale = lerp(0.72, 1.28, density);
    const edgeStrength = clamp(Number(params.edgeEmphasis || 0) / 100, -1, 1);
    const animationEnabled = Boolean(params.animated);
    const speed = params.animSpeed?.enabled === false ? 0 : clamp(Number(params.animSpeed?.intensity ?? 100) / 100, 0, 3);
    const animationStrength = params.animIntensity?.enabled === false
      ? 0
      : clamp(Number(params.animIntensity?.intensity ?? 60) / 100) * 0.22;
    const chars = params.customChars || CHARACTER_SETS[params.charSet] || CHARACTER_SETS.standard;
    const composite = COMPOSITE_MODES.has(params.styleBlend) ? params.styleBlend : "source-over";

    context.save();
    context.globalCompositeOperation = composite;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineCap = "round";
    context.lineJoin = "round";

    for (let row = 0; row < sample.rows; row += 1) {
      for (let column = 0; column < sample.columns; column += 1) {
        const cell = sample.cells[row * sample.columns + column];
        const seed = hash2(column, row, 9);
        if (seed > coverage) continue;

        const movement = animationEnabled
          ? animationValue(params.animStyle, column, row, sample.columns, sample.rows, timeSeconds, speed)
          : 0;
        let value = toneCurve(cell.luminance, params.toneCurve);
        value = clamp(value + cell.edge * edgeStrength + movement * animationStrength);
        if (params.invert) value = 1 - value;

        const colorPulse = 0.9 + value * 0.18 + movement * animationStrength * 0.5;
        const color = shade(cell.color, colorPulse);
        const centerX = cell.x + cell.width / 2;
        const centerY = cell.y + cell.height / 2;
        const cellMin = Math.min(cell.width, cell.height);
        const size = cellMin * clamp((0.2 + value * 0.84) * densityScale, 0.08, 1.3);
        context.fillStyle = rgb(color);
        context.strokeStyle = rgb(color);
        context.lineWidth = Math.max(1, cellMin * (0.055 + value * 0.08));

        this.drawPrimitive(context, {
          mode,
          cell,
          column,
          row,
          columns: sample.columns,
          rows: sample.rows,
          centerX,
          centerY,
          cellMin,
          size,
          value,
          color,
          movement,
          timeSeconds,
          chars,
          seed,
          densityScale,
        });
      }
    }
    context.restore();
  }

  drawPrimitive(context, state) {
    const {
      mode,
      cell,
      column,
      row,
      centerX,
      centerY,
      cellMin,
      size,
      value,
      color,
      movement,
      timeSeconds,
      chars,
      seed,
      densityScale,
    } = state;
    const inset = Math.max(0, (cellMin - size) / 2);

    switch (mode) {
      case "dither": {
        const threshold = (BAYER_4[row % 4][column % 4] + 0.5) / 16;
        if (value >= threshold) {
          const ditherSize = cellMin * clamp(0.5 + value * 0.55, 0.35, 1);
          context.fillRect(centerX - ditherSize / 2, centerY - ditherSize / 2, ditherSize, ditherSize);
        }
        break;
      }
      case "mosaic": {
        const gap = Math.max(0.25, cellMin * 0.025);
        context.fillStyle = rgb(color, 0.92 + value * 0.08);
        context.fillRect(cell.x + gap, cell.y + gap, Math.max(0, cell.width - gap * 2), Math.max(0, cell.height - gap * 2));
        if (value > 0.72) {
          context.fillStyle = rgb(shade(color, 1.18), (value - 0.72) * 0.35);
          context.fillRect(cell.x + gap, cell.y + gap, cell.width - gap * 2, Math.max(1, cell.height * 0.12));
        }
        break;
      }
      case "pixel":
        context.fillRect(cell.x + inset, cell.y + inset, Math.max(1, size), Math.max(1, size));
        break;
      case "dots":
        context.beginPath();
        context.arc(centerX, centerY, Math.max(0.5, size * 0.48), 0, Math.PI * 2);
        context.fill();
        break;
      case "cross":
        context.beginPath();
        context.moveTo(centerX - size / 2, centerY);
        context.lineTo(centerX + size / 2, centerY);
        context.moveTo(centerX, centerY - size / 2);
        context.lineTo(centerX, centerY + size / 2);
        context.stroke();
        break;
      case "diamond":
        drawPolygon(context, [
          [centerX, centerY - size / 2],
          [centerX + size / 2, centerY],
          [centerX, centerY + size / 2],
          [centerX - size / 2, centerY],
        ]);
        context.fill();
        break;
      case "voxel": {
        const half = size * 0.46;
        const top = size * 0.24;
        context.fillStyle = rgb(shade(color, 1.18));
        drawPolygon(context, [[centerX, centerY - half], [centerX + half, centerY - top], [centerX, centerY], [centerX - half, centerY - top]]);
        context.fill();
        context.fillStyle = rgb(shade(color, 0.9));
        drawPolygon(context, [[centerX - half, centerY - top], [centerX, centerY], [centerX, centerY + half], [centerX - half, centerY + top]]);
        context.fill();
        context.fillStyle = rgb(shade(color, 0.68));
        drawPolygon(context, [[centerX + half, centerY - top], [centerX, centerY], [centerX, centerY + half], [centerX + half, centerY + top]]);
        context.fill();
        break;
      }
      case "lego": {
        const blockSize = Math.max(cellMin * 0.45, size * 0.88);
        roundedRect(context, centerX - blockSize / 2, centerY - blockSize / 2, blockSize, blockSize, blockSize * 0.12);
        context.fillStyle = rgb(shade(color, 0.9));
        context.fill();
        context.beginPath();
        context.arc(centerX, centerY - blockSize * 0.12, blockSize * 0.24, 0, Math.PI * 2);
        context.fillStyle = rgb(shade(color, 1.16));
        context.fill();
        break;
      }
      case "mixed": {
        const choice = Math.floor(seed * 4);
        if (choice === 0) {
          context.beginPath();
          context.arc(centerX, centerY, size * 0.43, 0, Math.PI * 2);
          context.fill();
        } else if (choice === 1) {
          drawPolygon(context, [[centerX, centerY - size / 2], [centerX + size / 2, centerY], [centerX, centerY + size / 2], [centerX - size / 2, centerY]]);
          context.fill();
        } else if (choice === 2) {
          context.fillRect(centerX - size / 2, centerY - size / 2, size, size);
        } else {
          drawStar(context, centerX, centerY, size / 2, size / 4, 4, Math.PI / 4);
          context.fill();
        }
        break;
      }
      case "lines":
        context.beginPath();
        context.moveTo(centerX - size / 2, centerY);
        context.lineTo(centerX + size / 2, centerY);
        context.stroke();
        break;
      case "diagonal": {
        const direction = (column + row) % 2 === 0 ? 1 : -1;
        context.beginPath();
        context.moveTo(centerX - size / 2, centerY - (size / 2) * direction);
        context.lineTo(centerX + size / 2, centerY + (size / 2) * direction);
        context.stroke();
        break;
      }
      case "braille": {
        const pattern = Math.floor(clamp(value + seed * 0.18) * 255);
        context.font = `${Math.max(7, cellMin * 1.02)}px ui-monospace, "Cascadia Mono", monospace`;
        context.fillText(String.fromCodePoint(0x2800 + pattern), centerX, centerY + cellMin * 0.03);
        break;
      }
      case "disco": {
        const hue = (column * 17 + row * 11 + timeSeconds * 90) % 360;
        context.save();
        context.shadowColor = `hsla(${hue},100%,65%,0.9)`;
        context.shadowBlur = cellMin * (0.3 + value * 0.8);
        context.fillStyle = `hsla(${hue},90%,${45 + value * 35}%,0.95)`;
        context.beginPath();
        context.arc(centerX, centerY, Math.max(0.7, size * 0.42), 0, Math.PI * 2);
        context.fill();
        context.restore();
        break;
      }
      case "hexdump":
        context.font = `700 ${Math.max(7, cellMin * clamp(0.58 + densityScale * 0.18, 0.55, 0.95))}px ui-monospace, "Cascadia Mono", monospace`;
        context.fillText(Math.round(value * 15).toString(16).toUpperCase(), centerX, centerY);
        break;
      case "matrix": {
        const fall = (row / Math.max(1, state.rows) + timeSeconds * 0.34 * Math.max(0.2, this.params.animSpeed?.intensity / 100 || 1) + column * 0.031) % 1;
        const headDistance = Math.abs(fall - 0.5) * 2;
        const alpha = clamp(value * 0.68 + (1 - headDistance) * 0.72);
        const green = headDistance < 0.09 ? "rgba(220,255,225,1)" : `rgba(40,255,112,${alpha})`;
        context.fillStyle = green;
        context.font = `${Math.max(7, cellMin * 0.86)}px ui-monospace, "Cascadia Mono", monospace`;
        const matrixChars = "01アイウエオカキクケコサシスセソ{}<>";
        context.fillText(matrixChars[Math.floor(hash2(column, row, Math.floor(timeSeconds * 8)) * matrixChars.length)], centerX, centerY);
        break;
      }
      case "rings":
        context.beginPath();
        context.arc(centerX, centerY, Math.max(1, size * 0.43), 0, Math.PI * 2);
        context.stroke();
        break;
      case "hearts":
        drawHeart(context, centerX, centerY, size);
        context.fill();
        break;
      case "stars":
        drawStar(context, centerX, centerY, size / 2, size / 4.2, 5, -Math.PI / 2 + movement * 0.1);
        context.fill();
        break;
      case "hexagons": {
        const shiftedCenterX = centerX + (row % 2 ? cell.width * 0.25 : 0);
        const radius = size * 0.5;
        const points = Array.from({ length: 6 }, (_, index) => {
          const angle = Math.PI / 3 * index + Math.PI / 6;
          return [shiftedCenterX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
        });
        drawPolygon(context, points);
        context.fill();
        context.globalAlpha = 0.18;
        context.strokeStyle = rgb(shade(color, 1.35));
        context.stroke();
        context.globalAlpha = 1;
        break;
      }
      case "triangles": {
        const alternate = (column + row) % 2 === 0;
        context.fillStyle = rgb(shade(color, alternate ? 1.12 : 0.82));
        drawPolygon(context, [[cell.x, cell.y], [cell.x + cell.width, alternate ? cell.y : cell.y + cell.height], [cell.x, cell.y + cell.height]]);
        context.fill();
        context.fillStyle = rgb(shade(color, alternate ? 0.76 : 1.18));
        drawPolygon(context, [[cell.x + cell.width, cell.y], [cell.x + cell.width, cell.y + cell.height], [cell.x, alternate ? cell.y : cell.y + cell.height]]);
        context.fill();
        break;
      }
      case "bubbles":
        context.save();
        context.globalAlpha = 0.32 + value * 0.62;
        context.beginPath();
        context.arc(centerX, centerY, Math.max(1, size * 0.48), 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = rgb(shade(color, 1.5), 0.75);
        context.lineWidth = Math.max(0.7, cellMin * 0.055);
        context.stroke();
        context.beginPath();
        context.arc(centerX - size * 0.17, centerY - size * 0.16, Math.max(0.4, size * 0.09), 0, Math.PI * 2);
        context.fillStyle = "rgba(255,255,255,0.58)";
        context.fill();
        context.restore();
        break;
      case "hatch": {
        const strokes = Math.max(1, Math.round((1 - value) * 3.5 + densityScale));
        context.save();
        context.lineWidth = Math.max(0.6, cellMin * 0.045);
        for (let index = -strokes; index <= strokes; index += 1) {
          const offset = (index / Math.max(1, strokes)) * cellMin * 0.36;
          context.beginPath();
          context.moveTo(cell.x, cell.y + cell.height / 2 + offset);
          context.lineTo(cell.x + cell.width / 2 + offset, cell.y);
          context.stroke();
          if (value < 0.55) {
            context.beginPath();
            context.moveTo(cell.x + cell.width, cell.y + cell.height / 2 + offset);
            context.lineTo(cell.x + cell.width / 2 - offset, cell.y);
            context.stroke();
          }
        }
        context.restore();
        break;
      }
      case "contour": {
        const bands = 7;
        const phase = value * bands;
        const distance = Math.abs(phase - Math.round(phase));
        if (distance < 0.19 + densityScale * 0.035) {
          context.beginPath();
          const radius = cellMin * (0.28 + value * 0.26);
          context.arc(centerX + movement * cellMin * 0.08, centerY, radius, Math.PI * 0.18, Math.PI * 1.82);
          context.stroke();
        }
        break;
      }
      case "halfblocks": {
        const topValue = this.params.invert ? 1 - luminance(cell.top) : luminance(cell.top);
        const bottomValue = this.params.invert ? 1 - luminance(cell.bottom) : luminance(cell.bottom);
        context.fillStyle = rgb(shade(cell.top, 0.84 + topValue * 0.34));
        context.fillRect(cell.x, cell.y, cell.width, Math.ceil(cell.height / 2));
        context.fillStyle = rgb(shade(cell.bottom, 0.84 + bottomValue * 0.34));
        context.fillRect(cell.x, cell.y + Math.floor(cell.height / 2), cell.width, Math.ceil(cell.height / 2));
        break;
      }
      case "characters":
      default: {
        const glyph = chars[Math.min(chars.length - 1, Math.floor(value * Math.max(1, chars.length - 1)))] || " ";
        context.font = `${Math.max(6, size * 0.96)}px ui-monospace, "Cascadia Mono", "SFMono-Regular", monospace`;
        context.fillText(glyph, centerX, centerY);
        break;
      }
    }
  }

  applyColorAdjustments(source, target) {
    const { width, height } = this.canvas;
    const params = this.params;
    const sourceContext = source.getContext("2d", { willReadFrequently: true });
    const targetContext = target.getContext("2d", { willReadFrequently: true });
    targetContext.clearRect(0, 0, width, height);
    targetContext.drawImage(source, 0, 0);

    const image = targetContext.getImageData(0, 0, width, height);
    const brightness = Math.max(0, 1 + Number(params.brightness || 0) / 100);
    const contrast = Math.max(0, Number(params.contrast ?? 100) / 100);
    const saturation = Math.max(0, Number(params.saturation ?? 100) / 100);
    const grayscale = clamp(Number(params.grayscale || 0) / 100);
    for (let offset = 0; offset < image.data.length; offset += 4) {
      let r = image.data[offset] * brightness;
      let g = image.data[offset + 1] * brightness;
      let b = image.data[offset + 2] * brightness;
      r = (r - 128) * contrast + 128;
      g = (g - 128) * contrast + 128;
      b = (b - 128) * contrast + 128;
      const light = r * 0.2126 + g * 0.7152 + b * 0.0722;
      r = light + (r - light) * saturation;
      g = light + (g - light) * saturation;
      b = light + (b - light) * saturation;
      r = lerp(r, light, grayscale);
      g = lerp(g, light, grayscale);
      b = lerp(b, light, grayscale);
      image.data[offset] = clamp(r, 0, 255);
      image.data[offset + 1] = clamp(g, 0, 255);
      image.data[offset + 2] = clamp(b, 0, 255);
    }
    targetContext.putImageData(image, 0, 0);

    const tintOpacity = clamp(Number(params.tintOpacity || 0) / 100);
    if (tintOpacity > 0) {
      targetContext.save();
      targetContext.globalAlpha = tintOpacity;
      targetContext.globalCompositeOperation = COMPOSITE_MODES.has(params.overlayBlend) ? params.overlayBlend : "multiply";
      targetContext.fillStyle = params.tint || "#3ca6ff";
      targetContext.fillRect(0, 0, width, height);
      targetContext.restore();
    }
  }

  filteredCopy(source, target, filter = "none") {
    const { width, height } = this.canvas;
    const context = target.getContext("2d");
    context.save();
    context.clearRect(0, 0, width, height);
    context.filter = filter;
    context.drawImage(source, 0, 0, width, height);
    context.restore();
  }

  applyBlur(source, target) {
    const { width, height } = this.canvas;
    const params = this.params;
    const type = String(params.blurType || "off").toLowerCase();
    const radius = Math.max(0, Number(params.blurAmount || 0) / 7);
    const targetContext = target.getContext("2d");

    if (type === "off" || type === "none" || radius <= 0) {
      this.filteredCopy(source, target);
      return;
    }
    if (type === "gaussian" || type === "blur") {
      this.filteredCopy(source, target, `blur(${radius}px)`);
      return;
    }
    if (type === "directional" || type === "motion") {
      targetContext.save();
      targetContext.clearRect(0, 0, width, height);
      const angle = (Number(params.blurAngle || 0) * Math.PI) / 180;
      const distance = Math.max(1, radius * 2.2);
      const passes = Math.max(5, Math.round(radius * 2));
      targetContext.globalAlpha = 1 / passes;
      for (let index = 0; index < passes; index += 1) {
        const progress = index / Math.max(1, passes - 1);
        const signed = params.directionalBothSides ? progress * 2 - 1 : progress;
        targetContext.drawImage(source, Math.cos(angle) * distance * signed, Math.sin(angle) * distance * signed);
      }
      targetContext.restore();
      return;
    }

    const blurred = this.layer("blurred");
    this.filteredCopy(source, blurred, `blur(${radius}px)`);
    targetContext.clearRect(0, 0, width, height);
    targetContext.drawImage(blurred, 0, 0);
    const reveal = this.layer("blurReveal");
    const revealContext = reveal.getContext("2d");
    revealContext.clearRect(0, 0, width, height);
    revealContext.drawImage(source, 0, 0);
    revealContext.globalCompositeOperation = "destination-in";

    let gradient;
    if (type === "tilt" || type === "tilt-shift") {
      const position = clamp(Number(params.tiltPosition ?? 50) / 100) * height;
      const focus = clamp(Number(params.tiltFocus ?? 35) / 100) * height * 0.5;
      const feather = Math.max(1, clamp(Number(params.tiltFeather ?? 15) / 100) * height);
      gradient = revealContext.createLinearGradient(0, position - focus - feather, 0, position + focus + feather);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(clamp(feather / Math.max(1, focus * 2 + feather * 2)), "rgba(255,255,255,1)");
      gradient.addColorStop(1 - clamp(feather / Math.max(1, focus * 2 + feather * 2)), "rgba(255,255,255,1)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
    } else if (type === "lens" || type === "radial") {
      const centerX = clamp(Number(params.blurCenterX ?? 50) / 100) * width;
      const centerY = clamp(Number(params.blurCenterY ?? 50) / 100) * height;
      const focus = clamp(Number(params.lensFocus ?? 40) / 100) * Math.min(width, height) * 0.72;
      gradient = revealContext.createRadialGradient(centerX, centerY, focus * 0.42, centerX, centerY, Math.max(focus, focus + radius * 5));
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
    } else {
      const position = clamp(Number(params.progressivePosition ?? 55) / 100) * height;
      gradient = revealContext.createLinearGradient(0, 0, 0, height);
      if (params.progressiveReverse) {
        gradient.addColorStop(clamp(position / height - 0.18), "rgba(255,255,255,0)");
        gradient.addColorStop(clamp(position / height + 0.18), "rgba(255,255,255,1)");
      } else {
        gradient.addColorStop(clamp(position / height - 0.18), "rgba(255,255,255,1)");
        gradient.addColorStop(clamp(position / height + 0.18), "rgba(255,255,255,0)");
      }
    }
    revealContext.fillStyle = gradient;
    revealContext.fillRect(0, 0, width, height);
    revealContext.globalCompositeOperation = "source-over";
    targetContext.drawImage(reveal, 0, 0);
  }

  applyPostEffect(name, canvas, intensity, timeSeconds) {
    const amount = clamp(Number(intensity || 0) / 100);
    if (amount <= 0) return;
    const { width, height } = this.canvas;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (name === "scanLines") {
      context.save();
      context.globalCompositeOperation = "multiply";
      context.fillStyle = `rgba(1,5,9,${0.08 + amount * 0.32})`;
      const gap = Math.max(2, Math.round(6 - amount * 3));
      for (let y = 0; y < height; y += gap) context.fillRect(0, y, width, 1);
      context.restore();
      return;
    }

    if (name === "vignette") {
      context.save();
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.hypot(width, height) * 0.55;
      const gradient = context.createRadialGradient(centerX, centerY, Math.min(width, height) * 0.2, centerX, centerY, radius);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.62, `rgba(0,0,0,${amount * 0.08})`);
      gradient.addColorStop(1, `rgba(0,0,0,${0.22 + amount * 0.72})`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.restore();
      return;
    }

    if (name === "bloom") {
      const pixels = context.getImageData(0, 0, width, height);
      const bright = this.layer("bloomBright");
      const brightContext = bright.getContext("2d", { willReadFrequently: true });
      const bloomImage = brightContext.createImageData(width, height);
      const threshold = lerp(220, 105, amount);
      for (let offset = 0; offset < pixels.data.length; offset += 4) {
        const light = pixels.data[offset] * 0.2126 + pixels.data[offset + 1] * 0.7152 + pixels.data[offset + 2] * 0.0722;
        const pass = smoothstep(threshold, 255, light);
        bloomImage.data[offset] = pixels.data[offset];
        bloomImage.data[offset + 1] = pixels.data[offset + 1];
        bloomImage.data[offset + 2] = pixels.data[offset + 2];
        bloomImage.data[offset + 3] = Math.round(pass * 255);
      }
      brightContext.putImageData(bloomImage, 0, 0);
      const glow = this.layer("bloomGlow");
      this.filteredCopy(bright, glow, `blur(${2 + amount * 16}px)`);
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.24 + amount * 0.72;
      context.drawImage(glow, 0, 0);
      context.restore();
      return;
    }

    if (name === "chromatic") {
      const source = context.getImageData(0, 0, width, height);
      const output = context.createImageData(width, height);
      const shift = Math.max(1, Math.round(amount * 13));
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const destination = (y * width + x) * 4;
          const redSource = (y * width + clamp(x - shift, 0, width - 1)) * 4;
          const blueSource = (y * width + clamp(x + shift, 0, width - 1)) * 4;
          output.data[destination] = source.data[redSource];
          output.data[destination + 1] = source.data[destination + 1];
          output.data[destination + 2] = source.data[blueSource + 2];
          output.data[destination + 3] = source.data[destination + 3];
        }
      }
      context.putImageData(output, 0, 0);
      return;
    }

    if (name === "filmGrain") {
      context.save();
      context.globalCompositeOperation = "overlay";
      const grainSize = amount > 0.55 ? 1 : 2;
      const count = Math.round(width * height * (0.003 + amount * 0.018));
      for (let index = 0; index < count; index += 1) {
        const noise = hash2(index, Math.floor(timeSeconds * 24), 17);
        const x = Math.floor(hash2(index, 3, timeSeconds) * width);
        const y = Math.floor(hash2(index, 7, timeSeconds) * height);
        context.fillStyle = noise > 0.5 ? `rgba(255,255,255,${amount * 0.18})` : `rgba(0,0,0,${amount * 0.22})`;
        context.fillRect(x, y, grainSize, grainSize);
      }
      context.restore();
      return;
    }

    if (name === "glitch") {
      const snapshot = this.layer("glitchSnapshot");
      const snapshotContext = snapshot.getContext("2d");
      snapshotContext.clearRect(0, 0, width, height);
      snapshotContext.drawImage(canvas, 0, 0);
      context.save();
      const slices = Math.max(2, Math.round(2 + amount * 12));
      for (let index = 0; index < slices; index += 1) {
        const y = Math.floor(hash2(index, Math.floor(timeSeconds * 12), 21) * height);
        const sliceHeight = Math.max(2, Math.floor(hash2(index, 4, timeSeconds) * height * 0.045));
        const offset = (hash2(index, 8, timeSeconds) * 2 - 1) * width * amount * 0.08;
        context.drawImage(snapshot, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
      }
      context.globalCompositeOperation = "screen";
      context.fillStyle = `rgba(255,24,84,${amount * 0.09})`;
      context.fillRect(0, Math.floor(hash2(4, 9, timeSeconds) * height), width, Math.max(1, amount * 6));
      context.restore();
      return;
    }

    if (name === "halftone") {
      context.save();
      context.globalCompositeOperation = "multiply";
      const gap = Math.max(4, Math.round(11 - amount * 6));
      context.fillStyle = `rgba(0,8,14,${0.12 + amount * 0.35})`;
      for (let y = 0; y < height; y += gap) {
        for (let x = (Math.floor(y / gap) % 2) * gap * 0.5; x < width; x += gap) {
          context.beginPath();
          context.arc(x, y, gap * (0.08 + amount * 0.16), 0, Math.PI * 2);
          context.fill();
        }
      }
      context.restore();
      return;
    }

    if (name === "pixelate") {
      const scale = Math.max(2, Math.round(2 + amount * 18));
      const smallWidth = Math.max(1, Math.ceil(width / scale));
      const smallHeight = Math.max(1, Math.ceil(height / scale));
      const small = this.layer("pixelateSmall", smallWidth, smallHeight);
      const smallContext = small.getContext("2d");
      smallContext.clearRect(0, 0, smallWidth, smallHeight);
      smallContext.imageSmoothingEnabled = false;
      smallContext.drawImage(canvas, 0, 0, smallWidth, smallHeight);
      context.save();
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);
      context.drawImage(small, 0, 0, smallWidth, smallHeight, 0, 0, width, height);
      context.restore();
      return;
    }

    if (name === "filmDust") {
      context.save();
      context.globalCompositeOperation = "screen";
      const count = Math.max(4, Math.round(8 + amount * 54));
      for (let index = 0; index < count; index += 1) {
        const x = hash2(index, 2, Math.floor(timeSeconds * 3)) * width;
        const y = hash2(index, 5, Math.floor(timeSeconds * 3)) * height;
        const radius = 0.5 + hash2(index, 8, timeSeconds) * amount * 2.6;
        context.fillStyle = `rgba(255,244,220,${0.08 + amount * 0.38})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.strokeStyle = `rgba(255,248,230,${amount * 0.2})`;
      context.lineWidth = Math.max(0.5, amount * 1.4);
      for (let index = 0; index < Math.round(amount * 5); index += 1) {
        const x = hash2(index, 13, Math.floor(timeSeconds)) * width;
        const y = hash2(index, 15, Math.floor(timeSeconds)) * height;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + (hash2(index, 17) - 0.5) * 6, y + height * (0.08 + hash2(index, 19) * 0.2));
        context.stroke();
      }
      context.restore();
    }
  }

  applyLights(canvas) {
    const { width, height } = this.canvas;
    const points = this.params.lights?.points || [];
    if (!this.params.lights?.enabled || !points.length) return;
    const context = canvas.getContext("2d");
    context.save();
    context.globalCompositeOperation = "screen";
    for (const point of points) {
      const x = clamp(Number(point.x ?? 0.5)) * width;
      const y = clamp(Number(point.y ?? 0.5)) * height;
      const radius = clamp(Number(point.radius ?? 0.2), 0.005, 2) * Math.min(width, height);
      const intensity = clamp(Number(point.intensity ?? 50) / 100);
      const color = point.color || "#8ed8ff";
      const parsed = parseHexColor(color);
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, rgb(parsed, intensity * 0.82));
      gradient.addColorStop(0.35, rgb(parsed, intensity * 0.28));
      gradient.addColorStop(1, rgb(parsed, 0));
      context.fillStyle = gradient;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    context.restore();
  }

  applyMask(canvas, photo) {
    if (!this.params.mask?.enabled || !this.maskImage) return;
    const { width, height } = this.canvas;
    const mask = this.layer("revealMask");
    const maskContext = mask.getContext("2d", { willReadFrequently: true });
    maskContext.clearRect(0, 0, width, height);
    maskContext.drawImage(this.maskImage, 0, 0, width, height);
    const maskPixels = maskContext.getImageData(0, 0, width, height);
    const inverted = Boolean(this.params.mask.invert);
    for (let offset = 0; offset < maskPixels.data.length; offset += 4) {
      const alpha = maskPixels.data[offset + 3] / 255;
      const light = (maskPixels.data[offset] * 0.2126 + maskPixels.data[offset + 1] * 0.7152 + maskPixels.data[offset + 2] * 0.0722) / 255;
      const reveal = light * alpha;
      maskPixels.data[offset] = 255;
      maskPixels.data[offset + 1] = 255;
      maskPixels.data[offset + 2] = 255;
      maskPixels.data[offset + 3] = Math.round((inverted ? 1 - reveal : reveal) * 255);
    }
    maskContext.putImageData(maskPixels, 0, 0);

    const revealedPhoto = this.layer("revealedPhoto");
    const revealContext = revealedPhoto.getContext("2d");
    revealContext.clearRect(0, 0, width, height);
    revealContext.drawImage(photo, 0, 0);
    revealContext.globalCompositeOperation = "destination-in";
    revealContext.drawImage(mask, 0, 0);
    revealContext.globalCompositeOperation = "source-over";

    const context = canvas.getContext("2d");
    context.drawImage(revealedPhoto, 0, 0);
    if (this.params.mask.showOverlay) {
      context.save();
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.22;
      context.fillStyle = "#3ca6ff";
      context.drawImage(mask, 0, 0);
      context.globalCompositeOperation = "source-in";
      context.fillRect(0, 0, width, height);
      context.restore();
    }
  }

  render(timeMs = 0) {
    if (!this.source) return false;
    const { width, height } = this.canvas;
    if (!width || !height) return false;
    const timeSeconds = this.params.animated ? Number(timeMs || 0) / 1000 : 0;
    const photo = this.preparePhoto();
    const sample = this.samplePhoto(photo);
    const effect = this.layer("effect");
    const effectContext = effect.getContext("2d", { willReadFrequently: true });
    this.drawBackground(effectContext, photo);
    this.drawCells(effectContext, sample, timeSeconds);

    const adjusted = this.layer("adjusted");
    this.applyColorAdjustments(effect, adjusted);
    const frame = this.layer("frame");
    this.applyBlur(adjusted, frame);

    for (const name of POST_EFFECT_ORDER) {
      const config = this.params.pfx?.[name];
      if (config?.enabled) this.applyPostEffect(name, frame, config.intensity, timeSeconds);
    }
    this.applyLights(frame);
    this.applyMask(frame, photo);

    this.context.save();
    this.context.globalCompositeOperation = "source-over";
    this.context.globalAlpha = 1;
    this.context.clearRect(0, 0, width, height);
    this.context.drawImage(frame, 0, 0, width, height);
    this.context.restore();
    return true;
  }
}

export async function loadBrowserImage(source) {
  if (typeof Image === "undefined") throw new Error("loadBrowserImage is only available in a browser.");
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${source}`));
    image.src = source;
  });
}
