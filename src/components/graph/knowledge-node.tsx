"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ConfidenceStatus, NodeType } from "@prisma/client";

import { cn } from "@/lib/utils";
import type { KnowledgeFlowNode } from "@/types/graph-flow";

const GEOMETRY: Record<
  NodeType,
  { shape: string; content: string; filled: boolean }
> = {
  CONCEPT: {
    shape: "h-28 w-28 rounded-full",
    content: "max-w-[75%]",
    filled: true,
  },
  PROJECT: {
    shape:
      "h-32 w-32 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]",
    content: "max-w-[46%]",
    filled: true,
  },
  SKILL: {
    shape:
      "h-28 w-32 items-end pb-3 [clip-path:polygon(50%_4%,100%_100%,0%_100%)]",
    content: "max-w-[62%]",
    filled: true,
  },
  TECHNOLOGY: {
    shape:
      "h-28 w-32 [clip-path:polygon(25%_2%,75%_2%,100%_50%,75%_98%,25%_98%,0%_50%)]",
    content: "max-w-[68%]",
    filled: true,
  },
  RESOURCE: {
    shape: "h-16 w-16 rounded-full border-[1.5px] bg-transparent",
    content: "max-w-[80%]",
    filled: false,
  },
};

const TYPE_LABEL: Record<NodeType, string> = {
  CONCEPT: "Concept",
  PROJECT: "Project",
  SKILL: "Skill",
  TECHNOLOGY: "Technology",
  RESOURCE: "Resource",
};

const STATUS_DOT: Record<ConfidenceStatus, string> = {
  NEW: "bg-zinc-500",
  FAMILIAR: "bg-sky-400",
  LEARNING: "bg-amber-400",
  CONFIDENT: "bg-emerald-400",
  NEEDS_REVIEW: "bg-rose-400",
};

const STATUS_LABEL: Record<ConfidenceStatus, string> = {
  NEW: "New",
  FAMILIAR: "Familiar",
  LEARNING: "Learning",
  CONFIDENT: "Confident",
  NEEDS_REVIEW: "Needs review",
};

const handleClassName =
  "!h-2 !w-2 !border !border-zinc-600 !bg-zinc-500 transition-colors group-hover:!border-zinc-400";

function KnowledgeNodeComponent({
  data,
  selected,
}: NodeProps<KnowledgeFlowNode>) {
  const geometry = GEOMETRY[data.type];

  return (
    <div className="group relative flex flex-col items-center">
      <Handle type="target" position={Position.Top} className={handleClassName} />

      <div
        className={cn(
          "flex justify-center border transition-colors",
          geometry.filled
            ? "border-zinc-700 bg-zinc-900/90"
            : "border-zinc-500 bg-transparent",
          "group-hover:border-zinc-400",
          selected && "border-indigo-400 group-hover:border-indigo-400",
          geometry.shape,
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center gap-1 text-center",
            geometry.content,
          )}
        >
          <span className="line-clamp-2 text-[11px] font-medium leading-tight text-zinc-100">
            {data.title}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-zinc-500">
            {TYPE_LABEL[data.type]}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-zinc-400">
            <span
              aria-hidden
              className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[data.status])}
            />
            {STATUS_LABEL[data.status]}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className={handleClassName} />
    </div>
  );
}

export const KnowledgeNode = memo(KnowledgeNodeComponent);
export default KnowledgeNode;