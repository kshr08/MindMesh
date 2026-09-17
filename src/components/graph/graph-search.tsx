"use client";

import type { NodeType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KnowledgeFlowNode } from "@/types/graph-flow";

const TYPE_LABEL: Record<NodeType, string> = {
  CONCEPT: "Concept",
  PROJECT: "Project",
  SKILL: "Skill",
  TECHNOLOGY: "Technology",
  RESOURCE: "Resource",
};

interface GraphSearchProps {
  query: string;
  nodes: KnowledgeFlowNode[];
  onQueryChange: (query: string) => void;
  onSelect: (node: KnowledgeFlowNode) => void;
}

export function GraphSearch({
  query,
  nodes,
  onQueryChange,
  onSelect,
}: GraphSearchProps) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? nodes.filter((node) => node.data.title.toLowerCase().includes(normalizedQuery))
    : [];

  return (
    <div className="relative w-64">
      <label htmlFor="graph-search" className="sr-only">
        Search knowledge nodes
      </label>
      <Input
        id="graph-search"
        value={query}
        placeholder="Search knowledge..."
        onChange={(event) => onQueryChange(event.target.value)}
        className="pr-16"
        autoComplete="off"
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onQueryChange("")}
          className="absolute right-1 top-1 h-7 px-2 text-zinc-400 hover:text-zinc-100"
          aria-label="Clear search"
        >
          Clear
        </Button>
      )}

      {normalizedQuery && (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-11 z-30 max-h-64 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/95 p-1 shadow-xl backdrop-blur-sm"
        >
          {results.length > 0 ? (
            results.map((node) => (
              <button
                key={node.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onSelect(node)}
                className="flex w-full items-center justify-between gap-3 rounded px-2 py-2 text-left hover:bg-zinc-800 focus-visible:bg-zinc-800 focus-visible:outline-none"
              >
                <span className="truncate text-sm text-zinc-100">{node.data.title}</span>
                <span className="shrink-0 text-[11px] text-zinc-500">
                  {TYPE_LABEL[node.data.type]}
                </span>
              </button>
            ))
          ) : (
            <p className="px-2 py-3 text-xs text-zinc-500">No matching nodes</p>
          )}
        </div>
      )}
    </div>
  );
}
