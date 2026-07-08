"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/zod/auth.zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function LoginForm({ redirectTo = "/landing" }: { redirectTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  async function onGoogleSignIn() {
    await signIn.social({ provider: "google", callbackURL: redirectTo });
  }

  async function onCredentialsSignIn(data: LoginInput) {
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
    router.push(redirectTo);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {notice}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onGoogleSignIn}
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={form.handleSubmit(onCredentialsSignIn)} className="space-y-3">
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
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

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

// ponytail: inline SVG over adding an icon library dependency
function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="mr-2 h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
