"use client";

import { useState } from "react";
import type { KnowledgeFlowNode } from "@/types/graph-flow";
import type {
  KnowledgeFreshnessItem,
  KnowledgeFreshnessSummary,
} from "@/types/knowledge-freshness";

interface KnowledgeReviewPanelProps {
  summary: KnowledgeFreshnessSummary;
  nodes: KnowledgeFlowNode[];
  onSelectNode: (node: KnowledgeFlowNode) => void;
}

const FRESHNESS_LABEL = {
  NEVER_REVIEWED: "Never reviewed",
  FRESH: "Fresh",
  DUE: "Due",
  NEEDS_REVIEW: "Needs review",
} as const;

function getNodeById(
  nodes: KnowledgeFlowNode[],
  nodeId: string,
): KnowledgeFlowNode | null {
  return nodes.find((node) => node.id === nodeId) ?? null;
}

function formatAge(item: KnowledgeFreshnessItem): string {
  if (item.freshness === "NEVER_REVIEWED") {
    return "No review recorded";
  }

  if (item.daysSinceReview === null) {
    return "No review recorded";
  }

  if (item.daysSinceReview === 0) {
    return "Reviewed today";
  }

  if (item.daysSinceReview === 1) {
    return "Reviewed 1 day ago";
  }

  return `Reviewed ${item.daysSinceReview} days ago`;
}

function badgeClassName(
  freshness: KnowledgeFreshnessItem["freshness"],
): string {
  switch (freshness) {
    case "NEEDS_REVIEW":
      return "border-rose-900/60 bg-rose-950/30 text-rose-300";
    case "DUE":
      return "border-amber-900/60 bg-amber-950/30 text-amber-300";
    case "NEVER_REVIEWED":
      return "border-zinc-700 bg-zinc-900 text-zinc-400";
    case "FRESH":
      return "border-emerald-900/60 bg-emerald-950/30 text-emerald-300";
  }
}

export function KnowledgeReviewPanel({
  summary,
  nodes,
  onSelectNode,
}: KnowledgeReviewPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const reviewCandidateCount =
    summary.neverReviewed + summary.due + summary.needsReview;

  const candidates = summary.items.filter(
    (item) => item.freshness !== "FRESH",
  );

  if (isCollapsed) {
    return (
      <div className="absolute bottom-4 left-4 z-10">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/95 px-3 py-2 text-left shadow-lg backdrop-blur-sm transition hover:border-zinc-700 hover:bg-zinc-900"
          aria-label="Expand knowledge review panel"
        >
          <span className="text-xs font-medium text-zinc-200">
            Knowledge review
          </span>

          {reviewCandidateCount > 0 && (
            <span className="rounded-full border border-amber-900/60 bg-amber-950/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
              {reviewCandidateCount}
            </span>
          )}

          <span className="text-xs text-zinc-500">↑</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 w-80 rounded-lg border border-zinc-800 bg-zinc-950/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Knowledge review
          </p>

          <h2 className="mt-1 text-sm font-medium text-zinc-100">
            Review your knowledge
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            A deterministic view of knowledge freshness. Nothing is changed
            automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="shrink-0 rounded-md px-1.5 py-1 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300"
          aria-label="Collapse knowledge review panel"
        >
          ↓
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Total
          </p>
          <p className="mt-1 text-lg font-medium text-zinc-100">
            {summary.totalNodes}
          </p>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Fresh
          </p>
          <p className="mt-1 text-lg font-medium text-emerald-300">
            {summary.fresh}
          </p>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Due
          </p>
          <p className="mt-1 text-lg font-medium text-amber-300">
            {summary.due}
          </p>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Needs review
          </p>
          <p className="mt-1 text-lg font-medium text-rose-300">
            {summary.needsReview}
          </p>
        </div>
      </div>

      {summary.neverReviewed > 0 && (
        <div className="mt-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2">
          <p className="text-xs text-zinc-400">
            {summary.neverReviewed}{" "}
            {summary.neverReviewed === 1 ? "node has" : "nodes have"} never
            been reviewed.
          </p>
        </div>
      )}

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">
          Review candidates
        </p>

        {candidates.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">
            No knowledge is currently flagged for review.
          </p>
        ) : (
          <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {candidates.map((item) => {
              const node = getNodeById(nodes, item.nodeId);

              if (!node) {
                return null;
              }

              return (
                <button
                  key={item.nodeId}
                  type="button"
                  onClick={() => onSelectNode(node)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 p-2 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate text-xs font-medium text-zinc-200">
                      {item.title}
                    </span>

                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] ${badgeClassName(
                        item.freshness,
                      )}`}
                    >
                      {FRESHNESS_LABEL[item.freshness]}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-zinc-500">
                    {formatAge(item)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}