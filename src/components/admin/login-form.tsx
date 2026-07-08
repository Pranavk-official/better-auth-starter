"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { adminLoginSchema, type AdminLoginInput } from "@/lib/zod/admin.zod";
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

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  async function onSubmit(data: AdminLoginInput) {
    setError(null);
    const isEmail = data.identifier.includes("@");

    const result = isEmail
      ? await signIn.email({
          email: data.identifier,
          password: data.password,
          callbackURL: "/admin/dashboard",
        })
      : await signIn.username({
          username: data.identifier,
          password: data.password,
          callbackURL: "/admin/dashboard",
        });

    if (result?.error) {
      setError(result.error.message ?? "Invalid credentials");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Admin Sign in</CardTitle>
        <CardDescription>Enter your email or username</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Email or username</Label>
            <Input
              id="identifier"
              placeholder="admin@example.com or admin"
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
      </CardContent>
    </Card>
  );
}
