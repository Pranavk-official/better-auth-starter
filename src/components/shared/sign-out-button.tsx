"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuLogOut } from "react-icons/lu";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";

interface SignOutConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

/**
 * Controlled sign-out confirmation. Wraps the shared `ConfirmDialog`; reused by
 * the navbar avatar menu and the admin sidebar, which render their own trigger.
 */
export const SignOutConfirm = ({
  open,
  onOpenChange,
  redirectTo = "/",
}: SignOutConfirmProps) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const confirm = () => {
    setPending(true);
    signOut({
      fetchOptions: {
        onSuccess: () => router.push(redirectTo),
        onError: () => setPending(false),
      },
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out?"
      description="You'll need to sign in again to access your account."
      confirmLabel="Sign out"
      destructive
      pending={pending}
      onConfirm={confirm}
    />
  );
};

/** Standalone button that opens the sign-out confirmation. */
export const SignOutButton = ({
  redirectTo,
  className,
}: {
  redirectTo?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <LuLogOut className="h-4 w-4" />
        Sign out
      </Button>
      <SignOutConfirm open={open} onOpenChange={setOpen} redirectTo={redirectTo} />
    </>
  );
};
