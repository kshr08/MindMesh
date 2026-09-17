"use server";

import { revalidatePath } from "next/cache";
import type { KnowledgeRelation } from "@prisma/client";
import type { ZodError } from "zod";

import { CURRENT_USER_ID } from "@/lib/current-user";
import {
  createKnowledgeRelationSchema,
  deleteKnowledgeRelationSchema,
} from "@/lib/validation/knowledge-relation";
import {
  createKnowledgeRelation,
  deleteKnowledgeRelation,
} from "@/server/services/knowledge-graph-service";
import type { ActionResult } from "@/server/actions/knowledge-node-actions";

/**
 * Thin Server Action layer, mirroring the node CRUD actions exactly:
 * validate → call service → return a structured ActionResult (never a
 * thrown error) the client can render.
 */

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string[]> = {};
  for (const key in flat) {
    const value = flat[key as keyof typeof flat];
    if (value) result[key] = value;
  }
  return result;
}

export async function createKnowledgeRelationAction(
  input: unknown,
): Promise<ActionResult<KnowledgeRelation>> {
  const parsed = createKnowledgeRelationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please choose a valid relationship.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    const result = await createKnowledgeRelation(CURRENT_USER_ID, parsed.data);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/graph");
    return { success: true, data: result.relation };
  } catch (error) {
    console.error("createKnowledgeRelationAction failed", error);
    return { success: false, error: "Could not create the relationship. Please try again." };
  }
}

export async function deleteKnowledgeRelationAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteKnowledgeRelationSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid request." };
  }

  try {
    const deleted = await deleteKnowledgeRelation(CURRENT_USER_ID, parsed.data.id);

    if (!deleted) {
      return { success: false, error: "That relationship no longer exists." };
    }

    revalidatePath("/graph");
    return { success: true, data: { id: parsed.data.id } };
  } catch (error) {
    console.error("deleteKnowledgeRelationAction failed", error);
    return { success: false, error: "Could not delete the relationship. Please try again." };
  }
}