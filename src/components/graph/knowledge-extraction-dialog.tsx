"use client";

import { useState, useTransition } from "react";
import type { NodeType, RelationType } from "@prisma/client";

import {
  extractKnowledgeAction,
  importKnowledgeProposalAction,
  type ImportedKnowledgeResult,
} from "@/server/actions/knowledge-extraction-actions";
import { suggestKnowledgeRelationshipsAction } from "@/server/actions/knowledge-relationship-actions";
import type { KnowledgeProposal } from "@/server/ai/types";
import type { RelationshipSuggestionProposal } from "@/server/ai/relationship-suggestion-schema";
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
type ReviewSuggestion = RelationshipSuggestionProposal["relationships"][number];

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
  const [suggestions, setSuggestions] = useState<ReviewSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasProposal, setHasProposal] = useState(false);
  const [hasRequestedSuggestions, setHasRequestedSuggestions] = useState(false);
  const [isExtracting, startExtracting] = useTransition();
  const [isSuggesting, startSuggesting] = useTransition();
  const [isImporting, startImporting] = useTransition();

  function handleExtract() {
    setError(null);
    startExtracting(async () => {
      const result = await extractKnowledgeAction({ notes });
      if (!result.success) {
        setError(result.error);
        return;
      }

      const reviewNodes = result.data.nodes.map((node) => ({
        ...node,
        selected: !node.existing,
      }));
      setNodes(reviewNodes);
      setRelationships(
        result.data.relationships.map((relationship) => ({
          ...relationship,
          selected: endpointsAreAvailable(relationship, reviewNodes),
        })),
      );
      setSuggestions([]);
      setHasRequestedSuggestions(false);
      setHasProposal(true);
    });
  }

  function updateNode(index: number, update: Partial<ReviewNode>) {
    const previousTitle = nodes[index]?.title;
    const nextNodes = nodes.map((node, nodeIndex) =>
      nodeIndex === index ? { ...node, ...update } : node,
    );
    setNodes(nextNodes);

    setRelationships((current) =>
      current.map((relationship) => {
        const renamedRelationship =
          update.title !== undefined && previousTitle && update.title !== previousTitle
            ? {
                ...relationship,
                sourceTitle:
                  relationship.sourceTitle === previousTitle
                    ? update.title
                    : relationship.sourceTitle,
                targetTitle:
                  relationship.targetTitle === previousTitle
                    ? update.title
                    : relationship.targetTitle,
              }
            : relationship;

        return endpointsAreAvailable(renamedRelationship, nextNodes)
          ? renamedRelationship
          : { ...renamedRelationship, selected: false };
      }),
    );

    setSuggestions((current) =>
      current.map((suggestion) => {
        const renamedSuggestion =
          update.title !== undefined && previousTitle && update.title !== previousTitle
            ? {
                ...suggestion,
                sourceTitle:
                  suggestion.sourceTitle === previousTitle
                    ? update.title
                    : suggestion.sourceTitle,
                targetTitle:
                  suggestion.targetTitle === previousTitle
                    ? update.title
                    : suggestion.targetTitle,
              }
            : suggestion;

        return endpointsAreAvailable(renamedSuggestion, nextNodes)
          ? renamedSuggestion
          : { ...renamedSuggestion, selected: false };
      }),
    );
  }

  function endpointsAreAvailable(
    relationship: KnowledgeProposal["relationships"][number],
    reviewNodes = nodes,
  ) {
    const source = reviewNodes.find((node) => node.title === relationship.sourceTitle);
    const target = reviewNodes.find((node) => node.title === relationship.targetTitle);
    return Boolean(
      (source?.existing || source?.selected) &&
      (target?.existing || target?.selected),
    );
  }

  const relationshipSelectable = relationships.map((relationship) =>
    endpointsAreAvailable(relationship),
  );
  const suggestionSelectable = suggestions.map(
    (suggestion) => !suggestion.existing && endpointsAreAvailable(suggestion),
  );
  const hasAnalyzableNodes = nodes.some((node) => node.existing || node.selected);
  const hasImportSelection =
    nodes.some((node) => !node.existing && node.selected) ||
    relationships.some((relationship, index) =>
      relationship.selected && relationshipSelectable[index],
    ) ||
    suggestions.some((suggestion, index) =>
      suggestion.selected && suggestionSelectable[index],
    );

  function handleSuggestRelationships() {
    setError(null);
    setSuggestions([]);
    setHasRequestedSuggestions(true);
    startSuggesting(async () => {
      const result = await suggestKnowledgeRelationshipsAction({
        notes,
        nodes: nodes.map(({ title, type, description, selected }) => ({
          title,
          type,
          description,
          selected,
        })),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuggestions(result.data.relationships);
    });
  }

  function handleImport() {
    setError(null);
    startImporting(async () => {
      const safeRelationships = relationships.map((relationship) =>
        endpointsAreAvailable(relationship)
          ? relationship
          : { ...relationship, selected: false },
      );
      const safeSuggestions = suggestions.map((suggestion) =>
        !suggestion.existing && endpointsAreAvailable(suggestion)
          ? suggestion
          : { ...suggestion, selected: false },
      );
      const result = await importKnowledgeProposalAction({
        nodes,
        relationships: [...safeRelationships, ...safeSuggestions],
      });
      if (!result.success) {
        setError(result.error);
        return;
      }

      onImported(result.data);
      setNotes("");
      setNodes([]);
      setRelationships([]);
      setSuggestions([]);
      setHasProposal(false);
      setHasRequestedSuggestions(false);
      onOpenChange(false);
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isExtracting && !isSuggesting && !isImporting) {
      setError(null);
      setHasProposal(false);
      setNodes([]);
      setRelationships([]);
      setSuggestions([]);
      setHasRequestedSuggestions(false);
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
                      checked={node.existing || node.selected}
                      disabled={node.existing}
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
                  <p className="text-xs text-zinc-500">{node.existing ? "Existing" : "New"}</p>
                </div>
              ))}
            </section>

            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSuggestRelationships}
                disabled={isSuggesting || !hasAnalyzableNodes}
              >
                {isSuggesting ? "Suggesting relationships..." : "Suggest relationships"}
              </Button>
              <p className="text-xs text-zinc-500">
                AI suggestions are not saved until you import them.
              </p>
            </div>

            <section className="grid gap-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">Relationships</h3>
              {relationships.length === 0 && <p className="text-sm text-zinc-500">No relationships proposed.</p>}
              {relationships.map((relationship, index) => (
                <label key={`${relationship.sourceTitle}-${relationship.targetTitle}-${index}`} className="flex items-center gap-3 rounded-md border border-zinc-800 p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={relationship.selected && relationshipSelectable[index]}
                    disabled={!relationshipSelectable[index]}
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

            {hasRequestedSuggestions && (
              <section className="grid gap-3">
                <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Suggested relationships
                </h3>
                {suggestions.length === 0 ? (
                  <p className="text-sm text-zinc-500">No new relationships suggested.</p>
                ) : (
                  suggestions.map((suggestion, index) => {
                    const selectable = suggestionSelectable[index];
                    return (
                      <div
                        key={`${suggestion.sourceTitle}-${suggestion.targetTitle}-${suggestion.relationType}-${index}`}
                        className="grid gap-2 rounded-md border border-zinc-800 p-3"
                      >
                        <label className="flex items-center gap-3 text-sm">
                          <input
                            type="checkbox"
                            checked={suggestion.selected && selectable}
                            disabled={!selectable}
                            onChange={(event) =>
                              setSuggestions((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, selected: event.target.checked }
                                    : item,
                                ),
                              )
                            }
                            aria-label={`Select suggested relationship from ${suggestion.sourceTitle} to ${suggestion.targetTitle}`}
                          />
                          <span className="truncate text-zinc-200">
                            {suggestion.sourceTitle}
                          </span>
                          <span className="text-xs text-zinc-500">
                            → {suggestion.relationType} →
                          </span>
                          <span className="truncate text-zinc-200">
                            {suggestion.targetTitle}
                          </span>
                        </label>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded border border-zinc-700 px-2 py-0.5 text-zinc-400">
                            {suggestion.support === "EXPLICIT" ? "Explicit" : "Inferred"}
                          </span>
                          {suggestion.existing && (
                            <span className="text-zinc-500">Already exists</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">{suggestion.evidence}</p>
                      </div>
                    );
                  })
                )}
              </section>
            )}
          </div>
        )}

        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}

        <DialogFooter>
          {hasProposal ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setHasProposal(false)}
                disabled={isImporting || isSuggesting}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={isImporting || isSuggesting || !hasImportSelection}
              >
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
