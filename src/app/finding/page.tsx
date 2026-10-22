"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFinding, updateFinding, deleteFinding } from "@/hooks/use-findings";
import { EditableField } from "@/components/findings/editable-field";
import { ContentRenderer } from "@/components/findings/content-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCategoryConfig } from "@/lib/categories";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Tag,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  NotebookPen,
  DoorClosed,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { storage } from "@/lib/storage";
import { convertFileSrc } from "@tauri-apps/api/core";

function FindingContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const { finding, loading } = useFinding(id || "");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageOpen, setImageOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function resolve() {
      if (!finding?.imagePath) return;
      if (finding.imagePath.startsWith("http") || finding.imagePath.startsWith("blob:")) {
        setImageUrl(finding.imagePath);
        return;
      }
      try {
        const appDataDir = await storage.getAppDataDir();
        // Ensure path is properly joined regardless of platform
        const fullPath = [appDataDir, "images", finding.imagePath]
          .filter(Boolean)
          .join(appDataDir.includes("\\") ? "\\" : "/");
        setImageUrl(convertFileSrc(fullPath));
      } catch (e) {
        console.error("Failed to resolve image path", e);
      }
    }
    resolve();
  }, [finding]);

  if (!id) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">No ID provided</h2>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Finding not found</h2>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const cat = getCategoryConfig(finding.category);

  async function handleDelete() {
    if (!finding) return;
    if (!confirm("Are you sure you want to delete this finding?")) return;
    
    await deleteFinding(finding.id);
    toast.success("Finding deleted.");
    router.push("/");
  }

  function handleWheel(e: React.WheelEvent) {
    const zoomSpeed = 0.0005;
    setZoom((z) => {
      const factor = 1 - e.deltaY * zoomSpeed;
      const newZoom = z * factor;
      const clampedZoom = Math.min(5, Math.max(1, newZoom));
      if (clampedZoom <= 1.01) setOffset({ x: 0, y: 0 });
      return clampedZoom;
    });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1.01) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      if (zoom <= 1.01) return;
      setIsDragging(true);
      const touch = e.touches[0];
      setStartPos({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialDistance(dist);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - startPos.x,
        y: touch.clientY - startPos.y,
      });
    } else if (e.touches.length === 2 && initialDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialDistance;
      setInitialDistance(dist);
      setZoom((z) => {
        const newZoom = z * factor;
        const clampedZoom = Math.min(5, Math.max(1, newZoom));
        if (clampedZoom <= 1.01) setOffset({ x: 0, y: 0 });
        return clampedZoom;
      });
    }
  }

  function handleTouchEnd() {
    setIsDragging(false);
    setInitialDistance(null);
  }

  function resetZoom() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <Dialog open={imageOpen} onOpenChange={(open) => { setImageOpen(open); if (!open) resetZoom(); }}>
          <DialogTrigger
            className="overflow-hidden cursor-zoom-in group rounded-lg border border-border w-full bg-muted/30"
            onClick={() => setImageOpen(true)}
          >
            <div className="relative w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl || "/next.svg"}
                alt={finding.title}
                className="w-full h-auto max-h-[60vh] object-contain group-hover:brightness-110 transition-all"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/60 rounded-full p-2">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 p-2 border-b border-border bg-background/80 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => {
                setZoom((z) => {
                  const next = Math.max(1, z - 0.1);
                  if (next <= 1.01) setOffset({ x: 0, y: 0 });
                  return next;
                });
              }}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(5, z + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={resetZoom}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div
              ref={imgContainerRef}
              className="flex-1 overflow-hidden flex items-center justify-center bg-black/50 select-none touch-none relative"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl || "/next.svg"}
                alt={finding.title}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.1s ease",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  cursor: zoom > 1.01 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                }}
                draggable={false}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Details */}
        <div className="space-y-4">
          <EditableField
            value={finding.title}
            onSave={(title) => updateFinding(finding.id, { title })}
            className="text-xl font-bold"
          />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${cat.color} flex items-center justify-center min-w-7 h-7`}>
                {cat.icon && <cat.icon className="w-4 h-4" />}
              </div>
              <EditableField
                value={finding.category}
                onSave={(category) => updateFinding(finding.id, { category })}
                className="text-sm font-medium"
                placeholder="Category..."
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-muted">
                <DoorClosed className="w-4 h-4 text-muted-foreground" />
              </div>
              <EditableField
                value={finding.room || ""}
                onSave={(room) => updateFinding(finding.id, { room })}
                className="text-sm text-muted-foreground"
                placeholder="Add room..."
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-1">
              {Array.isArray(finding.tags) && finding.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {finding.extractedText && (
            <div>
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Text
              </h3>
              <EditableField
                value={finding.extractedText}
                onSave={(extractedText) => updateFinding(finding.id, { extractedText })}
                multiline
                className="font-mono text-xs whitespace-pre-wrap"
              />
            </div>
          )}

          {finding.description && (
            <div>
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Description
              </h3>
              <EditableField
                value={finding.description}
                onSave={(description) => updateFinding(finding.id, { description })}
                multiline
                preview={
                  <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {finding.description}
                    </ReactMarkdown>
                  </div>
                }
              />
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
              <NotebookPen className="w-3.5 h-3.5 text-primary" /> Notes
            </h3>
            <EditableField
              value={finding.notes || ""}
              onSave={(notes) => updateFinding(finding.id, { notes })}
              multiline
              placeholder="Add your own notes (Markdown supported)..."
              preview={
                finding.notes ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {finding.notes}
                    </ReactMarkdown>
                  </div>
                ) : undefined
              }
            />
          </div>
        </div>
      </div>

      {finding.customContent && finding.customContent.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <ContentRenderer
              blocks={finding.customContent}
              findingId={finding.id}
            />
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-end">
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Finding
        </Button>
      </div>
    </div>
  );
}

export default function FindingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
      <FindingContent />
    </Suspense>
  );
}
