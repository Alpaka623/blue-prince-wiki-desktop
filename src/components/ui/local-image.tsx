"use client";

import { useEffect, useState } from "react";
import Image, { ImageProps } from "next/image";
import { convertFileSrc } from "@tauri-apps/api/core";
import { storage } from "@/lib/storage";

interface LocalImageProps extends Omit<ImageProps, "src"> {
  imagePath: string;
  fallbackSrc?: string;
}

export function LocalImage({ imagePath, fallbackSrc = "/next.svg", ...props }: LocalImageProps) {
  const [src, setSrc] = useState<string>(fallbackSrc);

  useEffect(() => {
    async function resolvePath() {
      if (!imagePath) return;
      if (imagePath.startsWith("http") || imagePath.startsWith("blob:")) {
        setSrc(imagePath);
        return;
      }

      try {
        const appDataDir = await storage.getAppDataDir();
        // Ensure path is properly joined regardless of platform
        const fullPath = [appDataDir, "images", imagePath]
          .filter(Boolean)
          .join(appDataDir.includes("\\") ? "\\" : "/");
        setSrc(convertFileSrc(fullPath));
      } catch (error) {
        console.error("Failed to resolve image path:", error);
      }
    }

    resolvePath();
  }, [imagePath]);

  return <Image src={src} {...props} />;
}
