import OpenAI, { toFile } from "openai";
import type { Uploadable } from "openai/uploads";
import { MOCKUP_COUNT } from "./constants";
import { MOCKUP_SCENE_POOL, selectRandomScenes, selectScenesForRound } from "./mockup-scenes";
import { GenerationAnalytics } from "./analytics";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ============================================
// Utilities
// ============================================
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Throttle for text API calls (gpt-4o-mini OCR/analysis/description) only.
// Image generation calls run in parallel and don't need throttling.
const TEXT_API_DELAY = 2000;
let lastTextApiCallTime = 0;

async function throttledTextApiCall() {
  const now = Date.now();
  const elapsed = now - lastTextApiCallTime;
  if (elapsed < TEXT_API_DELAY) {
    await delay(TEXT_API_DELAY - elapsed);
  }
  lastTextApiCallTime = Date.now();
}

// Exponential backoff with jitter for retry logic
function getBackoffDelay(attempt: number): number {
  // attempt 1 → 0ms (immediate), attempt 2 → 5-7s
  if (attempt <= 1) return 0;
  return 5000 + Math.random() * 2000;
}

// ────────────────────────────────────────────
// Cost Control Constants
// ────────────────────────────────────────────
// Every mockup gets its own unique scene from the 23-scene pool.
// quality:"medium" keeps cost at ~$0.05/image → $0.20/round for 4 images.
const MAX_RETRY_ATTEMPTS = 2;
// Safety threshold: abort if total API calls in a round exceed this
const MAX_API_CALLS_PER_ROUND = 12; // 4 images × 2 attempts + 4 buffer

// ============================================
// Types (mirror gemini.ts)
// ============================================
export interface MockupRequest {
  category: string;
  templateDescription: string;
  templateUrl: string;
  count?: number;
  templateBase64?: string;
  templateMimeType?: string;
  isExternal?: boolean;
  excludeSceneIndices?: number[];
  extractedText?: string;
}

export interface EtsyListingOutput {
  title: string;
  description_body: string;
  features: string[];
  usage_instructions: string;
  download_details: string;
  tags: string[];
}

// ============================================
// 1. OCR — Extract Text from Template
// ============================================
export async function extractTextFromTemplate(
  templateBase64: string,
  templateMimeType: string
): Promise<string> {
  try {
    await throttledTextApiCall();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${templateMimeType};base64,${templateBase64}` },
            },
            {
              type: "text",
              text: `Extract ALL visible text from this design image verbatim.
Rules: preserve exact spelling, capitalization, punctuation, special characters.
Do NOT correct, interpret, paraphrase, or add commentary.
List each text block on its own line, top to bottom, left to right.
Return ONLY the raw text. No markdown, no bullet points, no quotes.`,
            },
          ],
        },
      ],
      temperature: 0,
    });
    const result = response.choices?.[0]?.message?.content?.trim() || "";
    console.log(`[GPT OCR] Extracted text (${result.length} chars): ${result.substring(0, 150)}...`);
    return result;
  } catch (error) {
    console.error("[GPT] Text extraction (OCR) failed:", error);
    return "";
  }
}

// Helper to build a clean, safe prompt specifically for OpenAI gpt-image-2 edits API.
// Includes theme-matching context so the AI adapts scene props, colors, and mood
// to complement the uploaded template's aesthetic.
function buildOpenAIMockupPrompt(
  scenePrompt: string,
  variationNumber: number,
  extractedText?: string,
  category?: string
): string {
  const cleanScene = scenePrompt.replace(/^SCENE:\s*/i, "");

  const textContext = extractedText
    ? `The template card contains the following text: "${extractedText}". You must preserve all of this text exactly without any spelling mistakes or changes.`
    : "";

  const themeContext = category
    ? `The template is a ${category} design.`
    : "";

  return `A professional product photograph of a mock-up design (Variation ${variationNumber}).
Place the provided card design directly into this unique scene:
${cleanScene}

Theme Matching:
${themeContext}
Study the template's dominant colors, visual style, and mood. Match ALL scene props, surfaces, flowers, ribbons, decor items, and background elements to complement the template's color palette and aesthetic. The scene should feel custom-designed for this specific template — not generic.

Important Guidelines:
1. Do not modify, edit, redraw, or recreate the provided template design or its text in any way. Keep all original details, colors, fonts, and text completely unchanged.
2. The card should be the main visual focus, styled beautifully in the scene.
3. ${textContext}
4. Cinematic lighting, soft shadows, realistic textures, and premium Etsy listing quality.
5. This must look COMPLETELY DIFFERENT from any other mockup of this template — unique composition, unique camera angle, unique prop arrangement.`;
}

// ============================================
// 2. Mockup Image Generation (gpt-image-2)
// ============================================
// Accepts a pre-built imageFile to avoid redundant Buffer→toFile conversion on every call.
export async function generateMockupImage(
  imageFile: Uploadable,
  scenePrompt: string,
  variationNumber: number,
  extractedText: string,
  category?: string
): Promise<string> {
  const prompt = buildOpenAIMockupPrompt(scenePrompt, variationNumber, extractedText, category);

  // No throttle here — image generation calls run in parallel.
  // Rate limiting is handled at the orchestrator level via concurrency control.

  const response = await openai.images.edit({
    model: "gpt-image-2-2026-04-21",
    image: [imageFile],
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "low",
  });

  const imageData = response.data?.[0];
  if (!imageData) {
    throw new Error("No mockup image data in GPT response");
  }

  // gpt-image-2 returns b64_json by default
  if (imageData.b64_json) {
    return imageData.b64_json;
  }

  // Fallback: if URL is returned instead, fetch and convert to base64
  if (imageData.url) {
    const imgRes = await fetch(imageData.url);
    const arrayBuffer = await imgRes.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  }

  throw new Error("No image data in GPT response (neither b64_json nor url)");
}

// ============================================
// 2b. Single Mockup with Retry + Backoff
// ============================================
// Encapsulates the retry logic for a single AI mockup slot.
// Reduced to 2 attempts max to control API spend.
async function generateMockupWithRetry(
  imageFile: Uploadable,
  initialScene: string,
  initialSceneIdx: number,
  mockupIndex: number,
  extractedText: string,
  usedSceneIndices: Set<number>,
  analytics: GenerationAnalytics,
  apiCallCounter: { count: number },
  category?: string
): Promise<{ image: string; sceneIndex: number } | null> {
  let currentScene = initialScene;
  let currentSceneIdx = initialSceneIdx;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    // Cost guard: abort if we've exceeded the safety threshold
    if (apiCallCounter.count >= MAX_API_CALLS_PER_ROUND) {
      console.warn(`[GPT] Cost guard triggered: ${apiCallCounter.count} API calls reached limit of ${MAX_API_CALLS_PER_ROUND}. Skipping mockup ${mockupIndex + 1}.`);
      analytics.recordMockup({
        mockupIndex,
        sceneIndex: currentSceneIdx,
        attempts: attempt,
        durationMs: Date.now() - startTime,
        status: "failed",
        source: "ai",
        failureReason: "Cost guard: API call limit exceeded",
      });
      return null;
    }

    try {
      // Exponential backoff on retries (attempt 1 = immediate)
      const backoff = getBackoffDelay(attempt);
      if (backoff > 0) {
        console.log(`[GPT Mockup Gen] Waiting ${(backoff / 1000).toFixed(1)}s before retry...`);
        await delay(backoff);
      }

      console.log(`[GPT Mockup Gen] AI generating mockup ${mockupIndex + 1} (scene #${currentSceneIdx}, attempt ${attempt})...`);
      apiCallCounter.count++;
      const image = await generateMockupImage(imageFile, currentScene, mockupIndex + 1, extractedText, category);

      analytics.recordMockup({
        mockupIndex,
        sceneIndex: currentSceneIdx,
        attempts: attempt,
        durationMs: Date.now() - startTime,
        status: "success",
        source: "ai",
      });

      return { image, sceneIndex: currentSceneIdx };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[GPT] Mockup ${mockupIndex + 1} attempt ${attempt} failed:`, errMsg);

      if (attempt < MAX_RETRY_ATTEMPTS) {
        // Swap to a safe fallback scene (exclude child scene #2 + already used)
        const safePool = MOCKUP_SCENE_POOL
          .map((s, idx) => ({ s, idx }))
          .filter(({ idx }) => idx !== 2 && idx !== currentSceneIdx && !usedSceneIndices.has(idx));

        if (safePool.length > 0) {
          const fallback = safePool[Math.floor(Math.random() * safePool.length)];
          currentScene = fallback.s;
          currentSceneIdx = fallback.idx;
          console.log(`[GPT Mockup Gen] Swapping to fallback scene #${currentSceneIdx} for retry...`);
        }
      } else {
        analytics.recordMockup({
          mockupIndex,
          sceneIndex: currentSceneIdx,
          attempts: attempt,
          durationMs: Date.now() - startTime,
          status: "failed",
          source: "ai",
          failureReason: errMsg,
        });
        console.error(`[GPT] All ${MAX_RETRY_ATTEMPTS} attempts for mockup ${mockupIndex + 1} failed.`);
      }
    }
  }

  return null;
}

// ============================================
// 3. Generate All Mockups (Unique Scene Orchestrator)
// ============================================
// COST-OPTIMIZED PIPELINE with FULL SCENE DIVERSITY:
//   1. Fetch template image ONCE
//   2. Convert to uploadable file ONCE (image caching)
//   3. Run OCR ONCE (cached across rounds via extractedText)
//   4. Select 4 UNIQUE scenes from the 23-scene pool (no repeats across rounds)
//   5. Generate all 4 in PARALLEL via Promise.allSettled at quality:"medium"
//   6. Each mockup gets its own distinct scene → maximum visual diversity
//   Cost: 4 × $0.05 = $0.20/round, $0.60 for 3 rounds
export async function generateAllMockups(
  req: MockupRequest
): Promise<{ images: string[]; usedSceneIndices: number[]; extractedText: string }> {
  const count = req.count || MOCKUP_COUNT; // 4 unique mockups per round
  
  // ════════════════════════════════════════════════════════
  // STEP 0.1: Detect round number based on excluded scenes
  // ════════════════════════════════════════════════════════
  let roundNumber = 1;
  const numPreviouslyExcluded = req.excludeSceneIndices?.length || 0;
  if (numPreviouslyExcluded >= 8) {
    roundNumber = 3;
  } else if (numPreviouslyExcluded >= 4) {
    roundNumber = 2;
  }

  const analytics = new GenerationAnalytics();
  analytics.startRound(roundNumber);

  // Shared API call counter for cost guard (passed by reference)
  const apiCallCounter = { count: 0 };

  // ════════════════════════════════════════════════════════
  // STEP 0.2: Resolve the template image ONCE
  // ════════════════════════════════════════════════════════
  let templateBase64 = req.templateBase64 || "";
  let templateMimeType = req.templateMimeType || "image/png";

  if (!templateBase64 && req.templateUrl) {
    try {
      console.log(`[GPT Mockup Gen] Fetching template from URL...`);
      const imgRes = await fetch(req.templateUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      templateBase64 = Buffer.from(arrayBuffer).toString("base64");
      templateMimeType = imgRes.headers.get("content-type") || "image/png";
    } catch (e) {
      console.error("[GPT Mockup Gen] Failed to fetch template image:", e);
      throw new Error("Could not fetch template image for mockup generation");
    }
  }

  if (!templateBase64) {
    throw new Error("No template image available for mockup generation");
  }

  // ════════════════════════════════════════════════════════
  // STEP 1: Pre-build the uploadable image file ONCE (image caching)
  // ════════════════════════════════════════════════════════
  const imageBuffer = Buffer.from(templateBase64, "base64");
  const imageFile = await toFile(imageBuffer, "template.png", {
    type: templateMimeType || "image/png",
  });
  console.log(`[GPT Mockup Gen] Template image cached (${(imageBuffer.length / 1024).toFixed(0)}KB)`);

  // ════════════════════════════════════════════════════════
  // STEP 2: Extract ALL text from the template via OCR (done ONCE, cached across rounds)
  // ════════════════════════════════════════════════════════
  let extractedText = req.extractedText || "";
  if (!extractedText) {
    console.log(`[GPT Mockup Gen] Extracting text from template via OCR...`);
    extractedText = await extractTextFromTemplate(templateBase64, templateMimeType);
    analytics.recordOcrCall();
  }

  // ════════════════════════════════════════════════════════
  // STEP 3: Select 4 UNIQUE scenes from the pool
  // ════════════════════════════════════════════════════════
  // Exclude child scene (index 2) — triggers safety blocks on OpenAI
  // Also exclude scenes used in previous rounds for cross-round diversity
  const gptExcludeIndices = Array.from(new Set([...(req.excludeSceneIndices || []), 2]));
  const { scenes: selectedScenes, indices: selectedIndices } = selectScenesForRound(count, gptExcludeIndices);
  const usedSceneIndices = new Set(selectedIndices);
  console.log(`[GPT Mockup Gen] Round ${roundNumber}: Selecting ${count} unique scenes: [${selectedIndices.join(', ')}] (excluded: ${gptExcludeIndices.join(', ')})`);

  // ════════════════════════════════════════════════════════
  // STEP 4: Generate all 4 mockups in PARALLEL (each with unique scene)
  // ════════════════════════════════════════════════════════
  console.log(`[GPT Mockup Gen] Launching ${count} parallel AI generations (quality: low)...`);

  const promises = selectedScenes.map((scene, i) =>
    generateMockupWithRetry(
      imageFile,
      scene,
      selectedIndices[i],
      i,
      extractedText,
      usedSceneIndices,
      analytics,
      apiCallCounter,
      req.category
    )
  );

  const settled = await Promise.allSettled(promises);

  // Collect successful results, preserving order
  const results: string[] = [];
  const finalSceneIndices: number[] = [...selectedIndices];

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result.status === "fulfilled" && result.value) {
      results.push(result.value.image);
      finalSceneIndices[i] = result.value.sceneIndex;
    } else if (result.status === "rejected") {
      console.error(`[GPT] Mockup ${i + 1} promise rejected:`, result.reason);
    }
  }

  // ════════════════════════════════════════════════════════
  // STEP 5: Print analytics summary & finish
  // ════════════════════════════════════════════════════════
  analytics.finishRound();

  if (results.length === 0) {
    throw new Error("All GPT mockup generations failed");
  }

  console.log(`[GPT Mockup Gen] ✅ Round complete: ${results.length}/${count} unique AI mockups (${apiCallCounter.count} API calls)`);
  return { images: results, usedSceneIndices: finalSceneIndices, extractedText };
}

// ============================================
// 4. Design Image Analysis (Vision-based)
// ============================================
export async function analyzeDesignImage(
  base64: string,
  mimeType: string,
  category: string,
  extractedText?: string
): Promise<string> {
  const textContext = extractedText ? `\n\nHere is the exact text found on the design via OCR:\n"""\n${extractedText}\n"""\nPlease incorporate these specific text details into your analysis.` : '';
  const prompt = `You are an expert Etsy product analyst. Carefully analyze this ${category} design image and provide a detailed description covering:

1. **Visual Theme**: What is the overall theme? (e.g., floral birthday, safari adventure, princess fairy-tale, minimalist modern)
2. **Color Palette**: List the dominant and accent colors you see
3. **Typography**: Describe the font styles (script, serif, sans-serif, handwritten), sizes, and any notable text content visible
4. **Decorative Elements**: What illustrations, patterns, or graphic elements are present? (e.g., balloons, flowers, animals, geometric shapes, watercolor splashes)
5. **Layout Style**: How is the design composed? (centered, asymmetric, bordered, layered)
6. **Target Audience**: Who is this designed for? (e.g., kids 5-8, teen girls, adults, gender-neutral)
7. **Mood/Aesthetic**: What feeling does this design evoke? (playful, elegant, rustic, modern, whimsical)
8. **Occasion Details**: Any specific occasion details visible (age number, event type, season)

Write a rich, detailed 3-5 sentence description that captures the essence of this design. This description will be used to generate an accurate Etsy listing, so be specific about what you actually see — not generic assumptions.${textContext}

Return ONLY the description text, no headers or formatting.`;

  try {
    await throttledTextApiCall();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      temperature: 0.3,
    });

    return response.choices?.[0]?.message?.content?.trim() || `${category} digital design template`;
  } catch (error) {
    console.error("[GPT] Design analysis error:", error);
    return `${category} digital design template`;
  }
}

// ============================================
// 5. Etsy Listing Description Generation
// ============================================
export async function generateEtsyDescription(
  category: string,
  designPrompt: string,
  title?: string
): Promise<EtsyListingOutput> {
  const systemInstruction = `You are an elite Etsy seller copywriter who ONLY writes digital download listings.

You MUST follow this EXACT structure for every listing. Each section MUST start with its specific emoji header.
The listing must feel premium, polished, and conversion-optimized.

---START EXAMPLE---
🎯 Primary SEO Title (max 140 chars, use pipes "|" between keywords)

Birthday Invitation Template | Kids Party Invite | Editable Canva Template | Printable Birthday Card | Digital Download

✨ Additional SEO Titles (5 alternatives, each with a leading emoji)

🎈 Editable Birthday Party Invitation | Canva Template | Instant Download
🎂 Kids Birthday Invite | Printable Party Card | DIY Digital Template
🌈 Modern Birthday Invitation | Custom Editable Design | Digital Invite
🧁 Fun Birthday Party Template | Printable Canva Invite | Instant Access
🎉 Digital Birthday Card | Editable Invitation Template | Party Printable

📝 Listing Description

Celebrate your little one's special day with this beautifully designed birthday invitation template! 🎈✨ This professionally crafted, fully editable Canva template makes it effortless to create a stunning, personalized invitation — no design skills needed.

Simply customize the text with your child's name, age, party details, and send it digitally or print it at home. With vibrant colors, playful fonts, and charming illustrations, this template is perfect for creating memorable party invitations that your guests will love.

No design skills needed! Simply edit, download, and send 🎈

📦 What You Will Receive

📄 1 Editable Birthday Invitation Template
📱 Digital & Printable Versions
🎨 Fully customizable text (name, date, time, address, RSVP)
⬇️ Instant download access
🖥️ Works on desktop & mobile

⚙️ How It Works (Canva Editable)

1️⃣ Purchase the listing
2️⃣ Receive instant access link
3️⃣ Open the template in Canva (free account works!)
4️⃣ Edit text, colors, and details
5️⃣ Download as PDF, PNG, or JPEG
6️⃣ Print or send digitally 🎉

📐 Size and Format

📏 Standard Invitation Size: 5x7 inches
📁 File Formats:
PDF (best for printing)
PNG (high quality digital)
JPEG (easy sharing)

🖨️ Printing Recommendation

🖨️ Print at home or professionally
📄 Use high-quality cardstock (250–350 gsm)
🎨 Select "high quality" or "best" print settings
✂️ Trim using crop marks for perfect edges

💰 Pricing Strategy (Suggested)

💲 $3.99 – $6.99
👉 Competitive pricing for editable templates
👉 Great for increasing conversions and volume

⚠️ Copyright & Usage Notice

🚫 This template is for personal use only
🚫 You may NOT resell, share, or redistribute the file
✅ You can use it for your own event

🏷️ 13 Etsy Tags

birthday invite, kids birthday, editable invite, party invitation, birthday card, canva template, printable invite, kids party decor, birthday template, digital invite, party printable, birthday party, kids invite
---END EXAMPLE---

RULES:
1. The "description_body" MUST contain ALL 10 sections (🎯, ✨, 📝, 📦, ⚙️, 📐, 🖨️, 💰, ⚠️, 🏷️) with their exact emoji headers.
2. Each section MUST have real, substantive content — not placeholders or "[insert here]" text.
3. The 📝 Listing Description MUST have 2-3 full paragraphs PLUS a "✨ Perfect for:" bullet list.
4. The ✨ Additional SEO Titles MUST have exactly 5 titles, each starting with a relevant emoji.
5. The 🏷️ section MUST have exactly 13 comma-separated tags (max 20 chars each).
6. The 📦 section items MUST each start with a relevant emoji.
7. The ⚙️ section steps MUST use numbered emoji (1️⃣ 2️⃣ 3️⃣ etc.).
8. The ⚠️ section MUST use 🚫 for restrictions and ✅ for permissions.
9. Adapt the content to match the specific category, design description, and visual style of the design.
10. Use newline characters (\\n) to separate lines within the description_body string.
11. Make the description feel premium, professional, and conversion-optimized for Etsy buyers.`;

  const userMessage = `Generate a complete Etsy listing for:
Category: "${category}"
Design Description: ${designPrompt}
${title ? `Product Title Suggestion: ${title}` : ""}

IMPORTANT: The "Design Description" above contains a detailed analysis of the ACTUAL design. Your listing MUST reference the specific visual elements described — mention the actual colors, themes, decorative elements, typography styles, and mood visible in the design. Do NOT write a generic listing. Every section should feel tailored to THIS specific product.

Return a JSON object with these exact keys:
- "title": The Primary SEO Title (max 140 chars, pipe-separated keywords) — must reference the actual design theme/style
- "description_body": The COMPLETE formatted description following ALL 10 sections from the system instructions, using \\n for line breaks — must describe the actual design elements
- "features": Array of exactly 5 key product features — tailored to this specific design
- "usage_instructions": Step-by-step instructions (1-2 sentences)
- "download_details": What files are included (1-2 sentences)
- "tags": Array of exactly 13 Etsy SEO tags (max 20 chars each) — relevant to the actual design theme`;

  try {
    await throttledTextApiCall();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const text = response.choices?.[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const listing = JSON.parse(cleaned) as EtsyListingOutput;

    // Validate that the description_body contains key section markers
    const requiredMarkers = ["🎯", "✨", "📝", "📦", "⚙️", "📐", "🖨️", "💰", "⚠️", "🏷️"];
    const body = listing.description_body || "";
    const missingMarkers = requiredMarkers.filter((m) => !body.includes(m));

    if (missingMarkers.length > 0) {
      console.warn(`[GPT] Etsy description missing sections: ${missingMarkers.join(", ")}. Regenerating...`);
      // One retry if sections are missing
      await throttledTextApiCall();
      const retryResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          {
            role: "user",
            content: userMessage + "\n\nIMPORTANT: Your previous attempt was missing these sections: " + missingMarkers.join(", ") + ". You MUST include ALL 10 emoji-headed sections.",
          },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      const retryText = retryResponse.choices?.[0]?.message?.content || "";
      const retryCleaned = retryText.replace(/```json\n?|\n?```/g, "").trim();
      const retryListing = JSON.parse(retryCleaned) as EtsyListingOutput;

      return {
        title: retryListing.title?.slice(0, 140) || title || `${category} Digital Template`,
        description_body: retryListing.description_body || "",
        features: (retryListing.features || []).slice(0, 5),
        usage_instructions: retryListing.usage_instructions || "",
        download_details: retryListing.download_details || "",
        tags: (retryListing.tags || []).slice(0, 13).map((t: string) => t.slice(0, 20)),
      };
    }

    return {
      title: listing.title?.slice(0, 140) || title || `${category} Digital Template`,
      description_body: body,
      features: (listing.features || []).slice(0, 5),
      usage_instructions: listing.usage_instructions || "",
      download_details: listing.download_details || "",
      tags: (listing.tags || []).slice(0, 13).map((t: string) => t.slice(0, 20)),
    };
  } catch (error) {
    console.error("[GPT] Etsy description generation error:", error);
    return {
      title: title || `${category} Digital Template`,
      description_body: designPrompt,
      features: ["High-quality digital download", "Print-ready design", "Instant download"],
      usage_instructions: "Download the file after purchase. Open in your preferred editor to customize.",
      download_details: "You will receive high-resolution PNG files ready for printing or digital use.",
      tags: [category.toLowerCase().replace(/\s+/g, "")],
    };
  }
}
