"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteKnowledgeNodeAction } from "@/server/actions/knowledge-node-actions";
import type { KnowledgeFlowNode } from "@/types/graph-flow";

interface DeleteNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: KnowledgeFlowNode | null;
  onDeleted?: (id: string) => void;
}

export function DeleteNodeDialog({
  open,
  onOpenChange,
  node,
  onDeleted,
}: DeleteNodeDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!node) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteKnowledgeNodeAction({ id: node.id });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onDeleted?.(node.id);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{node?.data.title}&rdquo;?</DialogTitle>
          <DialogDescription>
            This permanently deletes this node and any relationships connected to
            it. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="text-sm text-rose-400">
            {error}
          </p>
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete node"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}