import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { generateAllMockups, generateEtsyDescription, analyzeDesignImage } from "@/shared/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { generation_id, template_url, category_name, template_description, is_external, template_base64, template_mime_type, category_id, skip_description, used_scene_indices } = body;

    if (!category_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const actualDescription = template_description || `${category_name} poster/invitation design`;

    let actualGenerationId = generation_id;
    let resolvedTemplateUrl = template_url;

    if (is_external && !skip_description) {
      // Round 1 only: create generation record for external upload
      if (!template_base64 || !category_id) {
        return NextResponse.json({ error: "External uploads require template_base64 and category_id" }, { status: 400 });
      }

      // Create a dummy generation for the external upload
      const { data: newGen, error: genError } = await supabase.from("generations").insert({
        user_id: user.id,
        source_type: "manual",
        title: `External Design - ${category_name}`,
        prompt: actualDescription,
        resolution: "HD",
        aspect_ratio: "14:11",
        status: "completed",
        category_id: category_id,
        image_with_text_url: template_url || null,
      }).select().single();

      if (genError) {
        console.error("[GPT] Failed to create dummy generation:", genError);
        return NextResponse.json({ error: "Failed to initialize external upload" }, { status: 500 });
      }
      actualGenerationId = newGen.id;

      // Upload the external design as an asset
      const buf = Buffer.from(template_base64, "base64");
      const ts = Date.now();
      const path = `${user.id}/${actualGenerationId}/external-template-${ts}.png`;
      const ext = template_mime_type === "image/jpeg" ? "jpg" : template_mime_type === "image/webp" ? "webp" : "png";

      const { error: uploadError } = await supabase.storage
        .from("generations")
        .upload(path, buf, { contentType: template_mime_type || "image/png", upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("generations").getPublicUrl(path);
        resolvedTemplateUrl = urlData.publicUrl;
        
        // Update the generation with the uploaded URL
        await supabase.from("generations").update({
          image_with_text_url: urlData.publicUrl
        }).eq("id", actualGenerationId);

        // Save asset record
        await supabase.from("assets").insert({
          user_id: user.id,
          generation_id: actualGenerationId,
          asset_type: "template_with_text",
          file_name: `external-template-${ts}.${ext}`,
          file_path: path,
          file_type: "image",
          file_size: buf.length,
          mime_type: template_mime_type || "image/png",
        });
      }
    } else {
      // Library path OR rounds 2-3 of external uploads
      if (!generation_id) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Verify generation belongs to user and get template URL
      const { data: generation } = await supabase
        .from("generations").select("*").eq("id", generation_id).eq("user_id", user.id).single();
      if (!generation) return NextResponse.json({ error: "Generation not found" }, { status: 404 });
      
      // Use stored template URL if not provided (e.g., rounds 2-3 of external uploads)
      if (!resolvedTemplateUrl) {
        resolvedTemplateUrl = generation.image_with_text_url;
      }
    }

    try {
      const mockupResult = await generateAllMockups({
        category: category_name,
        templateDescription: actualDescription,
        templateUrl: resolvedTemplateUrl || "",
        templateBase64: (is_external && !skip_description) ? template_base64 : undefined,
        templateMimeType: (is_external && !skip_description) ? template_mime_type : undefined,
        isExternal: !!(is_external && !skip_description),
        count: 4,
        excludeSceneIndices: used_scene_indices || [],
      });

      const mockupImages = mockupResult.images;
      const newSceneIndices = mockupResult.usedSceneIndices;
      const extractedText = mockupResult.extractedText;

      // Upload each mockup
      const mockupAssets = [];
      const ts = Date.now();
      for (let i = 0; i < mockupImages.length; i++) {
        const buf = Buffer.from(mockupImages[i], "base64");
        const path = `${user.id}/${actualGenerationId}/mockup-gpt-${i + 1}-${ts}.png`;

        const { error: uploadError } = await supabase.storage
          .from("generations")
          .upload(path, buf, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error(`[GPT] Mockup ${i + 1} upload error:`, uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from("generations").getPublicUrl(path);

        mockupAssets.push({
          url: urlData.publicUrl,
          file_name: `mockup-gpt-${i + 1}-${ts}.png`,
          description: `GPT Mockup ${i + 1} for ${category_name}`,
        });

        // Save asset record
        await supabase.from("assets").insert({
          user_id: user.id,
          generation_id: actualGenerationId,
          asset_type: "mockup",
          file_name: `mockup-gpt-${i + 1}-${ts}.png`,
          file_path: path,
          file_type: "image",
          file_size: buf.length,
          mime_type: "image/png",
        });
      }

      // Create mockup set record
      const { data: mockupSet, error: msError } = await supabase
        .from("mockup_sets")
        .insert({
          generation_id: actualGenerationId,
          user_id: user.id,
          mockup_count: mockupAssets.length,
          consistency_status: "passed",
          mockup_assets_json: mockupAssets,
        })
        .select().single();

      if (msError) {
        console.error("[GPT] Mockup set insert error:", msError);
        return NextResponse.json({ error: "Failed to save mockup set" }, { status: 500 });
      }

      // Generate or fetch Etsy description (only on first generation round)
      let etsyDescription = null;

      if (!skip_description) {
        // Check if a description already exists for this generation (From Library)
        const { data: existingDesc } = await supabase
          .from("etsy_descriptions")
          .select("*")
          .eq("generation_id", actualGenerationId)
          .single();

        if (existingDesc) {
          etsyDescription = {
            title: existingDesc.title,
            description_body: existingDesc.description_body,
            features: existingDesc.features_json,
            usage_instructions: existingDesc.usage_instructions,
            download_details: existingDesc.download_details,
            tags: existingDesc.tags_json,
          };
        } else {
          // No existing description — analyze the design image first, then generate
          try {
            // Use vision analysis if we have the image data
            let richDescription = actualDescription;
            if (is_external && template_base64) {
              // External upload: analyze the uploaded image directly
              richDescription = await analyzeDesignImage(template_base64, template_mime_type || "image/png", category_name, extractedText);
            } else if (template_url) {
              // Library item without description: fetch and analyze the image
              try {
                const imgRes = await fetch(template_url);
                const arrayBuffer = await imgRes.arrayBuffer();
                const imgBase64 = Buffer.from(arrayBuffer).toString("base64");
                const imgMime = imgRes.headers.get("content-type") || "image/png";
                richDescription = await analyzeDesignImage(imgBase64, imgMime, category_name, extractedText);
              } catch (fetchErr) {
                console.warn("[GPT] Could not fetch template for analysis, using fallback description:", fetchErr);
              }
            }

            const etsyListing = await generateEtsyDescription(category_name, richDescription);
            etsyDescription = etsyListing;

            // Save to etsy_descriptions table
            await supabase.from("etsy_descriptions").insert({
              generation_id: actualGenerationId,
              user_id: user.id,
              title: etsyListing.title,
              description_body: etsyListing.description_body,
              features_json: etsyListing.features,
              usage_instructions: etsyListing.usage_instructions,
              download_details: etsyListing.download_details,
              tags_json: etsyListing.tags,
            });

            // Update generation record with Etsy details
            await supabase.from("generations").update({
              etsy_title: etsyListing.title,
              etsy_description: etsyListing.description_body,
              etsy_tags: etsyListing.tags,
            }).eq("id", actualGenerationId);
          } catch (descError) {
            console.error("[GPT] Etsy description generation failed (non-fatal):", descError);
          }
        }
      }

      // Log
      await supabase.from("ai_request_logs").insert({
        user_id: user.id, generation_id: actualGenerationId,
        request_type: "mockup_generation", status: "success",
      });

      return NextResponse.json({ success: true, mockup_set: mockupSet, etsy_description: etsyDescription, generation_id: actualGenerationId, used_scene_indices: newSceneIndices });
    } catch (aiError) {
      await supabase.from("ai_request_logs").insert({
        user_id: user.id, generation_id: actualGenerationId,
        request_type: "mockup_generation", status: "failed",
        error_message: aiError instanceof Error ? aiError.message : "Unknown error",
      });

      console.error("[GPT] Mockup generation error:", aiError);
      return NextResponse.json({ error: "Mockup generation failed", details: aiError instanceof Error ? aiError.message : "Unknown error" }, { status: 500 });
    }
  } catch (error) {
    console.error("[GPT] Mockups API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
