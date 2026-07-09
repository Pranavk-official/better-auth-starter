"use client";

import type { AuthModalProps } from "@/lib/types";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "./auth-form";

/**
 * Auth in a modal. `trigger` opens it (e.g. the navbar "Sign in" button);
 * the body reuses the same <AuthForm /> the /login and /signup pages render.
 */
export const AuthModal = ({
  trigger,
  defaultTab = "signin",
  redirectTo = "/landing",
}: AuthModalProps) => (
  <Dialog>
    <DialogTrigger render={trigger as React.ReactElement} />
    <DialogContent>
      <AuthForm defaultTab={defaultTab} redirectTo={redirectTo} />
    </DialogContent>
  </Dialog>
);
