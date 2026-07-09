"use client";

import { FcGoogle } from "react-icons/fc";
import { signIn } from "@/lib/auth-client";
import type { GoogleButtonProps } from "@/lib/types";
import { Button } from "@/components/ui/button";

export const GoogleButton = ({ redirectTo }: GoogleButtonProps) => (
  <Button
    type="button"
    variant="outline"
    className="w-full"
    onClick={() => signIn.social({ provider: "google", callbackURL: redirectTo })}
  >
    <FcGoogle className="mr-2 h-4 w-4" />
    Continue with Google
  </Button>
);
