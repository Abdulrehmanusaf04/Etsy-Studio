// ============================================
// Local Variation Engine — sharp-based
// Generates visually distinct mockup variations from AI base images
// without additional OpenAI API calls.
//
// Design principle: All transformations primarily affect the SURROUNDING
// SCENE (edges, background, lighting) — never the center where the
// template card sits (occupies ~30-40% of the image).
// ============================================

import sharp from "sharp";

// ────────────────────────────────────────────
// Variation Effect Types
// ────────────────────────────────────────────

interface VariationConfig {
  name: string;
  apply: (input: Buffer, size: number) => Promise<Buffer>;
}

// ────────────────────────────────────────────
// Individual Effects
// ────────────────────────────────────────────

/** Warm color temperature shift — golden-hour feel */
async function warmTint(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .modulate({ brightness: 1.03, saturation: 1.08 })
    .tint({ r: 255, g: 220, b: 180 })
    .png()
    .toBuffer();
}

/** Cool color temperature shift — morning/editorial feel */
async function coolTint(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .modulate({ brightness: 1.02, saturation: 0.95 })
    .tint({ r: 180, g: 200, b: 255 })
    .png()
    .toBuffer();
}

/** Vignette effect — darken edges for professional photography look */
async function vignette(input: Buffer, size: number): Promise<Buffer> {
  // Create a radial gradient mask: bright center, dark edges
  const half = Math.round(size / 2);
  const radius = Math.round(size * 0.7);

  // Build SVG radial gradient for the vignette overlay
  const svgVignette = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="50%" r="50%">
          <stop offset="50%" stop-color="black" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.45"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#v)"/>
    </svg>
  `);

  return sharp(input)
    .composite([{ input: svgVignette, blend: "multiply" }])
    .png()
    .toBuffer();
}

/** Tight crop — 80% center crop, re-scaled to original size.
 *  Creates a close-up product shot effect. */
async function tightCrop(input: Buffer, size: number): Promise<Buffer> {
  const cropSize = Math.round(size * 0.82);
  const offset = Math.round((size - cropSize) / 2);

  return sharp(input)
    .extract({ left: offset, top: offset, width: cropSize, height: cropSize })
    .resize(size, size, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
}

/** Brightness/contrast shift — different ambient lighting feel */
async function brightnessShift(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .modulate({ brightness: 1.08 })
    .linear(1.06, -8) // slight contrast boost
    .png()
    .toBuffer();
}

/** Muted/desaturated — soft, editorial, magazine-style feel */
async function mutedTone(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .modulate({ brightness: 1.04, saturation: 0.75 })
    .gamma(1.15)
    .png()
    .toBuffer();
}

/** Soft edge blur — enhanced depth-of-field look.
 *  Blurs a thin ring around the edges while keeping the center sharp. */
async function softEdgeBlur(input: Buffer, size: number): Promise<Buffer> {
  // Create a blurred version of the full image
  const blurred = await sharp(input)
    .blur(6)
    .png()
    .toBuffer();

  // Create a mask: white center (keep original), black edges (use blurred)
  const maskSize = size;
  const innerRadius = Math.round(size * 0.35);

  const svgMask = Buffer.from(`
    <svg width="${maskSize}" height="${maskSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="m" cx="50%" cy="50%" r="50%">
          <stop offset="40%" stop-color="white" stop-opacity="1"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${maskSize}" height="${maskSize}" fill="url(#m)"/>
    </svg>
  `);

  // Composite: original with alpha mask over blurred background
  // Since sharp doesn't do direct masking easily, we composite the
  // blurred image first, then overlay the original with vignette-style alpha
  const sharpOriginal = await sharp(input)
    .composite([{
      input: svgMask,
      blend: "dest-in",
    }])
    .png()
    .toBuffer();

  return sharp(blurred)
    .composite([{ input: sharpOriginal, blend: "over" }])
    .png()
    .toBuffer();
}

// ────────────────────────────────────────────
// Variation Presets (curated combinations)
// ────────────────────────────────────────────
// Each preset applies 1-2 effects that create a distinct visual identity.
// They're designed to preserve the center card while transforming the scene feel.

const VARIATION_PRESETS: VariationConfig[] = [
  {
    name: "Golden Hour",
    apply: async (input, size) => {
      const warmed = await warmTint(input);
      return vignette(warmed, size);
    },
  },
  {
    name: "Editorial Cool",
    apply: async (input, size) => {
      const cooled = await coolTint(input);
      return vignette(cooled, size);
    },
  },
  {
    name: "Close-Up Product",
    apply: async (input, size) => {
      const cropped = await tightCrop(input, size);
      return brightnessShift(cropped);
    },
  },
  {
    name: "Soft Focus",
    apply: async (input, size) => {
      const blurred = await softEdgeBlur(input, size);
      return warmTint(blurred);
    },
  },
  {
    name: "Magazine Matte",
    apply: async (input, size) => {
      const muted = await mutedTone(input);
      return vignette(muted, size);
    },
  },
  {
    name: "Bright & Airy",
    apply: async (input, size) => {
      return brightnessShift(input);
    },
  },
];

// ────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────

/**
 * Generate a local variation of an AI-generated mockup image.
 *
 * @param baseImageB64 - Base64-encoded AI mockup image (PNG)
 * @param variationIndex - Index to select which preset to use (deterministic)
 * @returns Base64-encoded variation image (PNG)
 */
export async function generateLocalVariation(
  baseImageB64: string,
  variationIndex: number
): Promise<{ image: string; variationName: string }> {
  const inputBuffer = Buffer.from(baseImageB64, "base64");

  // Get image dimensions (should be 1024x1024 but let's be safe)
  const metadata = await sharp(inputBuffer).metadata();
  const size = metadata.width || 1024;

  // Select preset deterministically based on index
  const preset = VARIATION_PRESETS[variationIndex % VARIATION_PRESETS.length];

  console.log(`[Local Variation] Applying "${preset.name}" to base image (${size}×${size})...`);
  const startTime = Date.now();

  const outputBuffer = await preset.apply(inputBuffer, size);

  const durationMs = Date.now() - startTime;
  console.log(`[Local Variation] "${preset.name}" completed in ${durationMs}ms (${(outputBuffer.length / 1024).toFixed(0)}KB)`);

  return {
    image: outputBuffer.toString("base64"),
    variationName: preset.name,
  };
}

/**
 * Generate multiple local variations from a set of AI base images.
 * Each base image gets one variation using a different preset.
 *
 * @param baseImages - Array of base64 AI-generated images
 * @param startPresetIndex - Starting index for preset selection (for diversity across rounds)
 * @returns Array of base64 variation images
 */
export async function generateLocalVariations(
  baseImages: string[],
  startPresetIndex: number = 0
): Promise<{ image: string; variationName: string }[]> {
  const results: { image: string; variationName: string }[] = [];

  for (let i = 0; i < baseImages.length; i++) {
    try {
      const variation = await generateLocalVariation(
        baseImages[i],
        startPresetIndex + i
      );
      results.push(variation);
    } catch (error) {
      console.error(`[Local Variation] Failed to create variation ${i + 1}:`, error);
      // On failure, just skip this variation — the AI base is still available
    }
  }

  return results;
}
