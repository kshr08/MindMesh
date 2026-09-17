"use server";

import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { loginSchema, signupSchema } from "@/lib/validation/auth";
import type { ActionResult } from "@/server/actions/knowledge-node-actions";

export async function loginAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter a valid email and password." };

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });

    if (result?.error) return { success: false, error: "Invalid email or password." };
    return { success: true, data: null };
  } catch (error) {
    if (isCredentialsSigninError(error)) {
      return { success: false, error: "Invalid email or password." };
    }
    console.error("loginAction failed", error);
    return { success: false, error: "Invalid email or password." };
  }
}

export async function signupAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: Object.fromEntries(
        Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1])),
      ),
    };
  }

  const email = parsed.data.email.toLowerCase();
  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await db.user.create({
      data: { email, passwordHash },
    });

    const result = await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
    if (result?.error) return { success: false, error: "Account created, but sign-in failed." };

    return { success: true, data: null };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Unable to create that account." };
    }
    console.error("signupAction failed", error);
    return { success: false, error: "Could not create the account. Please try again." };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002",
  );
}

function isCredentialsSigninError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "type" in error &&
      error.type === "CredentialsSignin",
  );
}
