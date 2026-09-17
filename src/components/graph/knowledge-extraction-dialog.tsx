"use client";

import { useState, useTransition } from "react";
import type { NodeType, RelationType } from "@prisma/client";

import {
  extractKnowledgeAction,
  importKnowledgeProposalAction,
  type ImportedKnowledgeResult,
} from "@/server/actions/knowledge-extraction-actions";
import type { KnowledgeProposal } from "@/server/ai/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";

const NODE_TYPES: { value: NodeType; label: string }[] = [
  { value: "CONCEPT", label: "Concept" },
  { value: "PROJECT", label: "Project" },
  { value: "SKILL", label: "Skill" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "RESOURCE", label: "Resource" },
];

const RELATION_TYPES: { value: RelationType; label: string }[] = [
  { value: "USES", label: "Uses" },
  { value: "DEPENDS_ON", label: "Depends on" },
  { value: "PREREQUISITE_FOR", label: "Prerequisite for" },
  { value: "RELATED_TO", label: "Related to" },
  { value: "PART_OF", label: "Part of" },
  { value: "LEARNED_THROUGH", label: "Learned through" },
  { value: "IMPLEMENTED_IN", label: "Implemented in" },
  { value: "SIMILAR_TO", label: "Similar to" },
];

type ReviewNode = KnowledgeProposal["nodes"][number] & { selected: boolean };
type ReviewRelationship = KnowledgeProposal["relationships"][number] & { selected: boolean };

interface KnowledgeExtractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (result: ImportedKnowledgeResult) => void;
}

export function KnowledgeExtractionDialog({
  open,
  onOpenChange,
  onImported,
}: KnowledgeExtractionDialogProps) {
  const [notes, setNotes] = useState("");
  const [nodes, setNodes] = useState<ReviewNode[]>([]);
  const [relationships, setRelationships] = useState<ReviewRelationship[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasProposal, setHasProposal] = useState(false);
  const [isExtracting, startExtracting] = useTransition();
  const [isImporting, startImporting] = useTransition();

  function handleExtract() {
    setError(null);
    startExtracting(async () => {
      const result = await extractKnowledgeAction({ notes });
      if (!result.success) {
        setError(result.error);
        return;
      }

      setNodes(result.data.nodes.map((node) => ({ ...node, selected: true })));
      setRelationships(result.data.relationships.map((relationship) => ({ ...relationship, selected: true })));
      setHasProposal(true);
    });
  }

  function updateNode(index: number, update: Partial<ReviewNode>) {
    const previousTitle = nodes[index]?.title;
    setNodes((current) =>
      current.map((node, nodeIndex) => (nodeIndex === index ? { ...node, ...update } : node)),
    );
    if (update.title && previousTitle && update.title !== previousTitle) {
      setRelationships((current) =>
        current.map((relationship) => ({
          ...relationship,
          sourceTitle: relationship.sourceTitle === previousTitle ? update.title! : relationship.sourceTitle,
          targetTitle: relationship.targetTitle === previousTitle ? update.title! : relationship.targetTitle,
        })),
      );
    }
  }

  function handleImport() {
    setError(null);
    startImporting(async () => {
      const result = await importKnowledgeProposalAction({ nodes, relationships });
      if (!result.success) {
        setError(result.error);
        return;
      }

      onImported(result.data);
      setNotes("");
      setNodes([]);
      setRelationships([]);
      setHasProposal(false);
      onOpenChange(false);
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isExtracting && !isImporting) {
      setError(null);
      setHasProposal(false);
      setNodes([]);
      setRelationships([]);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extract knowledge</DialogTitle>
          <DialogDescription>
            Paste notes, documentation, or project context and MindMesh will suggest concepts and relationships for your graph.
          </DialogDescription>
        </DialogHeader>

        {!hasProposal ? (
          <div className="grid gap-2">
            <Label htmlFor="knowledge-notes">Notes</Label>
            <Textarea
              id="knowledge-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="I have been learning React and TypeScript..."
              className="min-h-40"
              maxLength={12000}
            />
            <p className="text-xs text-zinc-500">Nothing is saved until you review and import the proposal.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <p className="text-xs text-zinc-500">Review the proposal. Only selected items will be added to your graph.</p>
            <section className="grid gap-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">Nodes</h3>
              {nodes.length === 0 && <p className="text-sm text-zinc-500">No nodes proposed.</p>}
              {nodes.map((node, index) => (
                <div key={`${node.title}-${index}`} className="grid gap-2 rounded-md border border-zinc-800 p-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={node.selected}
                      onChange={(event) => updateNode(index, { selected: event.target.checked })}
                      aria-label={`Select ${node.title}`}
                    />
                    <Input
                      value={node.title}
                      onChange={(event) => updateNode(index, { title: event.target.value })}
                      className="h-8"
                      aria-label="Proposed node title"
                    />
                    <SelectNative
                      value={node.type}
                      onChange={(event) => updateNode(index, { type: event.target.value as NodeType })}
                      className="h-8 w-32 text-xs"
                      aria-label="Proposed node type"
                    >
                      {NODE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </SelectNative>
                  </div>
                  <Textarea
                    value={node.description ?? ""}
                    onChange={(event) => updateNode(index, { description: event.target.value || null })}
                    placeholder="Optional description"
                    className="min-h-16 text-xs"
                    aria-label="Proposed node description"
                  />
                  <p className="text-xs text-zinc-500">{node.existing ? "Already exists in your graph" : "New"}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">Relationships</h3>
              {relationships.length === 0 && <p className="text-sm text-zinc-500">No relationships proposed.</p>}
              {relationships.map((relationship, index) => (
                <label key={`${relationship.sourceTitle}-${relationship.targetTitle}-${index}`} className="flex items-center gap-3 rounded-md border border-zinc-800 p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={relationship.selected}
                    onChange={(event) =>
                      setRelationships((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, selected: event.target.checked } : item))
                    }
                    aria-label={`Select relationship from ${relationship.sourceTitle} to ${relationship.targetTitle}`}
                  />
                  <span className="truncate text-zinc-200">{relationship.sourceTitle}</span>
                  <SelectNative
                    value={relationship.relationType}
                    onChange={(event) => setRelationships((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, relationType: event.target.value as RelationType } : item))}
                    className="h-8 w-36 text-xs"
                    aria-label="Proposed relationship type"
                  >
                    {RELATION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </SelectNative>
                  <span className="truncate text-zinc-200">{relationship.targetTitle}</span>
                </label>
              ))}
            </section>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}

        <DialogFooter>
          {hasProposal ? (
            <>
              <Button type="button" variant="outline" onClick={() => setHasProposal(false)} disabled={isImporting}>Back</Button>
              <Button type="button" onClick={handleImport} disabled={isImporting || nodes.every((node) => !node.selected)}>
                {isImporting ? "Adding to your graph..." : "Import selected"}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={handleExtract} disabled={isExtracting || !notes.trim()}>
              {isExtracting ? "Mapping your knowledge..." : "Extract knowledge"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
