import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import {
  generateTemplateImage,
  generateEtsyDescription,
  refinePrompt,
  validateCategory,
} from "@/shared/lib/gemini";
import { APPROVED_CATEGORIES } from "@/shared/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { category_id, prompt, preset_id, source_type = "manual", reference_images } = body;

    if (!category_id || !prompt) {
      return NextResponse.json({ error: "Missing required fields: category_id, prompt" }, { status: 400 });
    }

    // Validate category
    const { data: category, error: catError } = await supabase
      .from("categories").select("*").eq("id", category_id).single();
    if (catError || !category) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    if (!APPROVED_CATEGORIES.includes(category.name as (typeof APPROVED_CATEGORIES)[number])) {
      return NextResponse.json({ error: `Category "${category.name}" is not approved` }, { status: 400 });
    }

    // Get preset if provided
    let presetPrompt = "";
    if (preset_id) {
      const { data: preset } = await supabase.from("presets").select("*").eq("id", preset_id).single();
      if (preset?.detailed_system_prompt) presetPrompt = preset.detailed_system_prompt;
    }

    // Step 1: Refine prompt
    const refinedPrompt = await refinePrompt(prompt, category.name, presetPrompt);

    // Create generation record
    const { data: generation, error: genError } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        category_id,
        preset_id: preset_id || null,
        source_type,
        title: prompt.slice(0, 100),
        description: prompt,
        prompt: refinedPrompt,
        original_prompt: prompt,
        refined_prompt: refinedPrompt,
        status: "processing",
        aspect_ratio: "14:11",
        resolution: "2K",
      })
      .select().single();

    if (genError || !generation) {
      console.error("Generation insert error:", genError);
      return NextResponse.json({ error: "Failed to create generation record" }, { status: 500 });
    }

    try {
      // Step 2: Generate templates + Etsy listing in parallel
      const templateReq = { category: category.name, prompt: refinedPrompt, presetPrompt, referenceImages: reference_images };
      const [imageWithTextBase64, imageWithoutTextBase64, etsyListing] = await Promise.all([
        generateTemplateImage(templateReq, true),
        generateTemplateImage(templateReq, false),
        generateEtsyDescription(category.name, refinedPrompt, prompt),
      ]);

      // Upload images
      const ts = Date.now();
      const withTextPath = `${user.id}/${generation.id}/with-text-${ts}.png`;
      const withoutTextPath = `${user.id}/${generation.id}/without-text-${ts}.png`;
      const withTextBuf = Buffer.from(imageWithTextBase64, "base64");
      const withoutTextBuf = Buffer.from(imageWithoutTextBase64, "base64");

      const [up1, up2] = await Promise.all([
        supabase.storage.from("generations").upload(withTextPath, withTextBuf, { contentType: "image/png", upsert: true }),
        supabase.storage.from("generations").upload(withoutTextPath, withoutTextBuf, { contentType: "image/png", upsert: true }),
      ]);
      if (up1.error || up2.error) throw new Error(`Upload failed: ${up1.error?.message || up2.error?.message}`);

      const { data: url1 } = supabase.storage.from("generations").getPublicUrl(withTextPath);
      const { data: url2 } = supabase.storage.from("generations").getPublicUrl(withoutTextPath);

      // Update generation
      const { data: updated, error: updateError } = await supabase
        .from("generations")
        .update({
          status: "completed",
          image_with_text_url: url1.publicUrl,
          image_without_text_url: url2.publicUrl,
          thumbnail_url: url1.publicUrl,
          etsy_title: etsyListing.title,
          etsy_description: etsyListing.description_body,
          etsy_tags: etsyListing.tags,
        })
        .eq("id", generation.id).select("*, category:categories(*)").single();

      if (updateError) throw new Error(`Update failed: ${updateError.message}`);

      // Save assets
      await supabase.from("assets").insert([
        { user_id: user.id, generation_id: generation.id, asset_type: "template_with_text", file_name: `with-text-${ts}.png`, file_path: withTextPath, file_type: "image", file_size: withTextBuf.length, mime_type: "image/png" },
        { user_id: user.id, generation_id: generation.id, asset_type: "template_without_text", file_name: `without-text-${ts}.png`, file_path: withoutTextPath, file_type: "image", file_size: withoutTextBuf.length, mime_type: "image/png" },
      ]);

      // Save structured Etsy description
      await supabase.from("etsy_descriptions").insert({
        generation_id: generation.id,
        user_id: user.id,
        title: etsyListing.title,
        description_body: etsyListing.description_body,
        features_json: etsyListing.features,
        usage_instructions: etsyListing.usage_instructions,
        download_details: etsyListing.download_details,
        tags_json: etsyListing.tags,
      });

      // Log AI request
      await supabase.from("ai_request_logs").insert({
        user_id: user.id, generation_id: generation.id,
        request_type: "template_generation", status: "success",
      });

      return NextResponse.json({ success: true, generation: updated });
    } catch (aiError) {
      await supabase.from("generations").update({
        status: "failed",
        error_message: aiError instanceof Error ? aiError.message : "AI generation failed",
      }).eq("id", generation.id);

      await supabase.from("ai_request_logs").insert({
        user_id: user.id, generation_id: generation.id,
        request_type: "template_generation", status: "failed",
        error_message: aiError instanceof Error ? aiError.message : "Unknown error",
      });

      console.error("AI generation error:", aiError);
      return NextResponse.json({ error: "AI generation failed", details: aiError instanceof Error ? aiError.message : "Unknown error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
