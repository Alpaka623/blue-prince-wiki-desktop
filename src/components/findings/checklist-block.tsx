"use client";

import { updateFinding } from "@/hooks/use-findings";
import { Checkbox } from "@/components/ui/checkbox";
import type { CustomContentBlock } from "@/lib/types";
import { storage } from "@/lib/storage";

interface ChecklistBlockProps {
  block: Extract<CustomContentBlock, { type: "checklist" }>;
  blockIndex: number;
  findingId: string;
}

export function ChecklistBlock({ block, blockIndex, findingId }: ChecklistBlockProps) {
  async function toggleItem(itemIndex: number) {
    const findings = await storage.loadFindings();
    const findingIndex = findings.findIndex(f => f.id === findingId);
    if (findingIndex === -1) return;

    const finding = findings[findingIndex];
    if (!finding.customContent) return;

    const customContent = [...finding.customContent];
    const targetBlock = customContent[blockIndex];

    if (targetBlock?.type === "checklist") {
      const updatedItems = targetBlock.items.map((item, i) =>
        i === itemIndex ? { ...item, checked: !item.checked } : item
      );
      
      customContent[blockIndex] = {
        ...targetBlock,
        items: updatedItems,
      };

      await updateFinding(findingId, { customContent });
    }
  }

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">{block.title}</h4>
      <div className="space-y-1.5">
        {block.items.map((item, i) => (
          <label
            key={item.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors"
          >
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => toggleItem(i)}
            />
            <span className={item.checked ? "line-through text-muted-foreground" : ""}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
