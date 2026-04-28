"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Wand2, Sparkles, Download, Copy, CheckCircle2, AlertCircle, ImageIcon, Type, FileText, ArrowRight, Upload, X } from "lucide-react";
import type { Category, Generation, Preset } from "@/shared/types/global.types";
import Link from "next/link";

export function ManualCreateView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [presetId, setPresetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<Generation | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, presetRes] = await Promise.all([
        supabase.from("categories").select("*").eq("is_active", true).order("name"),
        supabase.from("presets").select("*").order("name"),
      ]);
      setCategories(catRes.data || []);
      setPresets(presetRes.data || []);
    };
    fetchData();
  }, [supabase]);

  useEffect(() => {
    if (!categoryId) {
      setSuggestion(null);
      return;
    }
    const fetchSuggestion = async () => {
      setIsGeneratingSuggestion(true);
      setSuggestion(null);
      try {
        const res = await fetch(`/api/suggest-prompt?categoryId=${categoryId}`);
        const data = await res.json();
        if (data.suggestion) setSuggestion(data.suggestion);
      } catch (error) {
        console.error("Failed to fetch suggestion", error);
      } finally {
        setIsGeneratingSuggestion(false);
      }
    };
    fetchSuggestion();
  }, [categoryId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null); setProgress(0);

    const stages = [
      { pct: 10, text: "Refining your prompt..." },
      { pct: 25, text: "Generating template with text..." },
      { pct: 50, text: "Generating template without text..." },
      { pct: 70, text: "Creating Etsy listing description..." },
      { pct: 85, text: "Uploading assets to cloud..." },
      { pct: 95, text: "Finalizing..." },
    ];
    let si = 0;
    const iv = setInterval(() => { if (si < stages.length) { setProgress(stages[si].pct); setProgressText(stages[si].text); si++; } }, 4000);

    try {
      const reference_images: { base64: string; mimeType: string }[] = [];

      if (referenceImages.length > 0) {
        setProgressText(`Processing ${referenceImages.length} sample images...`);
        for (const img of referenceImages) {
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(img);
          });
          const match = base64Data.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/);
          if (match) {
            reference_images.push({ mimeType: match[1], base64: match[2] });
          }
        }
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, prompt, preset_id: presetId || undefined, source_type: "manual", reference_images }),
      });
      clearInterval(iv);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setProgress(100); setProgressText("Complete!"); setResult(data.generation);
    } catch (err) { clearInterval(iv); setError(err instanceof Error ? err.message : "An error occurred"); setProgress(0); }
    finally { setLoading(false); }
  };

  const handleCopy = async (text: string, field: string) => { await navigator.clipboard.writeText(text); setCopied(field); setTimeout(() => setCopied(null), 2000); };
  const handleDownload = async (url: string, filename: string) => { const r = await fetch(url); const b = await r.blob(); const l = document.createElement("a"); l.href = URL.createObjectURL(b); l.download = filename; l.click(); URL.revokeObjectURL(l.href); };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          Manual Create
        </h1>
        <p className="text-muted-foreground mt-2">Write a prompt and generate Etsy-ready templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleGenerate} className="space-y-6">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader><CardTitle className="text-foreground text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-violet-500" />Product Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground/90">Category *</Label>
                  <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)} required>
                    <SelectTrigger className="bg-card border-border text-foreground"><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-foreground/90">{c.icon} {c.name}</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/90">Prompt *</Label>
                  <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Elegant blush floral wedding invitation with soft script typography" required rows={3} className="bg-card border-border text-foreground placeholder:text-muted-foreground resize-none" />
                  <p className="text-xs text-muted-foreground">Describe the design you want. Be specific about style, colors, and mood.</p>
                  {(suggestion || isGeneratingSuggestion) && (
                    <div className="mt-2 p-3 rounded-lg bg-violet-50/50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          {isGeneratingSuggestion ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                              <p className="text-xs text-muted-foreground">AI is brainstorming a prompt...</p>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs text-foreground/80 italic">"{suggestion}"</p>
                              <Button type="button" variant="ghost" size="sm" className="h-6 mt-2 px-2 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-500/20 cursor-pointer" onClick={() => { setPrompt(suggestion!); setSuggestion(null); }}>
                                Use Suggestion
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/90">Preset (optional)</Label>
                  <Select value={presetId} onValueChange={(v) => v && setPresetId(v)}>
                    <SelectTrigger className="bg-card border-border text-foreground"><SelectValue placeholder="No preset" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {presets.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No presets yet</p> :
                        presets.map((p) => <SelectItem key={p.id} value={p.id} className="text-foreground/90">{p.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/90">Sample Images (Optional, up to 4)</Label>
                  {previewUrls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative w-full aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => {
                            const newFiles = [...referenceImages];
                            const newUrls = [...previewUrls];
                            newFiles.splice(idx, 1);
                            newUrls.splice(idx, 1);
                            setReferenceImages(newFiles);
                            setPreviewUrls(newUrls);
                          }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {previewUrls.length < 4 && (
                        <label htmlFor="dropzone-file-add" className="flex items-center justify-center w-full aspect-square border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <input id="dropzone-file-add" type="file" multiple className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => {
                            if (e.target.files) {
                              const newFiles = Array.from(e.target.files);
                              const totalFiles = referenceImages.length + newFiles.length;
                              if (totalFiles > 4) { setError("Maximum 4 images allowed."); return; }
                              if (newFiles.some(f => f.size > 5 * 1024 * 1024)) { setError("One or more images exceed 5MB limit."); return; }
                              setError("");
                              setReferenceImages([...referenceImages, ...newFiles]);
                              setPreviewUrls([...previewUrls, ...newFiles.map(f => URL.createObjectURL(f))]);
                            }
                          }} />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground hover:text-foreground transition-colors group">
                          <Upload className="w-8 h-8 mb-3 opacity-60 group-hover:opacity-100" />
                          <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs opacity-80">PNG, JPG or WebP (Max 5MB per image)</p>
                        </div>
                        <input id="dropzone-file" type="file" multiple className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => {
                          if (e.target.files) {
                            const newFiles = Array.from(e.target.files);
                            if (newFiles.length > 4) { setError("Maximum 4 images allowed."); return; }
                            if (newFiles.some(f => f.size > 5 * 1024 * 1024)) { setError("One or more images exceed 5MB limit."); return; }
                            setError("");
                            setReferenceImages(newFiles);
                            setPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
                          }
                        }} />
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Upload up to 4 reference images for the AI to use as contextual input.</p>
                </div>
                <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                  <p className="text-xs text-violet-700 dark:text-violet-400"><strong>Aspect Ratio:</strong> 14:11 (fixed per BRD)</p>
                </div>
              </CardContent>
            </Card>
            <Button type="submit" disabled={loading || !categoryId || !prompt} className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-200 gap-2 cursor-pointer">
              {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5" />Generate Design</>}
            </Button>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {loading && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{progressText}</span>
                  <span className="text-sm text-violet-600 font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                  <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                  <div>
                    <p className="text-sm text-foreground font-medium">AI is crafting your design</p>
                    <p className="text-xs text-muted-foreground">This may take 30-60 seconds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {error && (
            <Card className="bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20">
              <CardContent className="p-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-red-700 dark:text-red-400 font-medium">Generation Failed</p>
                  <p className="text-red-600/80 text-sm mt-1">{error}</p>
                  <Button onClick={() => { setError(""); setProgress(0); }} variant="outline" className="mt-3 border-red-200 dark:border-red-500/20 text-red-600 hover:bg-red-50 dark:bg-red-500/10 cursor-pointer">Try Again</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {result && <ResultDisplay result={result} onCopy={handleCopy} onDownload={handleDownload} copied={copied} onReset={() => { setResult(null); setProgress(0); setError(""); }} />}
          {!loading && !result && !error && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-violet-300" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Create</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm">Choose a category, write your prompt, and let AI generate your Etsy-ready templates.</p>
                <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Type className="w-4 h-4" />Template With Text</div>
                  <div className="flex items-center gap-2"><ImageIcon className="w-4 h-4" />Template Without Text</div>
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4" />Listing Copy</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultDisplay({ result, onCopy, onDownload, copied, onReset }: { result: Generation; onCopy: (t: string, f: string) => void; onDownload: (u: string, f: string) => void; copied: string | null; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><span className="text-emerald-700 dark:text-emerald-400 font-medium">Generation Complete!</span></div>
        <div className="flex gap-2">
          <Link href={`/dashboard/library/${result.id}`}>
            <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground gap-2 cursor-pointer"><ArrowRight className="w-4 h-4" />View Details</Button>
          </Link>
          <Button onClick={onReset} variant="outline" className="border-border text-muted-foreground cursor-pointer">New Generation</Button>
        </div>
      </div>
      <Tabs defaultValue="with-text" className="w-full">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="with-text" className="data-[state=active]:bg-card data-[state=active]:text-violet-700 dark:text-violet-400 gap-2"><Type className="w-4 h-4" />With Text</TabsTrigger>
          <TabsTrigger value="without-text" className="data-[state=active]:bg-card data-[state=active]:text-violet-700 dark:text-violet-400 gap-2"><ImageIcon className="w-4 h-4" />Without Text</TabsTrigger>
        </TabsList>
        <TabsContent value="with-text" className="mt-4">
          <Card className="bg-card border-border shadow-sm overflow-hidden">
            {result.image_with_text_url && <div className="relative group">
              <img src={result.image_with_text_url} alt="With text" className="w-full h-auto" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button onClick={() => onDownload(result.image_with_text_url!, `${result.title}-with-text.png`)} className="bg-card/90 text-foreground hover:bg-card gap-2 cursor-pointer"><Download className="w-4 h-4" />Download</Button>
              </div>
            </div>}
          </Card>
        </TabsContent>
        <TabsContent value="without-text" className="mt-4">
          <Card className="bg-card border-border shadow-sm overflow-hidden">
            {result.image_without_text_url && <div className="relative group">
              <img src={result.image_without_text_url} alt="Without text" className="w-full h-auto" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button onClick={() => onDownload(result.image_without_text_url!, `${result.title}-without-text.png`)} className="bg-card/90 text-foreground hover:bg-card gap-2 cursor-pointer"><Download className="w-4 h-4" />Download</Button>
              </div>
            </div>}
          </Card>
        </TabsContent>
      </Tabs>
      {/* Etsy listing info */}
      {result.etsy_title && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader><CardTitle className="text-foreground text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" />Etsy Listing Preview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Title</Label>
                <Button variant="ghost" size="sm" onClick={() => onCopy(result.etsy_title!, "title")} className="text-muted-foreground hover:text-foreground h-7 gap-1 cursor-pointer">{copied === "title" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}{copied === "title" ? "Copied!" : "Copy"}</Button>
              </div>
              <p className="text-foreground text-sm bg-muted p-3 rounded-lg border border-border">{result.etsy_title}</p>
            </div>
            {result.etsy_tags && result.etsy_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">{result.etsy_tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 text-xs">{tag}</Badge>
              ))}</div>
            )}
          </CardContent>
        </Card>
      )}
      <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 text-center">
        <p className="text-sm text-violet-700 dark:text-violet-400">🎉 Now <Link href="/dashboard/mockups" className="font-semibold underline">generate 8-10 mockups</Link> for this template!</p>
      </div>
    </div>
  );
}
