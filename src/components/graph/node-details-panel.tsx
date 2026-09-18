"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markKnowledgeNodeReviewedAction } from "@/server/actions/knowledge-node-actions";
import type { KnowledgeFlowNode } from "@/types/graph-flow";

const TYPE_LABEL = {
  CONCEPT: "Concept",
  PROJECT: "Project",
  SKILL: "Skill",
  TECHNOLOGY: "Technology",
  RESOURCE: "Resource",
} as const;

const STATUS_LABEL = {
  NEW: "New",
  FAMILIAR: "Familiar",
  LEARNING: "Learning",
  CONFIDENT: "Confident",
  NEEDS_REVIEW: "Needs review",
} as const;

interface NodeDetailsPanelProps {
  node: KnowledgeFlowNode;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onReviewed?: (lastReviewed: string) => void;
}

function formatLastReviewed(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString();
}

function getRelativeReviewLabel(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) {
    return "Reviewed just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `Reviewed ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Reviewed ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 30) {
    return `Reviewed ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths < 12) {
    return `Reviewed ${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  }

  const diffYears = Math.floor(diffDays / 365);

  return `Reviewed ${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

export function NodeDetailsPanel({
  node,
  onEdit,
  onDelete,
  onClose,
  onReviewed,
}: NodeDetailsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMarkReviewed() {
    setError(null);

    startTransition(async () => {
      const result = await markKnowledgeNodeReviewedAction({
        id: node.id,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onReviewed?.(result.data.lastReviewed);
    });
  }

  const lastReviewedLabel = formatLastReviewed(node.data.lastReviewed);
  const relativeReviewLabel = getRelativeReviewLabel(node.data.lastReviewed);

  return (
    <div className="absolute right-4 top-4 z-10 w-72 rounded-lg border border-zinc-800 bg-zinc-950/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            {TYPE_LABEL[node.data.type]}
          </p>

          <h2 className="text-sm font-medium text-zinc-100">
            {node.data.title}
          </h2>
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

      <p className="mt-2 text-xs text-zinc-400">
        {STATUS_LABEL[node.data.status]}
      </p>

      {node.data.description && (
        <p className="mt-2 line-clamp-4 text-xs text-zinc-400">
          {node.data.description}
        </p>
      )}

      <div className="mt-4 rounded-md border border-zinc-800/80 bg-zinc-900/50 p-3">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">
          Review
        </p>

        {relativeReviewLabel ? (
          <>
            <p className="mt-1 text-xs text-zinc-300">
              {relativeReviewLabel}
            </p>

            {lastReviewedLabel && (
              <p className="mt-1 text-[11px] text-zinc-500">
                {lastReviewedLabel}
              </p>
            )}
          </>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">
            Not reviewed yet.
          </p>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          onClick={handleMarkReviewed}
          disabled={isPending}
        >
          {isPending ? "Marking reviewed..." : "Mark as reviewed"}
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-2 text-xs text-rose-400"
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="flex-1"
        >
          Edit
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          className="flex-1"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}