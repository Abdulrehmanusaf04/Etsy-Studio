"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Progress } from "@/shared/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { Images, Sparkles, CheckCircle2, AlertCircle, Download, ImageIcon, Upload, Library, X, FileText, Copy, Cpu, Zap } from "lucide-react";
import type { Generation, MockupSet, Category } from "@/shared/types/global.types";

export function MockupsGeneratorView() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedGenId, setSelectedGenId] = useState("");
  const [activeTab, setActiveTab] = useState("library");
  const [selectedModel, setSelectedModel] = useState<"gemini" | "gpt">("gemini");
  
  // External upload state
  const [externalImage, setExternalImage] = useState<File | null>(null);
  const [externalImagePreview, setExternalImagePreview] = useState<string | null>(null);
  const [externalCategory, setExternalCategory] = useState("");
  const [externalDescription, setExternalDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [mockupResult, setMockupResult] = useState<MockupSet | null>(null);
  const [allMockups, setAllMockups] = useState<{ url: string; file_name: string; description: string }[]>([]);
  const [generationRound, setGenerationRound] = useState(0);
  const [lastRequestBody, setLastRequestBody] = useState<any>(null);
  const [usedSceneIndices, setUsedSceneIndices] = useState<number[]>([]);
  const [etsyDescription, setEtsyDescription] = useState<{ title: string; description_body: string; tags: string[] } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const supabase = createClient();
  const MAX_ROUNDS = 3;

  useEffect(() => {
    const fetchData = async () => {
      const [genRes, catRes] = await Promise.all([
        supabase
          .from("generations")
          .select("*, category:categories(*)")
          .eq("status", "completed")
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("name")
      ]);
      setGenerations(genRes.data || []);
      setCategories(catRes.data || []);
    };
    fetchData();
  }, [supabase]);

  const [isHydrated, setIsHydrated] = useState(false);

  // Derive the API endpoint from the selected model
  const mockupApiUrl = selectedModel === "gpt" ? "/api/mockups-gpt" : "/api/mockups";

  // Session Storage Persistence
  useEffect(() => {
    try {
      const savedResult = sessionStorage.getItem("etsyStudio_mockups_result");
      const savedDesc = sessionStorage.getItem("etsyStudio_mockups_desc");
      const savedAll = sessionStorage.getItem("etsyStudio_mockups_all");
      const savedRound = sessionStorage.getItem("etsyStudio_mockups_round");
      const savedBody = sessionStorage.getItem("etsyStudio_mockups_body");
      const savedScenes = sessionStorage.getItem("etsyStudio_mockups_scenes");
      const savedModel = sessionStorage.getItem("etsyStudio_mockups_model");
      if (savedResult) setMockupResult(JSON.parse(savedResult));
      if (savedDesc) setEtsyDescription(JSON.parse(savedDesc));
      if (savedAll) setAllMockups(JSON.parse(savedAll));
      if (savedRound) setGenerationRound(JSON.parse(savedRound));
      if (savedModel === "gemini" || savedModel === "gpt") setSelectedModel(savedModel);
      if (savedBody) setLastRequestBody(JSON.parse(savedBody));
      if (savedScenes) setUsedSceneIndices(JSON.parse(savedScenes));
    } catch (e) {
      console.warn("Failed to parse session storage", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (mockupResult) {
      sessionStorage.setItem("etsyStudio_mockups_result", JSON.stringify(mockupResult));
    } else {
      sessionStorage.removeItem("etsyStudio_mockups_result");
    }
  }, [mockupResult, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (etsyDescription) {
      sessionStorage.setItem("etsyStudio_mockups_desc", JSON.stringify(etsyDescription));
    } else {
      sessionStorage.removeItem("etsyStudio_mockups_desc");
    }
  }, [etsyDescription, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (allMockups.length > 0) {
      sessionStorage.setItem("etsyStudio_mockups_all", JSON.stringify(allMockups));
    } else {
      sessionStorage.removeItem("etsyStudio_mockups_all");
    }
  }, [allMockups, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (generationRound > 0) {
      sessionStorage.setItem("etsyStudio_mockups_round", JSON.stringify(generationRound));
    } else {
      sessionStorage.removeItem("etsyStudio_mockups_round");
    }
  }, [generationRound, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (lastRequestBody) {
      sessionStorage.setItem("etsyStudio_mockups_body", JSON.stringify(lastRequestBody));
    } else {
      sessionStorage.removeItem("etsyStudio_mockups_body");
    }
  }, [lastRequestBody, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (usedSceneIndices.length > 0) {
      sessionStorage.setItem("etsyStudio_mockups_scenes", JSON.stringify(usedSceneIndices));
    } else {
      sessionStorage.removeItem("etsyStudio_mockups_scenes");
    }
  }, [usedSceneIndices, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem("etsyStudio_mockups_model", selectedModel);
  }, [selectedModel, isHydrated]);

  const handleClearSession = () => {
    setMockupResult(null);
    setEtsyDescription(null);
    setAllMockups([]);
    setGenerationRound(0);
    setLastRequestBody(null);
    setUsedSceneIndices([]);
    setExternalImage(null);
    setExternalImagePreview(null);
    setSelectedGenId("");
    setError("");
    sessionStorage.removeItem("etsyStudio_mockups_result");
    sessionStorage.removeItem("etsyStudio_mockups_desc");
    sessionStorage.removeItem("etsyStudio_mockups_all");
    sessionStorage.removeItem("etsyStudio_mockups_round");
    sessionStorage.removeItem("etsyStudio_mockups_body");
    sessionStorage.removeItem("etsyStudio_mockups_scenes");
    sessionStorage.removeItem("etsyStudio_mockups_model");
  };

  const selectedGen = generations.find(g => g.id === selectedGenId);

  const handleGenerateMockups = async () => {
    if (activeTab === "library" && !selectedGen) return;
    if (activeTab === "upload" && (!externalImage || !externalCategory)) return;

    setLoading(true); setError(""); setProgress(0);

    const stages = Array.from({ length: 4 }, (_, i) => ({
      pct: Math.round(((i + 1) / 4) * 90),
      text: `Generating mockup ${i + 1} of 4...`,
    }));
    let si = 0;
    const iv = setInterval(() => { if (si < stages.length) { setProgress(stages[si].pct); setProgressText(stages[si].text); si++; } }, 5000);

    try {
      let body: any = {};
      
      if (activeTab === "library" && selectedGen) {
        body = {
          generation_id: selectedGen.id,
          template_url: selectedGen.image_with_text_url,
          category_name: selectedGen.category?.name || "",
          template_description: selectedGen.refined_prompt || selectedGen.prompt,
        };
      } else if (activeTab === "upload" && externalImage) {
        setProgressText("Processing external image...");
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(externalImage);
        });
        const match = base64Data.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/);
        if (!match) throw new Error("Invalid image format");

        const category = categories.find(c => c.id === externalCategory);

        body = {
          is_external: true,
          template_base64: match[2],
          template_mime_type: match[1],
          category_name: category?.name || "",
          category_id: externalCategory,
          template_description: externalDescription,
        };
      }

      setLastRequestBody(body);

      const res = await fetch(mockupApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      clearInterval(iv);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mockup generation failed");
      
      const newMockups = data.mockup_set?.mockup_assets_json || [];
      setProgress(100); setProgressText("All mockups & description generated!");
      setMockupResult(data.mockup_set);
      setAllMockups(newMockups);
      setGenerationRound(1);
      if (data.etsy_description) setEtsyDescription(data.etsy_description);
      
      // Track used scene indices for cross-round deduplication
      if (data.used_scene_indices) {
        setUsedSceneIndices(data.used_scene_indices);
      }
      
      // Cache normalized body for rounds 2-3 using the returned generation_id
      if (data.generation_id) {
        setLastRequestBody({
          generation_id: data.generation_id,
          template_url: body.template_url || "",
          category_name: body.category_name,
          template_description: body.template_description,
        });
      }
    } catch (err) { clearInterval(iv); setError(err instanceof Error ? err.message : "An error occurred"); setProgress(0); }
    finally { setLoading(false); }
  };

  const handleGenerateMore = async () => {
    if (!lastRequestBody || generationRound >= MAX_ROUNDS) return;

    setLoading(true); setError(""); setProgress(0);

    const roundNum = generationRound + 1;
    const stages = Array.from({ length: 4 }, (_, i) => ({
      pct: Math.round(((i + 1) / 4) * 90),
      text: `Round ${roundNum} — Generating mockup ${i + 1} of 4...`,
    }));
    let si = 0;
    const iv = setInterval(() => { if (si < stages.length) { setProgress(stages[si].pct); setProgressText(stages[si].text); si++; } }, 5000);

    try {
      const body = { ...lastRequestBody, skip_description: true, used_scene_indices: usedSceneIndices };

      const res = await fetch(mockupApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      clearInterval(iv);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mockup generation failed");

      const newMockups = data.mockup_set?.mockup_assets_json || [];
      setProgress(100); setProgressText(`Round ${roundNum} complete!`);
      setMockupResult(data.mockup_set);
      setAllMockups(prev => [...prev, ...newMockups]);
      setGenerationRound(roundNum);
      
      // Accumulate used scene indices for next round
      if (data.used_scene_indices) {
        setUsedSceneIndices(prev => [...prev, ...data.used_scene_indices]);
      }
    } catch (err) { clearInterval(iv); setError(err instanceof Error ? err.message : "An error occurred"); setProgress(0); }
    finally { setLoading(false); }
  };

  const handleDownload = async (url: string, filename: string) => {
    const r = await fetch(url); const b = await r.blob();
    const l = document.createElement("a"); l.href = URL.createObjectURL(b); l.download = filename; l.click(); URL.revokeObjectURL(l.href);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200">
            <Images className="w-5 h-5 text-white" />
          </div>
          Mockup Generator
        </h1>
        <p className="text-muted-foreground mt-2">Generate 4 Etsy-ready mockups that perfectly match your template</p>
      </div>

      {/* Model Selection Toggle */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground font-medium">AI Model:</Label>
        <div className="inline-flex rounded-lg border border-border bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => setSelectedModel("gemini")}
            disabled={loading || generationRound > 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              selectedModel === "gemini"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            } ${(loading || generationRound > 0) ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Sparkles className="w-4 h-4" />
            Gemini
          </button>
          <button
            type="button"
            onClick={() => setSelectedModel("gpt")}
            disabled={loading || generationRound > 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              selectedModel === "gpt"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            } ${(loading || generationRound > 0) ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Zap className="w-4 h-4" />
            GPT
          </button>
        </div>
        {generationRound > 0 && (
          <span className="text-xs text-muted-foreground">(Start a new session to switch models)</span>
        )}
      </div>

      {generationRound === 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="library" className="data-[state=active]:bg-card data-[state=active]:text-amber-600 dark:text-amber-400 gap-2"><Library className="w-4 h-4" />From Library</TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-card data-[state=active]:text-amber-600 dark:text-amber-400 gap-2"><Upload className="w-4 h-4" />Upload Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader><CardTitle className="text-foreground text-lg">Select a Template</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground/90">Completed Generation *</Label>
                  <Select value={selectedGenId} onValueChange={(v) => v && setSelectedGenId(v)}>
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue placeholder="Choose a completed template">
                        {selectedGenId ? (generations.find(g => g.id === selectedGenId) ? `${generations.find(g => g.id === selectedGenId)?.category?.icon || ""} ${generations.find(g => g.id === selectedGenId)?.title}`.trim() : selectedGenId) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {generations.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No completed generations yet</p> :
                        generations.map((g) => <SelectItem key={g.id} value={g.id} label={`${g.category?.icon || ""} ${g.title}`.trim()} className="text-foreground/90">{g.category?.icon} {g.title}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>
                {selectedGen && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted border border-border">
                    {selectedGen.thumbnail_url ? (
                      <img src={selectedGen.thumbnail_url} alt="" className="w-20 h-20 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{selectedGen.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedGen.category?.name} · {selectedGen.source_type}</p>
                    </div>
                  </div>
                )}
                <Button onClick={handleGenerateMockups} disabled={loading || !selectedGenId} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-200 gap-2 cursor-pointer">
                  {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating Mockups...</> : <><Images className="w-5 h-5" />Generate 4 Mockups</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Upload Birthday Poster</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Upload your birthday invitation or poster design — the AI will analyze its colors, theme, and style to create matching mockup environments.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      <p className="font-medium mb-1">How it works</p>
                      <ul className="space-y-0.5 text-amber-600/80 dark:text-amber-400/80">
                        <li>• The AI carefully analyzes your poster&apos;s colors, artwork, and mood</li>
                        <li>• Props, backgrounds, and lighting are automatically matched to your design</li>
                        <li>• 4 unique scenes: premium flatlay, party table, outdoor display, and cozy indoor setup</li>
                        <li>• Your design is never altered — pixel-perfect preservation guaranteed</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/90">Birthday Poster Image *</Label>
                  {externalImagePreview ? (
                    <div className="relative w-48 aspect-[14/11] rounded-lg border border-border overflow-hidden bg-muted">
                      <img src={externalImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setExternalImage(null); setExternalImagePreview(null); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="external-dropzone" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground hover:text-foreground transition-colors group">
                        <Upload className="w-8 h-8 mb-3 opacity-60 group-hover:opacity-100" />
                        <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> your birthday poster</p>
                        <p className="text-xs opacity-80">PNG, JPG or WebP (Max 5MB)</p>
                      </div>
                      <input id="external-dropzone" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          if (file.size > 5 * 1024 * 1024) { setError("Image exceeds 5MB limit."); return; }
                          setError("");
                          setExternalImage(file);
                          setExternalImagePreview(URL.createObjectURL(file));
                        }
                      }} />
                    </label>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/90">Category *</Label>
                  <Select value={externalCategory} onValueChange={(v) => v && setExternalCategory(v)}>
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue placeholder="Select a category">
                        {externalCategory ? (categories.find(c => c.id === externalCategory) ? `${categories.find(c => c.id === externalCategory)?.icon || ""} ${categories.find(c => c.id === externalCategory)?.name}`.trim() : externalCategory) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories.map((c) => <SelectItem key={c.id} value={c.id} label={`${c.icon || ""} ${c.name}`.trim()} className="text-foreground/90">{c.icon} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/90">Design Description <span className="text-muted-foreground text-xs">(optional — AI analyzes the image automatically)</span></Label>
                  <Textarea value={externalDescription} onChange={(e) => setExternalDescription(e.target.value)} placeholder="e.g., 'Pink elephant theme 1st birthday invitation with pastel colors' — helps the AI refine the mockup environment" rows={2} className="bg-card border-border text-foreground placeholder:text-muted-foreground resize-none" />
                </div>
                <Button onClick={handleGenerateMockups} disabled={loading || !externalImage || !externalCategory} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-200 gap-2 cursor-pointer mt-4">
                  {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating Mockups...</> : <><Images className="w-5 h-5" />Generate 4 Birthday Mockups</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Generation Round {generationRound} of {MAX_ROUNDS}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {allMockups.length} total mockups generated.{" "}
                  {generationRound < MAX_ROUNDS
                    ? `${MAX_ROUNDS - generationRound} more round${MAX_ROUNDS - generationRound > 1 ? "s" : ""} available.`
                    : "Generation limit reached."}
                </p>
              </div>
              <Button onClick={handleClearSession} variant="outline" className="gap-2 cursor-pointer border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 shrink-0">
                <Sparkles className="w-4 h-4" /> Start New Session
              </Button>
            </div>
            {generationRound < MAX_ROUNDS && (
              <Button onClick={handleGenerateMore} disabled={loading} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-200 gap-2 cursor-pointer">
                {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating Round {generationRound + 1}...</> : <><Images className="w-5 h-5" />Generate 4 More Variations (Round {generationRound + 1}/{MAX_ROUNDS})</>}
              </Button>
            )}
            {generationRound >= MAX_ROUNDS && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">All {MAX_ROUNDS} generation rounds complete! Start a new session to generate more mockups.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {loading && (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{progressText}</span>
              <span className="text-sm text-amber-600 font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <div>
                <p className="text-sm text-foreground font-medium">Creating consistent mockups</p>
                <p className="text-xs text-muted-foreground">Each mockup maintains exact design fidelity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20"><CardContent className="p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-700 dark:text-red-400 font-medium">Mockup Generation Failed</p>
            <p className="text-red-600/80 text-sm mt-1">{error}</p>
            <Button onClick={() => { setError(""); setProgress(0); }} variant="outline" className="mt-3 border-red-200 dark:border-red-500/20 text-red-600 cursor-pointer">Retry</Button>
          </div>
        </CardContent></Card>
      )}

      {/* Results Grid */}
      {allMockups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{allMockups.length} Mockups Generated!</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allMockups.map((mockup, i) => (
              <Card key={`${mockup.file_name}-${i}`} className="bg-card border-border shadow-sm overflow-hidden group cursor-pointer" onClick={() => setPreviewImage(mockup.url)}>
                <CardContent className="p-0">
                  <div className="relative">
                    <img src={mockup.url} alt={mockup.description} className="w-full aspect-[14/11] object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button onClick={(e) => { e.stopPropagation(); handleDownload(mockup.url, mockup.file_name); }} className="bg-card/90 text-foreground hover:bg-card gap-2 text-xs cursor-pointer">
                        <Download className="w-3 h-3" />Download
                      </Button>
                    </div>
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-medium rounded-full bg-black/50 text-white backdrop-blur-sm">
                      Round {Math.ceil((i + 1) / 4)}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">Mockup {i + 1}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Etsy Description Results */}
      {etsyDescription && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-foreground text-lg">Generated Etsy Description</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(etsyDescription.description_body.replace(/\\n/g, '\n'));
                }}
              >
                <Copy className="w-3.5 h-3.5" />Copy All
              </Button>
            </div>
            {etsyDescription.title && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-2">{etsyDescription.title}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans bg-muted/50 rounded-lg p-4 border border-border overflow-auto max-h-[500px]">{etsyDescription.description_body.replace(/\\n/g, '\n')}</pre>
            </div>
            {etsyDescription.tags && etsyDescription.tags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-foreground/90 text-sm font-medium">Etsy Tags ({etsyDescription.tags.length})</Label>
                <div className="flex flex-wrap gap-1.5">
                  {etsyDescription.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-5xl w-full p-1 bg-transparent border-none shadow-none [&>button]:hidden flex flex-col items-center justify-center h-[90vh]">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            {previewImage && (
              <>
                <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-md" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setPreviewImage(null)} 
                  className="absolute top-0 right-0 m-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm cursor-pointer z-50"
                >
                  <X className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
