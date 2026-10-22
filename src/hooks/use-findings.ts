"use client";

import { useEffect, useState, useCallback } from "react";
import type { Finding } from "@/lib/types";
import { storage } from "@/lib/storage";
import { toast } from "sonner";

// Simple event listener for cross-hook updates in the same window
const listeners: Set<() => void> = new Set();
const notifyListeners = () => listeners.forEach(l => l());

export function useFindings() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await storage.loadFindings();
    const sorted = [...data].sort((a, b) => {
      const orderA = a.order ?? new Date(a.createdAt).getTime();
      const orderB = b.order ?? new Date(b.createdAt).getTime();
      return orderB - orderA;
    });
    setFindings(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, [load]);

  return { findings, loading, refresh: load };
}

export function useFinding(id: string) {
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await storage.loadFindings();
    const found = data.find(f => f.id === id) || null;
    setFinding(found);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, [load]);

  return { finding, loading, refresh: load };
}

export async function updateFinding(
  id: string,
  data: Partial<Omit<Finding, "id">>
) {
  const findings = await storage.loadFindings();
  const index = findings.findIndex(f => f.id === id);
  if (index !== -1) {
    findings[index] = {
      ...findings[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await storage.saveFindings(findings);
    notifyListeners();
  }
}

export async function updateFindingsOrder(updates: { id: string; order: number }[]) {
  const findings = await storage.loadFindings();
  updates.forEach(({ id, order }) => {
    const index = findings.findIndex(f => f.id === id);
    if (index !== -1) {
      findings[index] = {
        ...findings[index],
        order,
        updatedAt: new Date().toISOString(),
      };
    }
  });
  await storage.saveFindings(findings);
  notifyListeners();
}

export async function addFinding(finding: Finding) {
  const findings = await storage.loadFindings();
  findings.push(finding);
  await storage.saveFindings(findings);
  notifyListeners();
}

export async function deleteFinding(id: string) {
  const findings = await storage.loadFindings();
  const findingToDelete = findings.find(f => f.id === id);
  
  if (findingToDelete && findingToDelete.imagePath) {
    try {
      await storage.deleteImage(findingToDelete.imagePath);
    } catch (error) {
      console.error("Failed to delete image file:", error);
      toast.error(`Could not delete image file: ${error}`);
    }
  }

  const filtered = findings.filter(f => f.id !== id);
  await storage.saveFindings(filtered);
  notifyListeners();
}

export function useSettings() {
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const settings = await storage.loadSettings();
    setCategoryOrder(settings.categoryOrder || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, [load]);

  return { categoryOrder, loading, refresh: load };
}

export async function updateCategoryOrder(order: string[]) {
  const settings = await storage.loadSettings();
  settings.categoryOrder = order;
  await storage.saveSettings(settings);
  notifyListeners();
}
