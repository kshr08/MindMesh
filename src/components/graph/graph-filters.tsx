"use client";

import type { ConfidenceStatus, NodeType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";

const NODE_TYPE_OPTIONS: { value: NodeType | ""; label: string }[] = [
  { value: "", label: "All types" },
  { value: "CONCEPT", label: "Concept" },
  { value: "PROJECT", label: "Project" },
  { value: "SKILL", label: "Skill" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "RESOURCE", label: "Resource" },
];

const STATUS_OPTIONS: { value: ConfidenceStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "FAMILIAR", label: "Familiar" },
  { value: "LEARNING", label: "Learning" },
  { value: "CONFIDENT", label: "Confident" },
  { value: "NEEDS_REVIEW", label: "Needs review" },
];

interface GraphFiltersProps {
  nodeType: NodeType | "";
  status: ConfidenceStatus | "";
  onNodeTypeChange: (nodeType: NodeType | "") => void;
  onStatusChange: (status: ConfidenceStatus | "") => void;
  onClear: () => void;
}

export function GraphFilters({
  nodeType,
  status,
  onNodeTypeChange,
  onStatusChange,
  onClear,
}: GraphFiltersProps) {
  const hasFilters = Boolean(nodeType || status);

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1">
        <Label htmlFor="graph-node-type" className="text-[10px] text-zinc-500">
          Type
        </Label>
        <SelectNative
          id="graph-node-type"
          value={nodeType}
          onChange={(event) => onNodeTypeChange(event.target.value as NodeType | "")}
          className="h-9 w-32 text-xs"
        >
          {NODE_TYPE_OPTIONS.map((option) => (
            <option key={option.value || "all-types"} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectNative>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="graph-status" className="text-[10px] text-zinc-500">
          Confidence
        </Label>
        <SelectNative
          id="graph-status"
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as ConfidenceStatus | "")
          }
          className="h-9 w-32 text-xs"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all-statuses"} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectNative>
      </div>
      {hasFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
