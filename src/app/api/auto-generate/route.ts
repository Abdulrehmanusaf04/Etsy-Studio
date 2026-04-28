import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { generateTemplateImage, generateEtsyDescription, autoGeneratePrompt } from "@/shared/lib/gemini";
import { APPROVED_CATEGORIES } from "@/shared/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { category_id, preset_id } = body;

    if (!category_id || !preset_id) {
      return NextResponse.json({ error: "Both category_id and preset_id are required for auto generation" }, { status: 400 });
    }

    // Validate category
    const { data: category } = await supabase.from("categories").select("*").eq("id", category_id).single();
    if (!category) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    if (!APPROVED_CATEGORIES.includes(category.name as (typeof APPROVED_CATEGORIES)[number])) {
      return NextResponse.json({ error: `Category "${category.name}" is not approved` }, { status: 400 });
    }

    // Get preset
    const { data: preset } = await supabase.from("presets").select("*").eq("id", preset_id).single();
    if (!preset) return NextResponse.json({ error: "Invalid preset" }, { status: 400 });

    // Step 1: Auto-generate a prompt from preset
    const autoPrompt = await autoGeneratePrompt({
      category: category.name,
      presetPrompt: preset.detailed_system_prompt || preset.name,
      presetName: preset.name,
      styleTags: preset.style_tags_json || [],
    });

    // Create generation record
    const { data: generation, error: genError } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        category_id,
        preset_id,
        source_type: "auto",
        title: `Auto: ${preset.name} – ${category.name}`,
        description: autoPrompt,
        prompt: autoPrompt,
        original_prompt: null,
        refined_prompt: autoPrompt,
        status: "processing",
        aspect_ratio: "14:11",
        resolution: "2K",
      })
      .select().single();

    if (genError || !generation) {
      return NextResponse.json({ error: "Failed to create generation" }, { status: 500 });
    }

    try {
      // Step 2: Generate templates + description
      const templateReq = { category: category.name, prompt: autoPrompt, presetPrompt: preset.detailed_system_prompt || "" };
      const [imageWithTextBase64, imageWithoutTextBase64, etsyListing] = await Promise.all([
        generateTemplateImage(templateReq, true),
        generateTemplateImage(templateReq, false),
        generateEtsyDescription(category.name, autoPrompt),
      ]);

      // Upload
      const ts = Date.now();
      const p1 = `${user.id}/${generation.id}/with-text-${ts}.png`;
      const p2 = `${user.id}/${generation.id}/without-text-${ts}.png`;
      const b1 = Buffer.from(imageWithTextBase64, "base64");
      const b2 = Buffer.from(imageWithoutTextBase64, "base64");

      await Promise.all([
        supabase.storage.from("generations").upload(p1, b1, { contentType: "image/png", upsert: true }),
        supabase.storage.from("generations").upload(p2, b2, { contentType: "image/png", upsert: true }),
      ]);

      const { data: url1 } = supabase.storage.from("generations").getPublicUrl(p1);
      const { data: url2 } = supabase.storage.from("generations").getPublicUrl(p2);

      const { data: updated } = await supabase.from("generations").update({
        status: "completed",
        image_with_text_url: url1.publicUrl,
        image_without_text_url: url2.publicUrl,
        thumbnail_url: url1.publicUrl,
        etsy_title: etsyListing.title,
        etsy_description: etsyListing.description_body,
        etsy_tags: etsyListing.tags,
      }).eq("id", generation.id).select("*, category:categories(*)").single();

      // Save assets
      await supabase.from("assets").insert([
        { user_id: user.id, generation_id: generation.id, asset_type: "template_with_text", file_name: `with-text-${ts}.png`, file_path: p1, file_type: "image", file_size: b1.length, mime_type: "image/png" },
        { user_id: user.id, generation_id: generation.id, asset_type: "template_without_text", file_name: `without-text-${ts}.png`, file_path: p2, file_type: "image", file_size: b2.length, mime_type: "image/png" },
      ]);

      // Save Etsy description
      await supabase.from("etsy_descriptions").insert({
        generation_id: generation.id, user_id: user.id,
        title: etsyListing.title, description_body: etsyListing.description_body,
        features_json: etsyListing.features, usage_instructions: etsyListing.usage_instructions,
        download_details: etsyListing.download_details, tags_json: etsyListing.tags,
      });

      // Log
      await supabase.from("ai_request_logs").insert({
        user_id: user.id, generation_id: generation.id,
        request_type: "auto_generation", status: "success",
      });

      return NextResponse.json({ success: true, generation: updated });
    } catch (aiError) {
      await supabase.from("generations").update({
        status: "failed",
        error_message: aiError instanceof Error ? aiError.message : "Auto generation failed",
      }).eq("id", generation.id);

      await supabase.from("ai_request_logs").insert({
        user_id: user.id, generation_id: generation.id,
        request_type: "auto_generation", status: "failed",
        error_message: aiError instanceof Error ? aiError.message : "Unknown error",
      });

      return NextResponse.json({ error: "Auto generation failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Auto-generate API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
