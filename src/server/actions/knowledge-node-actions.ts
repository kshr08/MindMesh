"use server";

import { revalidatePath } from "next/cache";
import type { KnowledgeNode } from "@prisma/client";
import type { ZodError } from "zod";

import { CURRENT_USER_ID } from "@/lib/current-user";
import {
  createKnowledgeNodeSchema,
  deleteKnowledgeNodeSchema,
  updateKnowledgeNodeSchema,
} from "@/lib/validation/knowledge-node";
import {
  createKnowledgeNode,
  deleteKnowledgeNode,
  updateKnowledgeNode,
} from "@/server/services/knowledge-graph-service";

/**
 * Thin Server Action layer: validate → call service → return a
 * structured result the client can render (never a thrown error).
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string[]> = {};
  for (const key in flat) {
    const value = flat[key as keyof typeof flat];
    if (value) result[key] = value;
  }
  return result;
}

export async function createKnowledgeNodeAction(
  input: unknown,
): Promise<ActionResult<KnowledgeNode>> {
  const parsed = createKnowledgeNodeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    const node = await createKnowledgeNode(CURRENT_USER_ID, parsed.data);
    revalidatePath("/graph");
    return { success: true, data: node };
  } catch (error) {
    console.error("createKnowledgeNodeAction failed", error);
    return { success: false, error: "Could not create the node. Please try again." };
  }
}

export async function updateKnowledgeNodeAction(
  input: unknown,
): Promise<ActionResult<KnowledgeNode>> {
  const parsed = updateKnowledgeNodeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    const node = await updateKnowledgeNode(CURRENT_USER_ID, parsed.data);

    if (!node) {
      return { success: false, error: "That node no longer exists." };
    }

    revalidatePath("/graph");
    return { success: true, data: node };
  } catch (error) {
    console.error("updateKnowledgeNodeAction failed", error);
    return { success: false, error: "Could not update the node. Please try again." };
  }
}

export async function deleteKnowledgeNodeAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteKnowledgeNodeSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid request." };
  }

  try {
    const deleted = await deleteKnowledgeNode(CURRENT_USER_ID, parsed.data.id);

    if (!deleted) {
      return { success: false, error: "That node no longer exists." };
    }

    revalidatePath("/graph");
    return { success: true, data: { id: parsed.data.id } };
  } catch (error) {
    console.error("deleteKnowledgeNodeAction failed", error);
    return { success: false, error: "Could not delete the node. Please try again." };
  }
}