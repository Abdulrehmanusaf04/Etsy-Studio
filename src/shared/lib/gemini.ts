import { GoogleGenAI } from "@google/genai";
import { CATEGORY_THEMES, MOCKUP_COUNT } from "./constants";
import { MOCKUP_SCENE_POOL, DESIGN_PRESERVATION_RULES, selectRandomScenes, buildMockupPrompt, selectScenesForRound } from "./mockup-scenes";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ============================================
// Rate Limiting & Safety Utilities
// ============================================
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Minimum gap between any two Gemini API calls (ms)
const API_CALL_DELAY = 2000;
let lastApiCallTime = 0;

async function throttledApiCall() {
  const now = Date.now();
  const elapsed = now - lastApiCallTime;
  if (elapsed < API_CALL_DELAY) {
    await delay(API_CALL_DELAY - elapsed);
  }
  lastApiCallTime = Date.now();
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> {
  await throttledApiCall();
  const response = await fetch(url, options);

  if (response.status === 429 && retries > 0) {
    const waitTime = (3 - retries) * 5000; // 5s, 10s
    console.warn(`Rate limited (429). Retrying in ${waitTime / 1000}s...`);
    await delay(waitTime);
    return fetchWithRetry(url, options, retries - 1);
  }

  return response;
}

// ============================================
// Types
// ============================================
export interface TemplateRequest {
  category: string;
  prompt: string;
  style?: string;
  colorPalette?: string;
  typography?: string;
  presetPrompt?: string;
  referenceImages?: { base64: string; mimeType: string }[];
}

export interface AutoGenerateRequest {
  category: string;
  presetPrompt: string;
  presetName: string;
  styleTags?: string[];
}

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
// 1. Prompt Refinement Engine (BRD 6.2)
// ============================================
export async function refinePrompt(
  userPrompt: string,
  category: string,
  presetPrompt?: string
): Promise<string> {
  const theme = CATEGORY_THEMES[category] || "";
  const prompt = `You are an expert prompt engineer for Etsy digital product design generation.

Refine the following user prompt into a detailed, high-quality image generation prompt.

Category: ${category}
Theme Direction: ${theme}
User Prompt: "${userPrompt}"
${presetPrompt ? `Preset Style Direction: ${presetPrompt}` : ""}

Rules:
- Keep the output aligned with Etsy digital product use cases
- The refined prompt must describe a single, complete invitation/card template design
- Include specific details about layout, colors, typography, decorative elements
- Ensure the design is suitable for the "${category}" category
- Must be professional and print-ready quality
- Aspect ratio 14:11

Return ONLY the refined prompt text, nothing else.`;

  try {
    await throttledApiCall();
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || userPrompt;
  } catch {
    return userPrompt;
  }
}

// ============================================
// 2. Template Image Generation (BRD 8.4)
// ============================================
function buildTemplatePrompt(req: TemplateRequest, withText: boolean): string {
  const theme = CATEGORY_THEMES[req.category] || "";
  const textInstruction = withText
    ? `Include appropriate sample text for a "${req.category}" design. The text should be realistic, readable, and well-integrated into the design.`
    : "Do NOT include any text, words, letters, or numbers. Pure visual design only — decorative elements, patterns, and layout only.";

  return `Create a high-quality, professional Etsy digital product template design for "${req.category}".

Design Brief: ${req.prompt}

Category Theme: ${theme}
Style: ${req.style || "Professional, modern"}
Color Palette: ${req.colorPalette || "Category-appropriate, harmonious"}
Typography: ${req.typography || "Elegant, readable"}
Aspect Ratio: 14:11

${textInstruction}

${req.presetPrompt ? `Creative Direction: ${req.presetPrompt}` : ""}

Technical Requirements:
- High resolution, print-ready quality (300 DPI feel)
- Clean edges, no artifacts, no watermarks
- Professional composition and balanced layout
- Suitable for Etsy digital download listing
- Must look like a premium, ready-to-sell product`;
}

export async function generateTemplateImage(
  req: TemplateRequest,
  withText: boolean
): Promise<string> {
  const prompt = buildTemplatePrompt(req, withText);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: prompt }];
  if (req.referenceImages && req.referenceImages.length > 0) {
    for (const img of req.referenceImages) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }
  }

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${data.error?.message || response.statusText}`);
  }

  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data as string;
      }
    }
  }
  throw new Error("No image data in response");
}

// ============================================
// 3. Auto Generation (BRD 8.5) — No user prompt
// ============================================
export async function autoGeneratePrompt(req: AutoGenerateRequest): Promise<string> {
  const theme = CATEGORY_THEMES[req.category] || "";
  const prompt = `You are an expert Etsy digital product designer. Generate a detailed design prompt for creating a "${req.category}" template.

Preset: "${req.presetName}"
Preset Creative Direction: ${req.presetPrompt}
Category Theme: ${theme}
${req.styleTags?.length ? `Style Tags: ${req.styleTags.join(", ")}` : ""}

Create a specific, detailed prompt describing a complete ${req.category} design including:
- Layout and composition
- Color scheme
- Decorative elements
- Typography style
- Overall mood and aesthetic

The design must be Etsy-ready, professional, and aligned with the category theme.
Return ONLY the design prompt text.`;

  try {
    await throttledApiCall();
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch {
    return `Professional ${req.category} design with ${theme} aesthetic, following ${req.presetName} style direction.`;
  }
}

// ============================================
// 4. Mockup Generation (BRD 8.6)
// ============================================





/**
 * Extracts all visible text from a template image using Gemini Vision OCR.
 * Returns exact text as a ground truth reference for mockup generation.
 * Called ONCE per generation session — the result is injected into every mockup prompt.
 */
export async function extractTextFromTemplate(
  base64: string,
  mimeType: string
): Promise<string> {
  try {
    await throttledApiCall();
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64 } },
          {
            text: `You are a precision OCR system. Extract ALL visible text from this design/poster/invitation image.

CRITICAL RULES:
- Extract EVERY word, number, letter, symbol, and piece of text EXACTLY as it appears
- Preserve EXACT spelling, capitalization, punctuation, and special characters
- Do NOT correct any "mistakes" — reproduce text VERBATIM even if it seems wrong
- Do NOT interpret, translate, paraphrase, or modify any text
- Do NOT add commentary, labels, descriptions, or formatting
- List each distinct text block on its own line, in reading order (top to bottom, left to right)
- Include ALL text — headings, subheadings, body text, dates, times, addresses, small print, decorative text, everything

Return ONLY the raw extracted text, nothing else. No markdown, no bullet points, no quotes around the text.` }
        ]
      }],
      config: {
        temperature: 0,
      }
    });
    const result = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log(`[OCR] Extracted text (${result.length} chars): ${result.substring(0, 150)}...`);
    return result;
  } catch (error) {
    console.error("Text extraction (OCR) failed:", error);
    return "";
  }
}

export async function generateMockupImage(
  templateBase64: string,
  templateMimeType: string,
  scenePrompt: string,
  variationNumber: number,
  extractedText: string
): Promise<string> {
  const prompt = buildMockupPrompt(scenePrompt, variationNumber, extractedText);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  // IMAGE-FIRST ordering: put the image before the text prompt
  // This forces the model to deeply analyze the design before receiving instructions,
  // which dramatically improves text faithfulness and reduces re-rendering artifacts.
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    {
      inlineData: {
        mimeType: templateMimeType,
        data: templateBase64,
      },
    },
    { text: prompt },
  ];

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${data.error?.message || response.statusText}`);
  }

  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data as string;
      }
    }
  }
  throw new Error("No mockup image data in response");
}

export async function generateAllMockups(
  req: MockupRequest
): Promise<{ images: string[]; usedSceneIndices: number[]; extractedText: string }> {
  const count = req.count || MOCKUP_COUNT;
  const results: string[] = [];

  // ════════════════════════════════════════════════════════
  // STEP 0: Resolve the template image ONCE (avoid redundant fetches)
  // ════════════════════════════════════════════════════════
  let templateBase64 = req.templateBase64 || "";
  let templateMimeType = req.templateMimeType || "image/png";

  if (!templateBase64 && req.templateUrl) {
    try {
      console.log(`[Mockup Gen] Fetching template from URL...`);
      const imgRes = await fetch(req.templateUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      templateBase64 = Buffer.from(arrayBuffer).toString("base64");
      templateMimeType = imgRes.headers.get("content-type") || "image/png";
    } catch (e) {
      console.error("[Mockup Gen] Failed to fetch template image:", e);
      throw new Error("Could not fetch template image for mockup generation");
    }
  }

  if (!templateBase64) {
    throw new Error("No template image available for mockup generation");
  }

  // ════════════════════════════════════════════════════════
  // STEP 1: Extract ALL text from the template via OCR (done ONCE)
  // This extracted text is injected into EVERY mockup prompt as ground truth
  // ════════════════════════════════════════════════════════
  let extractedText = req.extractedText || "";
  if (!extractedText) {
    console.log(`[Mockup Gen] Extracting text from template via OCR...`);
    extractedText = await extractTextFromTemplate(templateBase64, templateMimeType);
  }

  // ════════════════════════════════════════════════════════
  // STEP 2: Select unique scenes for this batch
  // ════════════════════════════════════════════════════════
  const { scenes: selectedScenes, indices: selectedIndices } = selectScenesForRound(count, req.excludeSceneIndices);
  console.log(`[Mockup Gen] Pool: ${MOCKUP_SCENE_POOL.length}, Excluded: ${(req.excludeSceneIndices || []).length}, Selected: [${selectedIndices.join(', ')}]`);

  // ════════════════════════════════════════════════════════
  // STEP 3: Generate mockups sequentially with text ground truth
  // ════════════════════════════════════════════════════════
  for (let i = 0; i < count; i++) {
    try {
      console.log(`[Mockup Gen] Generating mockup ${i + 1}/${count} (scene index: ${selectedIndices[i]})...`);
      const imageData = await generateMockupImage(
        templateBase64,
        templateMimeType,
        selectedScenes[i],
        i + 1,
        extractedText
      );
      results.push(imageData);
    } catch (error) {
      console.error(`Mockup ${i + 1} failed:`, error);
      // Continue generating remaining mockups
    }
  }

  if (results.length === 0) {
    throw new Error("All mockup generations failed");
  }

  console.log(`[Mockup Gen] Successfully generated ${results.length}/${count} mockups`);
  return { images: results, usedSceneIndices: selectedIndices, extractedText };
}

// ============================================
// 5. Design Image Analysis (Vision-based)
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const parts = [
      { text: prompt },
      { inlineData: { mimeType, data: base64 } }
    ];

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API Error");

    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || `${category} digital design template`;
  } catch (error) {
    console.error("Design analysis error:", error);
    return `${category} digital design template`;
  }
}

// ============================================
// 6. Etsy Listing Description (BRD 8.6 Additional Output)
// ============================================
export async function generateEtsyDescription(
  category: string,
  designPrompt: string,
  title?: string
): Promise<EtsyListingOutput> {
  const systemInstruction = `You are an elite Etsy seller copywriter who ONLY writes digital download listings.

Your output MUST follow this EXACT structure for the "description_body" field. Every section header MUST use the exact emoji shown. Every section MUST be present. Do NOT skip, merge, abbreviate, or reorder any section.

Here is a CONCRETE EXAMPLE of what a perfect "description_body" looks like for a Birthday Invitation:

---BEGIN EXAMPLE---
🎯 Primary SEO Title

🎉 Editable 8th Birthday Invitation Template | Kids Birthday Party Invite | Printable Birthday Card | Canva Editable | Instant Download

✨ Additional SEO Titles

🎈 Colorful Kids Birthday Invitation Template Editable
🎂 8th Birthday Party Invite Printable & Digital Download
🎁 Cute Birthday Invitation Canva Template for Kids Party
🎊 Editable Birthday Invite Card Instant Download Canva
🎉 Kids Party Invitation Printable Birthday Invite Template

📝 Listing Description

Celebrate your child's special day with this adorable and colorful editable birthday invitation template 🎉

This beautifully designed invite is perfect for kids' birthday parties and features a playful watercolor theme with cakes, balloons, gifts, and festive decorations. You can easily personalize all the details in minutes and create a stunning invitation for both digital sharing and printing.

✨ Perfect for:
Kids birthday parties
Girls or boys birthday celebrations
Printable or digital invitations
Last-minute party planning

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const contents = [
      { role: "user", parts: [{ text: systemInstruction }] },
      { role: "model", parts: [{ text: "Understood. I will generate Etsy listing descriptions that strictly follow all 10 sections with the exact emoji headers (🎯, ✨, 📝, 📦, ⚙️, 📐, 🖨️, 💰, ⚠️, 🏷️), emoji-rich content, numbered steps with emoji numbers, and proper formatting. I will return valid JSON only." }] },
      { role: "user", parts: [{ text: userMessage }] }
    ];

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API Error");

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const listing = JSON.parse(cleaned) as EtsyListingOutput;

    // Validate that the description_body contains key section markers
    const requiredMarkers = ["🎯", "✨", "📝", "📦", "⚙️", "📐", "🖨️", "💰", "⚠️", "🏷️"];
    const body = listing.description_body || "";
    const missingMarkers = requiredMarkers.filter((m) => !body.includes(m));

    if (missingMarkers.length > 0) {
      console.warn(`Etsy description missing sections: ${missingMarkers.join(", ")}. Regenerating...`);
      // One retry if sections are missing
      const retryResponse = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemInstruction }] },
              { role: "model", parts: [{ text: "Understood. I will generate Etsy listing descriptions that strictly follow all 10 sections with the exact emoji headers (🎯, ✨, 📝, 📦, ⚙️, 📐, 🖨️, 💰, ⚠️, 🏷️), emoji-rich content, numbered steps with emoji numbers, and proper formatting. I will return valid JSON only." }] },
              { role: "user", parts: [{ text: userMessage + "\n\nIMPORTANT: Your previous attempt was missing these sections: " + missingMarkers.join(", ") + ". You MUST include ALL 10 emoji-headed sections." }] }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.5,
            },
          }),
        }
      );

      const retryData = await retryResponse.json();
      const retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
    console.error("Etsy description generation error:", error);
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

// ============================================
// 7. Category Guardrail (BRD 2.5)
// ============================================
export function validateCategory(categoryName: string): boolean {
  const approved = Object.keys(CATEGORY_THEMES);
  return approved.some(c => c.toLowerCase() === categoryName.toLowerCase());
}

// ============================================
// 8. Prompt Suggestion (Helper)
// ============================================
export async function suggestPrompt(category: string): Promise<string> {
  const theme = CATEGORY_THEMES[category] || "";
  const styles = ["minimal", "boho", "elegant", "dark academia", "vintage", "modern", "rustic", "whimsical", "luxury", "botanical", "watercolor", "geometric", "art deco", "cottagecore"];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];

  const prompt = `You are an expert Etsy digital product designer. 
Generate a short, creative 2-3 line prompt for generating a "${category}" design template.
The prompt should be highly descriptive, focusing on a specific style, color palette, and mood.
Make it sound like a perfect, ready-to-use user prompt for an AI image generator.
Ensure extreme variety. For this specific request, heavily incorporate a "${randomStyle}" aesthetic.
Theme Direction: ${theme}
Random Entropy: ${Date.now()}-${Math.random()}

Return ONLY the prompt text, with no quotes or extra formatting.`;

  try {
    await throttledApiCall();
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 1.0,
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch (error) {
    console.error("Suggest prompt error:", error);
    return `Beautiful and professional ${category} design featuring ${theme} elements.`;
  }
}

