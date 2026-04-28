import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { CATEGORY_THEMES, MOCKUP_COUNT } from "./constants";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
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

  const parts: any[] = [{ text: prompt }];
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
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
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
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
function buildMockupPrompt(req: MockupRequest, index: number): string {
  const theme = CATEGORY_THEMES[req.category] || "";
  const scenes = [
    "displayed on an elegant flat lay with dried flowers and a wax seal stamp",
    "held in a woman's hand against a soft blurred background",
    "placed on a marble table with a pen and envelope beside it",
    "displayed in an ornate picture frame on a shelf",
    "laying on a wooden desk with a cup of coffee and greenery",
    "standing upright on a display easel with soft lighting",
    "arranged with matching envelopes and ribbon accessories",
    "shown as a digital mockup on a tablet screen in a lifestyle setting",
    "placed on a textured linen cloth with petals scattered around",
    "displayed alongside gift wrapping items and decorative tape",
  ];

  return `Create a professional Etsy listing mockup image for a "${req.category}" product.

The mockup must show this exact design: ${req.templateDescription}

Scene: ${scenes[index % scenes.length]}
Category Mood: ${theme}

CRITICAL RULES:
- The design shown MUST match the original template EXACTLY
- Same colors, typography, layout, and composition
- NO style drift — preserve 100% design integrity
- Professional lifestyle photography style
- High resolution, Etsy listing quality
- Realistic, premium mockup aesthetic
- Aspect ratio 14:11`;
}

export async function generateMockupImage(
  req: MockupRequest,
  index: number
): Promise<string> {
  const prompt = buildMockupPrompt(req, index);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
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
): Promise<string[]> {
  const count = req.count || MOCKUP_COUNT;
  const results: string[] = [];
  
  // Generate mockups sequentially to avoid rate limits
  for (let i = 0; i < count; i++) {
    try {
      const imageData = await generateMockupImage(req, i);
      results.push(imageData);
    } catch (error) {
      console.error(`Mockup ${i + 1} failed:`, error);
      // Continue generating remaining mockups
    }
  }
  
  if (results.length === 0) {
    throw new Error("All mockup generations failed");
  }
  
  return results;
}

// ============================================
// 5. Etsy Listing Description (BRD 8.6 Additional Output)
// ============================================
export async function generateEtsyDescription(
  category: string,
  designPrompt: string,
  title?: string
): Promise<EtsyListingOutput> {
  const prompt = `You are an expert Etsy seller copywriter specializing in digital downloads.

Generate a COMPLETE, high-quality, and highly consistent Etsy listing description for a "${category}" digital product.
You MUST format the "description_body" exactly like the example structure below, including the emojis, spacing, and tone. Do not deviate from this structure.

Design Description: ${designPrompt}
${title ? `Product Title Suggestion: ${title}` : ""}

### Target Description Structure Example:
✨ 
Primary SEO Title
[Generate an SEO optimized title]

🌿 
Additional SEO Titles
[Generate 5-6 alternate SEO titles]

💍 
Listing Description
[Generate 3 paragraphs of compelling, romantic, and descriptive copy detailing the design, aesthetic, and how it is fully editable in Canva]

📦 
What You Will Receive
✔ Editable [Product] Template (Canva)
✔ Instant access via Canva link (PDF download)
✔ High-resolution design (300 DPI)
✔ Fully customizable text
✔ Print-ready & digital sharing formats

⚙️ 
How It Works (Canva Editable)
Purchase the listing
Download the PDF with your Canva link
Open in Canva (free account required)
Edit your details easily
Download as PDF, PNG, or JPG
Print or share digitally

📐 
Size and Format
Size: 5 x 7 inches (vertical) [Adjust size based on category if needed]
High Resolution: 300 DPI
Formats: PDF, PNG, JPG
Compatible with home & professional printing

🖨️ 
Printing Recommendation
Use cardstock (250–350 gsm) for best quality
Matte or textured paper enhances the look
Print at home, local print shops, or online services
Can also be used as a digital file

💰 
Pricing Strategy (Suggested)
Editable Canva Template: $6.99 – $9.99
Premium Bundle (Editable + extra support): $9.99 – $12.99
👉 This design supports higher pricing due to its premium aesthetic.

⚠️ 
Copyright and Usage Notice
For personal use only
Not allowed for resale, sharing, or redistribution
You may print unlimited copies for your own event

🔖 
13 Etsy Tags
[List 13 comma separated tags]

Generate the following strictly as a JSON object:
{
  "title": "The exact Primary SEO Title generated above (max 140 chars)",
  "description_body": "The COMPLETE formatted text string matching the exact structure and emojis above, from '✨ Primary SEO Title' all the way down to the '13 Etsy Tags' section. Ensure all newlines are properly escaped as \\n so the JSON remains valid.",
  "features": ["Array of 5 key product features"],
  "usage_instructions": "Clear step-by-step instructions (short version)",
  "download_details": "What files are included (short version)",
  "tags": ["array", "of", "13", "relevant", "etsy", "seo", "tags", "max", "20", "chars", "each"]
}

CRITICAL: Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const listing = JSON.parse(cleaned) as EtsyListingOutput;

    return {
      title: listing.title?.slice(0, 140) || title || `${category} Digital Template`,
      description_body: listing.description_body || "",
      features: (listing.features || []).slice(0, 7),
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
// 6. Category Guardrail (BRD 2.5)
// ============================================
export function validateCategory(categoryName: string): boolean {
  const approved = Object.keys(CATEGORY_THEMES);
  return approved.some(c => c.toLowerCase() === categoryName.toLowerCase());
}

// ============================================
// 7. Prompt Suggestion (Helper)
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
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
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

