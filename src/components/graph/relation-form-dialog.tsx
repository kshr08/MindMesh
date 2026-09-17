"use client";

import { useState, useTransition } from "react";
import type { RelationType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { RELATION_TYPE_OPTIONS } from "@/lib/validation/knowledge-relation";
import { createKnowledgeRelationAction } from "@/server/actions/knowledge-relation-actions";

export interface PendingConnection {
  sourceId: string;
  sourceTitle: string;
  targetId: string;
  targetTitle: string;
}

export interface CreatedRelationResult {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: RelationType;
}

interface RelationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: PendingConnection | null;
  onCreated: (relation: CreatedRelationResult) => void;
}

export function RelationFormDialog({
  open,
  onOpenChange,
  connection,
  onCreated,
}: RelationFormDialogProps) {
  const [relationType, setRelationType] = useState<RelationType>("RELATED_TO");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!connection) return;
    setError(null);

    startTransition(async () => {
      const result = await createKnowledgeRelationAction({
        sourceId: connection.sourceId,
        targetId: connection.targetId,
        relationType,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onCreated({
        id: result.data.id,
        sourceId: result.data.sourceId,
        targetId: result.data.targetId,
        relationType: result.data.relationType,
      });
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect nodes</DialogTitle>
            <DialogDescription>
              Choose how these two nodes relate to each other.
            </DialogDescription>
          </DialogHeader>

          {connection && (
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-2 text-center text-sm text-zinc-300">
                <span className="w-full truncate rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                  {connection.sourceTitle}
                </span>
                <span aria-hidden className="text-zinc-600">
                  ↓
                </span>
                <div className="grid w-full gap-1.5 px-2">
                  <Label htmlFor="relation-type" className="sr-only">
                    Relationship type
                  </Label>
                  <SelectNative
                    id="relation-type"
                    value={relationType}
                    onChange={(e) => setRelationType(e.target.value as RelationType)}
                    autoFocus
                  >
                    {RELATION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </SelectNative>
                </div>
                <span aria-hidden className="text-zinc-600">
                  ↓
                </span>
                <span className="w-full truncate rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                  {connection.targetTitle}
                </span>
              </div>

              {error && (
                <p role="alert" className="text-sm text-rose-400">
                  {error}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !connection}>
              {isPending ? "Connecting..." : "Create relationship"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}