import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { generateAllMockups } from "@/shared/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { generation_id, template_url, category_name, template_description } = body;

    if (!generation_id || !template_url || !category_name || !template_description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify generation belongs to user
    const { data: generation } = await supabase
      .from("generations").select("*").eq("id", generation_id).eq("user_id", user.id).single();
    if (!generation) return NextResponse.json({ error: "Generation not found" }, { status: 404 });

    try {
      // Generate 8 mockups
      const mockupImages = await generateAllMockups({
        category: category_name,
        templateDescription: template_description,
        templateUrl: template_url,
        count: 8,
      });

      // Upload each mockup
      const mockupAssets = [];
      const ts = Date.now();
      for (let i = 0; i < mockupImages.length; i++) {
        const buf = Buffer.from(mockupImages[i], "base64");
        const path = `${user.id}/${generation_id}/mockup-${i + 1}-${ts}.png`;

        const { error: uploadError } = await supabase.storage
          .from("generations")
          .upload(path, buf, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error(`Mockup ${i + 1} upload error:`, uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from("generations").getPublicUrl(path);

        mockupAssets.push({
          url: urlData.publicUrl,
          file_name: `mockup-${i + 1}-${ts}.png`,
          description: `Mockup ${i + 1} for ${category_name}`,
        });

        // Save asset record
        await supabase.from("assets").insert({
          user_id: user.id,
          generation_id,
          asset_type: "mockup",
          file_name: `mockup-${i + 1}-${ts}.png`,
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
          generation_id,
          user_id: user.id,
          mockup_count: mockupAssets.length,
          consistency_status: "passed",
          mockup_assets_json: mockupAssets,
        })
        .select().single();

      if (msError) {
        console.error("Mockup set insert error:", msError);
        return NextResponse.json({ error: "Failed to save mockup set" }, { status: 500 });
      }

      // Log
      await supabase.from("ai_request_logs").insert({
        user_id: user.id, generation_id,
        request_type: "mockup_generation", status: "success",
      });

      return NextResponse.json({ success: true, mockup_set: mockupSet });
    } catch (aiError) {
      await supabase.from("ai_request_logs").insert({
        user_id: user.id, generation_id,
        request_type: "mockup_generation", status: "failed",
        error_message: aiError instanceof Error ? aiError.message : "Unknown error",
      });

      console.error("Mockup generation error:", aiError);
      return NextResponse.json({ error: "Mockup generation failed", details: aiError instanceof Error ? aiError.message : "Unknown error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Mockups API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
