"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, signupAction } from "@/server/actions/auth-actions";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const isSignup = mode === "signup";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = isSignup
        ? await signupAction({ email, password, confirmPassword })
        : await loginAction({ email, password });

      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      router.replace("/graph");
      router.refresh();
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            MindMesh
          </p>
          <h1 className="mt-3 text-2xl font-medium">
            {isSignup ? "Create your graph space" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {isSignup
              ? "Start mapping the knowledge that matters to you."
              : "Sign in to continue to your knowledge graph."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl"
        >
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                required
              />
              {fieldErrors.email?.map((message) => (
                <p key={message} className="text-xs text-rose-400">
                  {message}
                </p>
              ))}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                aria-invalid={Boolean(fieldErrors.password)}
                required
              />
              {fieldErrors.password?.map((message) => (
                <p key={message} className="text-xs text-rose-400">
                  {message}
                </p>
              ))}
            </div>

            {isSignup && (
              <div className="grid gap-1.5">
                <Label htmlFor="auth-confirm-password">Confirm password</Label>
                <Input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  required
                />
                {fieldErrors.confirmPassword?.map((message) => (
                  <p key={message} className="text-xs text-rose-400">
                    {message}
                  </p>
                ))}
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-rose-400">
                {error}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="mt-2 w-full">
              {isPending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          {isSignup ? "Already have an account?" : "New to MindMesh?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="text-zinc-200 underline-offset-4 hover:underline"
          >
            {isSignup ? "Log in" : "Create an account"}
          </Link>
        </p>
      </div>
    </main>
  );
}
