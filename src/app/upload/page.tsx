"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { DoorClosed, ImagePlus, Loader2, Save, Tag, Type, FolderTree } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { addFinding, useFindings } from "@/hooks/use-findings";
import { storage } from "@/lib/storage";
import { convertFileSrc } from "@tauri-apps/api/core";

export default function UploadPage() {
  const router = useRouter();
  const { findings } = useFindings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [room, setRoom] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const existingCategories = Array.from(new Set(findings.map(f => f.category)));

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
    
    // Auto-fill title if empty
    if (!title) {
      setTitle(selected.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) return;

    setSaving(true);

    try {
      setStatus("Saving image...");
      
      // Read file as base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const fileName = `${Date.now()}-${sanitizedFileName}`;
      const savedPath = await storage.uploadImage(fileName, base64Data);

      setStatus("Saving finding...");
      
      const newFinding = {
        id: crypto.randomUUID(),
        imageUrl: "", // We'll handle local image display separately
        imagePath: savedPath,
        title: title.trim(),
        category: category.trim() || "General",
        room: room.trim() || "",
        description: description.trim(),
        tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: Date.now(),
      };

      await addFinding(newFinding);

      toast.success("Finding saved successfully!");
      router.push(`/finding?id=${newFinding.id}`);
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Saving failed. Please try again.");
    } finally {
      setSaving(false);
      setStatus("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Finding</h1>
        <p className="text-muted-foreground mt-1">
          Upload a photo and enter the details manually.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {preview ? (
          <Card className="overflow-hidden">
            <div className="relative aspect-video">
              <Image
                src={preview}
                alt="Preview"
                fill
                unoptimized
                className="object-contain bg-black/50"
              />
            </div>
            <CardContent className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                Choose another image
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="h-32 w-full flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm">Choose Image</span>
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-1.5">
              <Type className="w-4 h-4 text-muted-foreground" />
              Title
            </Label>
            <Input
              id="title"
              placeholder="What did you find?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-muted-foreground" />
                Category
              </Label>
              <Input
                id="category"
                list="categories"
                placeholder="e.g. Furniture, Tool..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <datalist id="categories">
                {existingCategories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room" className="flex items-center gap-1.5">
                <DoorClosed className="w-4 h-4 text-muted-foreground" />
                Room / Location
              </Label>
              <Input
                id="room"
                placeholder='e.g. "Library"'
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Tags <span className="text-muted-foreground font-normal">(comma-separated)</span>
            </Label>
            <Input
              id="tags"
              placeholder="e.g. Wood, antique, broken"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Details about the finding..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!file || !title || saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {status}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Finding
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
