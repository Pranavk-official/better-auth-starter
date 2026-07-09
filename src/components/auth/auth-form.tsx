"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AuthFormProps, AuthTab } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleButton } from "./google-button";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

/**
 * Single auth surface used by both the /login and /signup pages and the
 * navbar modal. Tabs switch between sign in and sign up in place.
 */
export const AuthForm = ({
  defaultTab = "signin",
  redirectTo = "/",
  className,
}: AuthFormProps) => {
  const [tab, setTab] = useState<AuthTab>(defaultTab);

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>Sign in or create an account to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleButton redirectTo={redirectTo} />

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as AuthTab)}>
          <TabsList>
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="pt-4">
            <SignInForm redirectTo={redirectTo} />
          </TabsContent>
          <TabsContent value="signup" className="pt-4">
            <SignUpForm onDone={() => setTab("signin")} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
