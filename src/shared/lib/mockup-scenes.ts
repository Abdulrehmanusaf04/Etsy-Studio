// ============================================
// Shared Mockup Scene Pool & Helpers
// Used by both Gemini and OpenAI integrations
// ============================================

// Shared text preservation rules — appended to every mockup prompt
export const DESIGN_PRESERVATION_RULES = `
🚨🚨🚨 ABSOLUTE #1 RULE — DESIGN PRESERVATION (THIS OVERRIDES EVERYTHING ELSE) 🚨🚨🚨

THE UPLOADED POSTER/INVITATION IS A LOCKED, IMMUTABLE DESIGN LAYER.
You MUST treat it as a REAL, ALREADY-PRINTED physical card. The pixels of this design are FROZEN.
You CANNOT edit, re-render, redraw, modify, or re-create ANY part of it — not even to "improve" it.

═══════════════════════════════════════════
CRITICAL TECHNIQUE — HOW TO PRESERVE TEXT PERFECTLY:
═══════════════════════════════════════════
• DO NOT attempt to "read" the text and then "re-type" it onto the mockup — this ALWAYS introduces errors.
• Instead, treat the ENTIRE poster as a single flat image/texture. Composite it directly into the scene AS-IS.
• Think of it like placing a PHOTOGRAPH of the poster into the scene — a photograph preserves every pixel exactly.
• The poster image should be EMBEDDED/COMPOSITED, not REGENERATED.
• If you try to re-render any text character-by-character, you WILL make mistakes. DO NOT DO THIS.

═══════════════════════════════════════════
TEXT PRESERVATION (ZERO TOLERANCE — ANY VIOLATION = TOTAL FAILURE):
═══════════════════════════════════════════
1. Every word, letter, number, symbol MUST appear EXACTLY as in the original — pixel-level accuracy
2. Do NOT re-type, re-render, or regenerate ANY text — embed the original image directly
3. Do NOT rephrase, paraphrase, substitute, abbreviate, or expand any wording
4. Do NOT change spelling, capitalization, punctuation, or character spacing
5. Do NOT hallucinate, invent, or guess text — if unclear, keep it as-is from the original
6. Do NOT translate text into any other language
7. Do NOT add any new text, labels, captions, watermarks, or annotations
8. EVERY character must be crisp, sharp, and high-resolution — no blur, no smudging, no artifacts

═══════════════════════════════════════════
TYPOGRAPHY PRESERVATION (ZERO TOLERANCE):
═══════════════════════════════════════════
9. Font faces MUST remain identical — do not substitute fonts
10. Font sizes, weights (bold/regular/light), and colors MUST remain identical
11. Letter spacing, line spacing, text alignment, and positions MUST remain identical
12. Text rendering must be SHARP and HIGH-RESOLUTION — never blurry, pixelated, or degraded

═══════════════════════════════════════════
DESIGN & LAYOUT PRESERVATION (ZERO TOLERANCE):
═══════════════════════════════════════════
13. ALL visual elements (illustrations, icons, graphics, borders, patterns, backgrounds) MUST remain unchanged
14. Colors within the poster MUST remain identical — no hue shifts, saturation changes, or brightness adjustments
15. Layout, spacing, margins, and proportions MUST remain identical
16. Do NOT crop, rotate, skew, warp, distort, or stretch the poster
17. Do NOT add effects, filters, overlays, shadows, or glows to the poster itself

═══════════════════════════════════════════
IMAGE QUALITY REQUIREMENTS FOR THE POSTER:
═══════════════════════════════════════════
18. The poster MUST be rendered at FULL RESOLUTION — no downscaling, no compression artifacts
19. Text on the poster must be SHARPER and CRISPER than any other element in the scene
20. The poster should look like a HIGH-QUALITY PRINT — clean edges, vivid colors, perfect text
21. Apply the sharpest focus in the entire image to the poster surface
22. If the poster appears anywhere in the scene, it must be LARGE ENOUGH for all text to be easily readable

═══════════════════════════════════════════
MENTAL MODEL — HOW TO THINK ABOUT THIS:
═══════════════════════════════════════════
• The poster is a REAL PHYSICAL PRINTED CARD — already printed, ink-on-paper, unchangeable
• You are a PHOTOGRAPHER taking a photo of that card in a styled scene
• A photographer CANNOT change what is printed on a card
• YOUR JOB: Create the beautiful scene, props, lighting, and environment AROUND the poster
• NOT YOUR JOB: Touch, modify, or re-create anything ON the poster itself
• The poster is a READ-ONLY PHOTOGRAPHIC LAYER — composite it directly, never re-render it

FOCAL POINT RULES:
• The poster MUST be the primary visual subject — large, prominent, clearly readable at full resolution
• The poster should occupy at least 30-40% of the total image area
• Props and environment must complement and frame the poster, never compete with or obscure it
• All text on the poster must be PERFECTLY LEGIBLE — crisp, sharp, high-resolution, zero distortion`;

// 3 Specific Mandatory Mockup Scenes — always included exactly once across 3 rounds (1 per round)
export const MANDATORY_SCENES: string[] = [
  // Round 1 Mandatory Scene
  `SCENE: Luxury Pinterest-style Birthday Invitation Mockup
Create a luxury Pinterest-style product listing infographic mockup for a birthday invitation template. 
The image must have a clean, structured layout consisting of a top title area, a central mockup showcase, and a bottom footer row:
- Top Title Area: A clean prominent headline at the very top: “Ideal for Print & Digital USE” (with the word “USE” styled inside a clean banner). Below it, three clean circular line-art icons arranged horizontally: a printer with subtitle “PRINT AT HOME OR AT A PROFESSIONAL PRINTER”, a paper plane with subtitle “SEND VIA EMAIL, SMS OR SOCIAL MEDIA”, and a smartphone with subtitle “PERFECT FOR DIGITAL INVITATIONS”.
- Central Mockup Area: Side-by-side presentation on a premium textured warm neutral surface. On the left is an upright printed physical invitation card displaying the template design. On the right is a modern tablet/iPad standing next to the card, displaying the exact same template design on its screen. The environment is styled with tasteful birthday decorations: a small decorative birthday cupcake, colorful confetti scattered lightly, a small wrapped gift box with a soft satin ribbon, and subtle birthday decor matching the theme. Soft, warm natural daylight casting realistic shadows.
- Bottom Footer Area: A clean row of 4 checked features: “HIGH RESOLUTION 300 DPI”, “EASY TO CUSTOMIZE & PERSONALIZE”, “SUITABLE FOR ANY AGE”, and “INSTANT DOWNLOAD & PRINT READY”. At the very bottom, a charming centered banner containing the text: “Make every moment memorable”.
Keep the original invitation template, text, and design 100% unchanged on both the card and the tablet screen. Do not modify any text, fonts, colors, graphics, or layout inside the invitation. Only create the surrounding infographic mockup scene. Ultra-realistic, elegant, Etsy bestseller quality, HD resolution.`,

  // Round 2 Mandatory Scene
  `SCENE: Elegant Canva User Guide
Create an elegant Canva User Guide image for a birthday invitation template. Feature the uploaded invitation prominently alongside a clean step-by-step editing guide. Include sections such as: Purchase & Download, Open in Canva, Customize Your Details, Preview Your Design, and Download & Share. Display realistic Canva-inspired editing screens on a tablet, or laptop, or smartphone, or posters to demonstrate how the template can be edited and used on different devices.

Add a highly visible visual notice or badge in the guide layout that clearly states: "Only Text is Editable — Colors, Graphics, Fonts, and Layout are Fixed".

Use soft natural lighting, bright airy tones, shallow depth of field, and premium Etsy product photography styling. Incorporate tasteful birthday-themed decorations such as balloons, gifts, cake accents, ribbons, confetti, candles, flowers, or party décor that complement the invitation colors acc to the theme/template. Include clean headings, modern icons, download format badges (PNG, JPG, PDF), and a polished layout that is easy to read and visually appealing.
(Only available in digital product, no physical item is shipped)
Keep the uploaded invitation design 100% unchanged. Do not modify, recreate, redraw, edit, or alter any text, fonts, colors, graphics, artwork, or layout inside the actual invitation. Only create the surrounding user guide design and instructional elements. Ultra-realistic, luxury Pinterest aesthetic, Etsy bestseller quality, professional infographic layout, HD resolution`,

  // Round 3 Mandatory Scene
  `SCENE: Laptop Canva Workspace Mockup
Create a luxury Pinterest-style laptop mockup featuring the actual birthday invitation displayed inside a realistic Canva editing workspace on a modern laptop screen. CRITICAL PROPORTION REQUIREMENT: The laptop hardware, keyboard, and screen MUST have completely realistic, physical real-world proportions (standard 16:9 or 16:10 aspect ratio). Do NOT generate a cartoonishly oversized screen, stretched dimensions, or unnatural sizes. It must look exactly like a real 13-inch or 15-inch MacBook. Use soft natural lighting, bright airy tones, shallow depth of field, and high-end Etsy product photography. Include tasteful birthday-themed decorations such as (balloons, or gifts, or ribbons, or flowers, or cake accents, or candles, or confetti, or party décor (all acc to the theme/template) that complement the invitation colors. Add a Canva logo positioned naturally beside the laptop (don’t take it back behind the laptop). The laptop must be shown in realistic, standard size relative to the surrounding props. The laptop may be shown from a front-facing or angled perspective, whichever best suits the design. Keep the invitation design 100% unchanged. Do not modify any text, fonts, colors, graphics, artwork, or layout inside the invitation. Only create the surrounding mockup scene and Canva editing environment. Ultra-realistic, elegant, Etsy bestseller quality, HD resolution.`
];

// Unified pool of 22 premium mockup scene prompts — cinematic, editorial, Etsy-quality
// Scenes are randomly shuffled via Fisher-Yates on every generation call (see selectRandomScenes)
export const MOCKUP_SCENE_POOL: string[] = [
  // 1. Luxury Stationery Flatlay
  `SCENE: Luxury Stationery Flatlay 
Birthday poster flatlay on marble or linen surface with matching envelope, and other birthday elements. Luxury Pinterest-style setup with soft lighting and shallow depth (realistic sunlight shaddows, even on poster (if day theme)). Ultra realistic HD photography. Keep the original template, text, and design completely unchanged. Creative freedom for mockup styling only.`,

  // 2. Dreamy Birthday Backdrop
  `SCENE: Dreamy Birthday Backdrop 
Framed or printed birthday poster in front of a softly blurred birthday scene with balloons, cake, gifts, with other birthday elements and warm bokeh lights (realistic sunlight shaddows, even on poster (if day theme)). Cinematic glow, magical party vibe. Ultra realistic HD photography. Do not modify the original design in any way.`,

  // 3. Child Holding Poster
  `SCENE: Child Holding Poster 
Child holding the birthday poster outdoors at a party, (for female name, it should be girl that holds the poster, for male, it should be boy who holds the poster) , do not reveal face. Soft-focus balloons and sunlight in the background (realistic sunlight shaddows, even on poster (if day theme)). Authentic lifestyle photography with creamy bokeh. Ultra realistic HD image. Keep the original template fully untouched.`,

  // 4. Smartphone Birthday Display
  `SCENE: Smartphone Birthday Display 
Latest iPhone displaying the birthday design in-hand with blurred birthday decor behind. Realistic reflections, warm lighting, premium social-media style. HD realistic photography. Keep the original artwork and text unchanged.`,

  // 5. Elegant Framed Setup
  `SCENE: Elegant Framed Setup 
Birthday poster in a clean frame or printed display surrounded by balloon arches, cake, gifts, confetti & other birthday elements. Bright Etsy-style editorial setup (realistic sunlight shaddows, even on poster (if day theme)). Ultra realistic HD photography. Original design must stay exactly the same.`,

  // 6. Garden Easel Display
  `SCENE: Garden Easel Display 
Birthday poster on a standy or easel in an outdoor party setup with balloon garlands, gifts, and other birthday elements with warm sunlight (realistic sunlight shaddows, even on poster (if day theme)). Elegant event-style HD photography. Do not redesign or alter the actual template.`,

  // 7. Balloon Arch Showcase
  `SCENE: Balloon Arch Showcase 
Birthday poster centered under a dramatic balloon arch with matching decor, confetti and other birthday elements (realistic sunlight shaddows, even on poster (if day theme)). Instagram-worthy party styling with realistic HD photography. Keep the original poster completely untouched.`,

  // 8. Soft Window Editorial
  `SCENE: Soft Window Editorial 
Birthday poster near a large window with soft daylight, linen fabric, and subtle birthday elements around original poster. Airy magazine-style aesthetic with dreamy highlights (realistic sunlight shaddows, even on poster (if day theme)). HD editorial photography. Original template must remain unchanged.`,

  // 9. Dessert Table Setup
  `SCENE: Dessert Table Setup 
Birthday poster displayed on a fancy plate on table beside cupcakes, cake, macarons, candy jars, and matching birthday decor. Warm inviting lighting and vibrant celebration mood (realistic sunlight shaddows, even on poster (if day theme)). Ultra realistic HD photography. Preserve the exact design and text of actual template.`,

  // 10. Outdoor Picnic Mockup
  `SCENE: Outdoor Picnic Mockup 
Birthday poster on a picnic blanket with cupcakes, plush toys acc to template, confetti, and other birthday elements. Warm sunlight and whimsical outdoor vibe (realistic sunlight shaddows, even on poster (if day theme)). HD realistic lifestyle photography. Keep the actual template untouched.`,

  // 11. Luxury Gift Box Reveal
  `SCENE: Luxury Gift Box Reveal 
Birthday poster emerging from a premium gift box, satin ribbons, and other birthday elements with elegant styling. Warm cinematic lighting and luxury unboxing feel. Ultra realistic HD photography. Do not alter the original template design & text.`,

  // 12. Aesthetic Wall Display
  `SCENE: Aesthetic Wall Display 
Birthday poster taped onto a textured neutral wall with fairy cool lights and minimal decor props matching the theme and other birthday elements around (realistic sunlight shaddows, even on poster (if day theme)). Cozy Instagram-inspired setup with realistic HD photography. Keep the original template unchanged.`,

  // 13. Rustic Printed Copies
  `SCENE: Rustic Printed Copies 
Multiple birthday poster prints layered casually with ribbons, envelopes, confetti, and other birthday elements. Golden-hour handcrafted lifestyle feel (realistic sunlight shaddows, even on poster (if day theme)). Ultra realistic HD photography. Preserve all original design elements.`,

  // 15. Cozy Indoor Birthday Scene
  `SCENE: Cozy Indoor Birthday Scene 
Birthday poster styled in a cozy indoor birthday setup with balloons, fairy lights, banners, wrapped gifts, and other birthday elements with warm lighting acc to the theme. Emotional home birthday-party atmosphere with realistic HD photography. Actual Template must remain untouched.`,

  // 16. Garden Tea Party Setup
  `SCENE: Garden Tea Party Setup 
Birthday poster styled on a lace-covered garden table with teacups, macarons, ribbons, and other birthday elements with elegant birthday decor. Soft natural light with storybook charm (realistic sunlight shaddows, even on poster (if day theme)). Ultra realistic HD photography. Preserve the original template exactly.`,

  // 17. Golden Window Display
  `SCENE: Golden Window Display 
Birthday poster placed near a sunlit window (great sunlight effect) with flowing curtains, and other birthday elements with dramatic golden-hour shadows acc to theme/template (realistic sunlight shaddows, even on poster (if day theme)). Peaceful editorial atmosphere with cinematic glow. HD realistic photography. Do not modify the original design or text.`,

  // 18. Round Table Cafe Setup
  `SCENE: Round Table Cafe Setup 
Birthday poster displayed on a round table between stylish chairs with teacups, macarons, ribbons, and other birthday elements with elegant decor in the background as per the template. Soft natural lighting with shaddows and premium lifestyle feel. Ultra realistic HD photography. Keep the original template fully unchanged.`,

  // 19. Mirror Reflection Mockup
  `SCENE: Mirror Reflection Mockup 
Birthday poster placed beside or slightly leaning against a stylish mirror with soft reflections and other birthday elements, and subtle decor around it acc to template. Elegant luxury aesthetic with cinematic reflections and ultra realistic HD photography (realistic sunlight shaddows, even on poster (if day theme)). Keep the original template completely unchanged.`,

  // 20. Car Backseat Party Setup
  `SCENE: Car Backseat Party Setup 
Birthday poster placed on a luxury car backseat surrounded by balloons, wrapped gifts, ribbons, and other birthday elements. Soft sunlight entering through windows with premium lifestyle vibes (realistic sunlight shaddows, even on poster (if day theme)). Ultra realistic HD photography. Do not modify the original design or text.`,

  // 21. Floating Poster Scene
  `SCENE: Floating Poster Scene 
Birthday poster creatively floating mid-air with confetti, ribbons, balloons, and party/birthday elements suspended around it. Clean studio background with dynamic motion feel and dramatic lighting. Ultra realistic HD photography. Preserve the original design exactly as provided.`,

  // 22. Bedside Morning Setup
  `SCENE: Bedside Morning Setup 
Birthday poster placed on a cozy bed with soft blankets, breakfast macarons, gifts, and other birthday elements with warm morning sunlight with shaddows streaming through curtains. Calm editorial lifestyle aesthetic with ultra realistic HD photography. Keep the original template, text completely unchanged.`,
];

/**
 * Fisher-Yates shuffle to select N unique random scenes from the pool.
 * Guarantees no duplicates within a single generation batch AND across rounds.
 * Returns both the selected scenes and their original indices for tracking.
 */
export function selectRandomScenes(count: number, excludeIndices: number[] = []): { scenes: string[]; indices: number[] } {
  // Build pool of available scenes (exclude previously used ones)
  const excludeSet = new Set(excludeIndices);
  const available = MOCKUP_SCENE_POOL
    .map((scene, index) => ({ scene, index }))
    .filter(({ index }) => !excludeSet.has(index));

  // If not enough unused scenes remain, reset and use the full pool
  const pool = available.length >= count ? available : MOCKUP_SCENE_POOL.map((scene, index) => ({ scene, index }));

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, Math.min(count, pool.length));
  return {
    scenes: selected.map(s => s.scene),
    indices: selected.map(s => s.index),
  };
}

/**
 * Robustly selects N scenes for a specific round of mockup generation.
 * Injects exactly one mandatory scene (from MANDATORY_SCENES) at a random position,
 * and fills the remaining slots with randomly selected scenes from MOCKUP_SCENE_POOL.
 * Round number (1, 2, or 3) is automatically deduced from the number of previously used scenes.
 */
export function selectScenesForRound(count: number, excludeIndices: number[] = []): { scenes: string[]; indices: number[] } {
  // If count is less than 1, return empty
  if (count <= 0) {
    return { scenes: [], indices: [] };
  }

  // Detect round number (exclude standard index 2 child-scene from the count)
  const numPreviouslyUsed = excludeIndices.filter(idx => idx !== 2).length;
  let roundNumber = 1;
  if (numPreviouslyUsed >= 8) {
    roundNumber = 3;
  } else if (numPreviouslyUsed >= 4) {
    roundNumber = 2;
  }

  // Get the mandatory scene for this round
  const mandatoryPrompt = MANDATORY_SCENES[roundNumber - 1] || MANDATORY_SCENES[0];
  const mandatoryIndex = 100 + (roundNumber - 1);

  // Exclude the mandatory index to prevent duplicate selection of mandatory scenes
  const updatedExcludeSet = new Set(excludeIndices);
  updatedExcludeSet.add(mandatoryIndex);
  const updatedExcludes = Array.from(updatedExcludeSet);

  // Select count - 1 random scenes from the pool
  const randomCount = count - 1;
  const { scenes: randomScenes, indices: randomIndices } = selectRandomScenes(randomCount, updatedExcludes);

  // Combine them
  const selectedScenes = [...randomScenes];
  const selectedIndices = [...randomIndices];

  // Randomly insert the mandatory scene so it does not always occupy the same spot in the UI
  const insertPos = Math.floor(Math.random() * count);
  selectedScenes.splice(insertPos, 0, mandatoryPrompt);
  selectedIndices.splice(insertPos, 0, mandatoryIndex);

  return {
    scenes: selectedScenes,
    indices: selectedIndices,
  };
}

/**
 * Build the full mockup prompt with scene instructions and design preservation rules.
 * Shared between Gemini and OpenAI integrations.
 */
export function buildMockupPrompt(scenePrompt: string, variationNumber: number, extractedText?: string): string {
  const textGroundTruth = extractedText ? `
═══════════════════════════════════════════
📝 MANDATORY TEXT GROUND TRUTH — REPRODUCE VERBATIM:
═══════════════════════════════════════════
The following text was extracted from the original template via OCR.
Every character below MUST appear EXACTLY as written in the generated mockup.
This is your MANDATORY reference — treat it as absolute truth:

"""
${extractedText}
"""

MANDATORY TEXT REPRODUCTION RULES:
• Treat each word/letter/number above as a FIXED VISUAL GRAPHIC — not as language to interpret
• Reproduce every character with PIXEL-LEVEL ACCURACY — exact spelling, exact capitalization, exact punctuation, exact spacing
• Do NOT "correct" any perceived spelling mistakes — the original text is INTENTIONAL
• Do NOT paraphrase, rephrase, abbreviate, expand, or modify ANY word or character
• Do NOT add any text that does not appear in the reference above
• Do NOT omit any text that appears in the reference above
• Do NOT change font styles, sizes, colors, or positions of any text
• This text must be SHARP, CRISP, and HIGH-RESOLUTION — zero blur, zero artifacts, zero distortion
` : '';

  return `🚨🚨🚨 CRITICAL INSTRUCTION — READ BEFORE DOING ANYTHING 🚨🚨🚨

You have been given a poster/invitation design image. This image is SACRED and IMMUTABLE.
The poster contains specific text that must be preserved with ZERO errors.

YOUR #1 TECHNICAL REQUIREMENT:
Do NOT attempt to "read" the text on the poster and then "re-type" or "re-render" it.
Instead, you MUST treat the entire poster as a SINGLE FLAT IMAGE — a pre-printed photograph.
Composite/embed the poster image DIRECTLY into the mockup scene WITHOUT re-drawing any part of it.
Think of it as PASTING a high-resolution photo of the poster into a beautifully styled scene.
If you try to re-create the text character by character, you WILL introduce spelling errors, font mismatches, and blurriness. DO NOT DO THIS.

The poster's text, fonts, colors, graphics, and layout are PERMANENTLY LOCKED. You cannot change a single pixel.
Your ONLY job is to create a beautiful ENVIRONMENT/SCENE around the poster.
${textGroundTruth}
═══════════════════════════════════════════
STEP 1 — STUDY THE POSTER (scene-styling purposes only):
═══════════════════════════════════════════
Before composing anything, study the attached poster to understand:
- Dominant colors (for color-matching the scene props)
- Theme direction (for selecting appropriate props and environment)
- Visual style and mood (for matching the scene aesthetic)
IMPORTANT: This analysis is ONLY for styling the SURROUNDING SCENE. Do NOT alter the poster based on this.

═══════════════════════════════════════════
STEP 2 — COLOR & THEME MATCHING:
═══════════════════════════════════════════
Every prop, surface, and background element must be COLOR-COORDINATED with the poster:
- Extract the poster's 3-4 dominant colors → use those + neutrals for ALL scene elements
- Pastel poster → pastel props. Bold poster → vibrant props. Elegant poster → sophisticated props.
- The scene should feel CUSTOM-DESIGNED to complement this specific poster
- NEVER use clashing or random colors for props

═══════════════════════════════════════════
STEP 3 — COMPOSE THIS PREMIUM SCENE (Variation ${variationNumber}):
═══════════════════════════════════════════
${scenePrompt}

═══════════════════════════════════════════
PHOTOGRAPHY & TEXT QUALITY REQUIREMENTS:
═══════════════════════════════════════════
- PHOTOREALISTIC — indistinguishable from a real photograph by a professional product photographer
- THE POSTER MUST BE RAZOR-SHARP — it should have the HIGHEST resolution and sharpest focus of anything in the image
- All text on the poster must be PERFECTLY CRISP, CLEAR, and READABLE at full size — zero blur, zero artifacts, zero distortion
- Text must be the SHARPEST element in the entire image — sharper than props, background, and all other scene elements
- CINEMATIC DEPTH — shallow depth of field (f/1.8–f/2.8), poster sharp, background in creamy bokeh
- EDITORIAL LIGHTING — soft, warm, golden-toned, realistic shadows and highlights
- The poster should occupy 30-40% of the image area — large enough for every detail to be visible
- HD resolution, ultra-detailed, premium Etsy listing quality

${DESIGN_PRESERVATION_RULES}

🚨 FINAL VERIFICATION CHECKLIST — DO THIS BEFORE OUTPUTTING 🚨
1. Is the poster image composited directly as a flat image (not re-drawn or re-rendered)? ✓ REQUIRED
2. Does every word/letter/number on the poster match the original EXACTLY — including the ground truth text above? ✓ REQUIRED
3. Are all fonts, sizes, colors, weights, and positions identical to the original? ✓ REQUIRED
4. Is ALL text SHARP, CRISP, and HIGH-RESOLUTION (not blurry, pixelated, or degraded)? ✓ REQUIRED
5. Is the poster large, prominent, and fully readable in the scene? ✓ REQUIRED
6. Is there ZERO text distortion — no missing letters, no extra letters, no spelling changes? ✓ REQUIRED
If ANY answer is NO — REDO the image. The poster text must be a pixel-perfect, character-accurate reproduction.`;
}
