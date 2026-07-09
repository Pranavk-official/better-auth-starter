"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/zod/auth.zod";
import { ROLES, type SignInFormProps } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export const SignInForm = ({ redirectTo }: SignInFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setNotice(null);
    const isEmail = data.identifier.includes("@");

    const result = isEmail
      ? await signIn.email({
          email: data.identifier,
          password: data.password,
          callbackURL: redirectTo,
        })
      : await signIn.username({
          username: data.identifier,
          password: data.password,
          callbackURL: redirectTo,
        });

    if (result?.error) {
      // Unverified accounts are rejected here; Better Auth has already
      // re-sent the verification link (sendOnSignIn), so guide the user.
      if (result.error.code === "EMAIL_NOT_VERIFIED") {
        setNotice(
          "Please verify your email first — we just sent you a fresh verification link.",
        );
        return;
      }
      setError(result.error.message ?? "Invalid credentials");
      return;
    }
    // Read the role from the fresh session (the sign-in result doesn't reliably
    // include it) and send admins straight to the admin area.
    const { data: session } = await getSession();
    const isAdmin =
      (session?.user as { role?: string } | undefined)?.role === ROLES.admin;
    router.push(isAdmin ? "/admin" : redirectTo);
  };

  return (
    <div className="space-y-4">
      {notice && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {notice}
        </p>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Email or username</Label>
          <Input
            id="identifier"
            placeholder="you@example.com or yourname"
            autoComplete="username"
            {...form.register("identifier")}
          />
          {form.formState.errors.identifier && (
            <p className="text-xs text-destructive">
              {form.formState.errors.identifier.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signin-password">Password</Label>
          <PasswordInput
            id="signin-password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
};
