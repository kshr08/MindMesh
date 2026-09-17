"use client";

import { Button } from "@/components/ui/button";
import type { KnowledgeFlowNode } from "@/types/graph-flow";

const TYPE_LABEL: Record<string, string> = {
  CONCEPT: "Concept",
  PROJECT: "Project",
  SKILL: "Skill",
  TECHNOLOGY: "Technology",
  RESOURCE: "Resource",
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  FAMILIAR: "Familiar",
  LEARNING: "Learning",
  CONFIDENT: "Confident",
  NEEDS_REVIEW: "Needs review",
};

interface NodeDetailsPanelProps {
  node: KnowledgeFlowNode;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function NodeDetailsPanel({ node, onEdit, onDelete, onClose }: NodeDetailsPanelProps) {
  return (
    <div className="absolute right-4 top-4 z-10 w-72 rounded-lg border border-zinc-800 bg-zinc-950/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            {TYPE_LABEL[node.data.type]}
          </p>
          <h2 className="text-sm font-medium text-zinc-100">{node.data.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-200"
          aria-label="Close node details"
        >
          ×
        </button>
      </div>

      <p className="mt-2 text-xs text-zinc-400">{STATUS_LABEL[node.data.status]}</p>

      {node.data.description && (
        <p className="mt-2 line-clamp-4 text-xs text-zinc-400">{node.data.description}</p>
      )}

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit} className="flex-1">
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete} className="flex-1">
          Delete
        </Button>
      </div>
    </div>
  );
}