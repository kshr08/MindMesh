"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ConfidenceStatus, NodeType } from "@prisma/client";

import { cn } from "@/lib/utils";
import type { KnowledgeFlowNode } from "@/types/graph-flow";

interface NodeVisual {
  shape: string;
  filled: boolean;
  contentWidthClassName: string;
  titleSizeClassName: string;
  compact: boolean;
}

const GEOMETRY: Record<Exclude<NodeType, "SKILL">, NodeVisual> = {
  CONCEPT: {
    shape: "h-28 w-28 rounded-full items-center justify-center",
    filled: true,
    contentWidthClassName: "w-[74px]",
    titleSizeClassName: "text-[11px]",
    compact: false,
  },
  PROJECT: {
    shape:
      "h-32 w-32 items-center justify-center [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]",
    filled: true,
    contentWidthClassName: "w-[74px]",
    titleSizeClassName: "text-[10px]",
    compact: false,
  },
  TECHNOLOGY: {
    shape:
      "h-28 w-32 items-center justify-center [clip-path:polygon(25%_2%,75%_2%,100%_50%,75%_98%,25%_98%,0%_50%)]",
    filled: true,
    contentWidthClassName: "w-[80px]",
    titleSizeClassName: "text-[10px]",
    compact: false,
  },
  RESOURCE: {
    shape:
      "h-16 w-16 rounded-full border-[1.5px] bg-transparent items-center justify-center",
    filled: false,
    contentWidthClassName: "w-[48px]",
    titleSizeClassName: "text-[9px]",
    compact: true,
  },
};

const SKILL_OUTER = "h-28 w-32";
const SKILL_CLIP_PATH = "[clip-path:polygon(50%_4%,100%_100%,0%_100%)]";

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
  return (
    <div className="group relative flex flex-col items-center">
      <Handle type="target" position={Position.Top} className={handleClassName} />

      {data.type === "SKILL" ? (
        <div className={cn("relative", SKILL_OUTER)}>
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 border transition-colors",
              "border-zinc-700 bg-zinc-900/90",
              "group-hover:border-zinc-400",
              selected && "border-indigo-400 group-hover:border-indigo-400",
              SKILL_CLIP_PATH,
            )}
          />
          <div className="absolute inset-x-0 bottom-2 flex flex-col items-center gap-0.5 px-3 text-center">
            <span className="block w-full truncate text-[10px] font-medium leading-tight text-zinc-100">
              {data.title}
            </span>
            <span className="flex items-center gap-1">
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  STATUS_DOT[data.status],
                )}
              />
            </span>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex border transition-colors",
            GEOMETRY[data.type].filled
              ? "border-zinc-700 bg-zinc-900/90"
              : "border-zinc-500 bg-transparent",
            "group-hover:border-zinc-400",
            selected && "border-indigo-400 group-hover:border-indigo-400",
            GEOMETRY[data.type].shape,
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center gap-0.5 text-center",
              GEOMETRY[data.type].contentWidthClassName,
            )}
          >
            <span
              className={cn(
                GEOMETRY[data.type].compact
                  ? "block w-full truncate"
                  : "line-clamp-2 w-full",
                "font-medium leading-tight text-zinc-100",
                GEOMETRY[data.type].titleSizeClassName,
              )}
            >
              {data.title}
            </span>

            {!GEOMETRY[data.type].compact && (
              <span className="text-[9px] uppercase tracking-wide text-zinc-500">
                {TYPE_LABEL[data.type]}
              </span>
            )}

            <span
              className={cn(
                "flex items-center gap-1 text-zinc-400",
                GEOMETRY[data.type].compact ? "text-[8px]" : "text-[9px]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  STATUS_DOT[data.status],
                )}
              />
              {!GEOMETRY[data.type].compact && STATUS_LABEL[data.status]}
            </span>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className={handleClassName} />
    </div>
  );
}

export const KnowledgeNode = memo(KnowledgeNodeComponent);
export default KnowledgeNode;