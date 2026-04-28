// ============================================
// BRD-Aligned Constants
// ============================================

// BRD Section 2.4 — Approved Categories (must match DB)
export const APPROVED_CATEGORIES = [
  "Birthday Invitations",
  "Wedding Invitations",
  "Baby Shower Invitations",
  "Bridal Shower Invitations",
  "Valentine's Day Cards",
  "Gender Reveal Invitations",
  "Greeting Cards",
  "Christmas",
  "Halloween",
  "Special Occasions",
] as const;

export type ApprovedCategory = (typeof APPROVED_CATEGORIES)[number];

// BRD Section 8.6 — Theme Alignment Rules
export const CATEGORY_THEMES: Record<string, string> = {
  "Birthday Invitations": "festive, colorful, celebratory",
  "Wedding Invitations": "elegant, romantic, premium",
  "Baby Shower Invitations": "soft, playful, gentle",
  "Bridal Shower Invitations": "chic, feminine, stylish",
  "Valentine's Day Cards": "romantic, warm, expressive",
  "Gender Reveal Invitations": "playful, joyful, pink/blue or theme-aware",
  "Greeting Cards": "versatile, emotional, occasion-aware",
  "Christmas": "warm, festive, joyful",
  "Halloween": "spooky, dark, mysterious",
  "Special Occasions": "patriotic, bright, celebratory",
};

// Preset style options
export const STYLE_OPTIONS = [
  "Modern & Minimalist",
  "Boho & Organic",
  "Vintage & Retro",
  "Watercolor & Artistic",
  "Bold & Geometric",
  "Elegant & Luxurious",
  "Playful & Whimsical",
  "Floral & Romantic",
  "Dark & Moody",
  "Rustic & Natural",
] as const;

// Color palettes
export const COLOR_PALETTES = [
  "Earth Tones — Warm browns, terracotta, sage green",
  "Pastels — Soft pink, lavender, mint, baby blue",
  "Monochrome — Black, white, and grays",
  "Jewel Tones — Emerald, sapphire, ruby, amethyst",
  "Sunset — Coral, peach, gold, warm orange",
  "Ocean — Navy, teal, seafoam, sandy beige",
  "Forest — Deep greens, mossy browns, cream",
  "Blush & Gold — Romantic pink, champagne, gold accents",
  "Custom",
] as const;

// Typography styles
export const TYPOGRAPHY_OPTIONS = [
  "Modern Sans-Serif",
  "Elegant Serif",
  "Handwritten Script",
  "Bold Display",
  "Vintage Typewriter",
  "Minimal Geometric",
  "Calligraphy",
] as const;

// Aspect ratio — BRD says 14:11
export const ASPECT_RATIO = "14:11";

// Resolution options
export const RESOLUTION_OPTIONS = ["HD", "2K", "4K"] as const;

// Mockup count per BRD
export const MOCKUP_COUNT = 8;
