"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { ArrowLeft, Download, Copy, CheckCircle2, Type, ImageIcon, FileText, Images, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { Generation, MockupSet, EtsyDescription } from "@/shared/types/global.types";
import Link from "next/link";

export function GenerationDetailView() {
  const params = useParams();
  const router = useRouter();
  const [gen, setGen] = useState<Generation | null>(null);
  const [mockupSets, setMockupSets] = useState<MockupSet[]>([]);
  const [etsyDesc, setEtsyDesc] = useState<EtsyDescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const id = params.id as string;
      const [genRes, mockupRes, descRes] = await Promise.all([
        supabase.from("generations").select("*, category:categories(*)").eq("id", id).single(),
        supabase.from("mockup_sets").select("*").eq("generation_id", id).order("created_at", { ascending: false }),
        supabase.from("etsy_descriptions").select("*").eq("generation_id", id).order("created_at", { ascending: false }).limit(1),
      ]);
      setGen(genRes.data);
      setMockupSets(mockupRes.data || []);
      setEtsyDesc(descRes.data?.[0] || null);
      setLoading(false);
    };
    fetchData();
  }, [params.id, supabase]);

  const handleCopy = async (text: string, field: string) => { await navigator.clipboard.writeText(text); setCopied(field); setTimeout(() => setCopied(null), 2000); };
  const handleDownload = async (url: string, filename: string) => { const r = await fetch(url); const b = await r.blob(); const l = document.createElement("a"); l.href = URL.createObjectURL(b); l.download = filename; l.click(); URL.revokeObjectURL(l.href); };
  const handleDelete = async () => {
    if (!gen) return;
    if (!confirm("Delete this generation and all associated assets?")) return;
    await supabase.from("generations").delete().eq("id", gen.id);
    router.push("/dashboard/library");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-violet-200 dark:border-violet-500/20 border-t-violet-600 rounded-full animate-spin" /></div>;
  if (!gen) return <div className="text-center py-20"><p className="text-muted-foreground">Generation not found</p></div>;

  const allMockups = mockupSets.flatMap(set => set.mockup_assets_json || []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/library">
            <Button variant="outline" size="icon" className="border-border cursor-pointer"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{gen.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10">{gen.category?.name}</Badge>
              <span className="text-sm text-muted-foreground">{gen.source_type} · {new Date(gen.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleDelete} className="border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-50 dark:bg-red-500/10 gap-2 cursor-pointer"><Trash2 className="w-4 h-4" />Delete</Button>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Templates</h2>
        <Tabs defaultValue="with-text" className="w-full">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="with-text" className="data-[state=active]:bg-card data-[state=active]:text-violet-700 dark:text-violet-400 gap-2"><Type className="w-4 h-4" />With Text</TabsTrigger>
            <TabsTrigger value="without-text" className="data-[state=active]:bg-card data-[state=active]:text-violet-700 dark:text-violet-400 gap-2"><ImageIcon className="w-4 h-4" />Without Text</TabsTrigger>
          </TabsList>
          <TabsContent value="with-text" className="mt-4">
            {gen.image_with_text_url ? (
              <Card className="bg-card border-border shadow-sm overflow-hidden cursor-pointer" onClick={() => setPreviewImage(gen.image_with_text_url!)}>
                <div className="relative group"><img src={gen.image_with_text_url} alt="With text" className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button onClick={(e) => { e.stopPropagation(); handleDownload(gen.image_with_text_url!, `${gen.title}-with-text.png`); }} className="bg-card/90 text-foreground hover:bg-card gap-2 cursor-pointer"><Download className="w-4 h-4" />Download</Button>
                  </div>
                </div>
              </Card>
            ) : <p className="text-muted-foreground text-sm">Not available</p>}
          </TabsContent>
          <TabsContent value="without-text" className="mt-4">
            {gen.image_without_text_url ? (
              <Card className="bg-card border-border shadow-sm overflow-hidden cursor-pointer" onClick={() => setPreviewImage(gen.image_without_text_url!)}>
                <div className="relative group"><img src={gen.image_without_text_url} alt="Without text" className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button onClick={(e) => { e.stopPropagation(); handleDownload(gen.image_without_text_url!, `${gen.title}-without-text.png`); }} className="bg-card/90 text-foreground hover:bg-card gap-2 cursor-pointer"><Download className="w-4 h-4" />Download</Button>
                  </div>
                </div>
              </Card>
            ) : <p className="text-muted-foreground text-sm">Not available</p>}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mockups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Mockups</h2>
          {allMockups.length === 0 && (
            <Link href="/dashboard/mockups">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2 cursor-pointer"><Images className="w-4 h-4" />Generate Mockups</Button>
            </Link>
          )}
        </div>
        {allMockups.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {allMockups.map((m, i) => (
              <Card key={i} className="bg-card border-border shadow-sm overflow-hidden group cursor-pointer" onClick={() => setPreviewImage(m.url)}>
                <CardContent className="p-0 relative">
                  <img src={m.url} alt={m.description} className="w-full aspect-[14/11] object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button onClick={(e) => { e.stopPropagation(); handleDownload(m.url, m.file_name); }} className="bg-card/90 text-foreground hover:bg-card gap-2 text-xs cursor-pointer"><Download className="w-3 h-3" />Download</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm">No mockups generated yet. Click &quot;Generate Mockups&quot; to create 8-10 matching mockups.</p>}
      </div>

      {/* Etsy Listing Description */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Etsy Listing Description</h2>
        {etsyDesc ? (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Title</span>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(etsyDesc.title, "title")} className="text-muted-foreground h-7 gap-1 cursor-pointer">{copied === "title" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}{copied === "title" ? "Copied!" : "Copy"}</Button>
                </div>
                <p className="text-foreground text-sm bg-muted p-3 rounded-lg border border-border">{etsyDesc.title}</p>
              </div>
              {etsyDesc.description_body && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Description</span>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(etsyDesc.description_body!, "desc")} className="text-muted-foreground h-7 gap-1 cursor-pointer">{copied === "desc" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}{copied === "desc" ? "Copied!" : "Copy"}</Button>
                  </div>
                  <div className="text-foreground/90 text-sm bg-muted p-3 rounded-lg border border-border whitespace-pre-wrap max-h-60 overflow-auto">{etsyDesc.description_body}</div>
                </div>
              )}
              {etsyDesc.features_json?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Features</span>
                  <ul className="space-y-1">{etsyDesc.features_json.map((f, i) => <li key={i} className="text-sm text-foreground/90 flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />{f}</li>)}</ul>
                </div>
              )}
              {etsyDesc.tags_json?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Tags</span>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(etsyDesc.tags_json.join(", "), "tags")} className="text-muted-foreground h-7 gap-1 cursor-pointer">{copied === "tags" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}{copied === "tags" ? "Copied!" : "Copy All"}</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">{etsyDesc.tags_json.map((t, i) => <Badge key={i} variant="outline" className="border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 text-xs">{t}</Badge>)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : gen.etsy_title ? (
          <Card className="bg-card border-border shadow-sm"><CardContent className="p-6 space-y-3">
            <p className="text-foreground text-sm font-medium">{gen.etsy_title}</p>
            {gen.etsy_tags && <div className="flex flex-wrap gap-2">{gen.etsy_tags.map((t, i) => <Badge key={i} variant="outline" className="border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 text-xs">{t}</Badge>)}</div>}
          </CardContent></Card>
        ) : <p className="text-muted-foreground text-sm">No listing description available.</p>}
      </div>

      {/* Generation Info */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader><CardTitle className="text-foreground text-sm font-medium">Generation Details</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span className="text-foreground/90 capitalize">{gen.source_type}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`font-medium ${gen.status === "completed" ? "text-emerald-600" : gen.status === "failed" ? "text-red-600" : "text-amber-600"}`}>{gen.status}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Aspect Ratio</span><span className="text-foreground/90">{gen.aspect_ratio}</span></div>
          {gen.prompt && <div className="pt-2 border-t border-border"><span className="text-muted-foreground text-xs block mb-1">Prompt</span><p className="text-foreground/90 text-xs bg-muted p-2 rounded">{gen.prompt}</p></div>}
        </CardContent>
      </Card>

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
