"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { STYLE_OPTIONS } from "@/shared/lib/constants";
import type { Category } from "@/shared/types/global.types";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export function PresetDetailView() {
  const params = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const id = params.id as string;
      const [presetRes, catRes] = await Promise.all([
        supabase.from("presets").select("*").eq("id", id).single(),
        supabase.from("categories").select("*").eq("is_active", true).order("name"),
      ]);
      if (presetRes.data) {
        setName(presetRes.data.name);
        setShortDescription(presetRes.data.short_description || "");
        setSystemPrompt(presetRes.data.detailed_system_prompt || "");
        setCategoryId(presetRes.data.category_id || "");
        setStyleTags(presetRes.data.style_tags_json || []);
      }
      setCategories(catRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [params.id, supabase]);

  const addTag = () => {
    if (tagInput.trim() && !styleTags.includes(tagInput.trim())) {
      setStyleTags([...styleTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("presets").update({
      name,
      short_description: shortDescription,
      detailed_system_prompt: systemPrompt,
      category_id: categoryId || null,
      style_tags_json: styleTags,
    }).eq("id", params.id as string);
    router.push("/dashboard/presets");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-violet-200 dark:border-violet-500/20 border-t-violet-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/presets"><Button variant="outline" size="icon" className="border-border cursor-pointer"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Preset</h1>
          <p className="text-muted-foreground text-sm">Update your creative direction</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader><CardTitle className="text-foreground text-lg">Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/90">Preset Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-card border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/90">Short Description</Label>
              <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="bg-card border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/90">Default Category</Label>
              <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Any category">
                    {categoryId ? (categories.find(c => c.id === categoryId) ? `${categories.find(c => c.id === categoryId)?.icon || ""} ${categories.find(c => c.id === categoryId)?.name}`.trim() : categoryId) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">{categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} label={`${c.icon || ""} ${c.name}`.trim()} className="text-foreground/90">{c.icon} {c.name}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader><CardTitle className="text-foreground text-lg">Creative Direction</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/90">Detailed System Prompt *</Label>
              <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} required rows={6} className="bg-card border-border text-foreground resize-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/90">Style Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add a tag" className="bg-card border-border text-foreground" />
                <Button type="button" onClick={addTag} variant="outline" className="border-border cursor-pointer"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => !styleTags.includes(s) && setStyleTags([...styleTags, s])}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${styleTags.includes(s) ? "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400" : "bg-card border-border text-muted-foreground hover:border-violet-200 dark:border-violet-500/20"}`}>
                    {s}
                  </button>
                ))}
              </div>
              {styleTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">{styleTags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 gap-1">{tag}<button type="button" onClick={() => setStyleTags(styleTags.filter((_, idx) => idx !== i))} className="cursor-pointer"><X className="w-3 h-3" /></button></Badge>
                ))}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving || !name || !systemPrompt} className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-200 gap-2 cursor-pointer">
          {saving ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Save className="w-5 h-5" />Update Preset</>}
        </Button>
      </form>
    </div>
  );
}
