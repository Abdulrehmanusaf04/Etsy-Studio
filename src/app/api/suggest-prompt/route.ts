import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { suggestPrompt } from "@/shared/lib/gemini";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json({ error: "Missing categoryId" }, { status: 400 });
    }

    const { data: category, error: catError } = await supabase
      .from("categories")
      .select("name")
      .eq("id", categoryId)
      .single();

    if (catError || !category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const suggestion = await suggestPrompt(category.name);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Suggest prompt API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
