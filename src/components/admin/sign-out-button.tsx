"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AdminSignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        signOut({ fetchOptions: { onSuccess: () => router.push("/login") } })
      }
    >
      Sign out
    </Button>
  );
}
