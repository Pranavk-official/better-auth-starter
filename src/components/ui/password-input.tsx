"use client";

import * as React from "react";
import { useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Password field with a show/hide toggle. Forwards all native input props
 * (including the ref from react-hook-form's `register`) to the inner Input.
 */
export const PasswordInput = ({
  className,
  ...props
}: React.ComponentProps<"input">) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-9", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-2.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
      >
        {visible ? (
          <LuEyeOff className="h-4 w-4" />
        ) : (
          <LuEye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};
