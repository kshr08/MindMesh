"use client";

import { useState, useTransition } from "react";
import type { ConfidenceStatus, NodeType } from "@prisma/client";

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
import { TITLE_MAX_LENGTH } from "@/lib/validation/knowledge-node";
import {
  createKnowledgeNodeAction,
  updateKnowledgeNodeAction,
} from "@/server/actions/knowledge-node-actions";
import type { KnowledgeFlowNode } from "@/types/graph-flow";

const NODE_TYPE_OPTIONS: { value: NodeType; label: string }[] = [
  { value: "CONCEPT", label: "Concept" },
  { value: "PROJECT", label: "Project" },
  { value: "SKILL", label: "Skill" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "RESOURCE", label: "Resource" },
];

const STATUS_OPTIONS: { value: ConfidenceStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "FAMILIAR", label: "Familiar" },
  { value: "LEARNING", label: "Learning" },
  { value: "CONFIDENT", label: "Confident" },
  { value: "NEEDS_REVIEW", label: "Needs review" },
];

interface NodeFormValues {
  title: string;
  type: NodeType;
  status: ConfidenceStatus;
  description: string;
}

const EMPTY_VALUES: NodeFormValues = {
  title: "",
  type: "CONCEPT",
  status: "NEW",
  description: "",
};

export interface CreatedNodeResult {
  id: string;
  title: string;
  type: NodeType;
  status: ConfidenceStatus;
  description: string | null;
}

interface NodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  node?: KnowledgeFlowNode | null;
  onCreated?: (node: CreatedNodeResult) => void;
  onUpdated?: (node: CreatedNodeResult) => void;
}

export function NodeFormDialog({
  open,
  onOpenChange,
  mode,
  node,
  onCreated,
  onUpdated,
}: NodeFormDialogProps) {
  const [values, setValues] = useState<NodeFormValues>(() => {
    if (mode === "edit" && node) {
      return {
        title: node.data.title,
        type: node.data.type,
        status: node.data.status,
        description: node.data.description ?? "",
      };
    }

    return EMPTY_VALUES;
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const payload = {
      title: values.title,
      type: values.type,
      status: values.status,
      description: values.description.trim() === "" ? null : values.description,
    };

    startTransition(async () => {
      const result =
        mode === "edit" && node
          ? await updateKnowledgeNodeAction({ id: node.id, ...payload })
          : await createKnowledgeNodeAction(payload);

      if (!result.success) {
        setFormError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }

      if (mode === "edit") {
        onUpdated?.(result.data);
      } else {
        onCreated?.(result.data);
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit node" : "Add node"}</DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? "Update this knowledge node."
                : "Add a new concept, project, skill, technology, or resource to your graph."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="node-title">Title</Label>
              <Input
                id="node-title"
                value={values.title}
                maxLength={TITLE_MAX_LENGTH}
                onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.title)}
                autoFocus
                required
              />
              {fieldErrors.title?.map((msg) => (
                <p key={msg} className="text-xs text-rose-400">
                  {msg}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="node-type">Type</Label>
                <SelectNative
                  id="node-type"
                  value={values.type}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, type: e.target.value as NodeType }))
                  }
                >
                  {NODE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectNative>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="node-status">Confidence</Label>
                <SelectNative
                  id="node-status"
                  value={values.status}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      status: e.target.value as ConfidenceStatus,
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectNative>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="node-description">Description</Label>
              <Textarea
                id="node-description"
                value={values.description}
                onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.description)}
              />
              {fieldErrors.description?.map((msg) => (
                <p key={msg} className="text-xs text-rose-400">
                  {msg}
                </p>
              ))}
            </div>

            {formError && (
              <p role="alert" className="text-sm text-rose-400">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : mode === "edit" ? "Save changes" : "Add node"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}