"use client";

import { useAuth } from "@/context/auth";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { session } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-4">
        <Link href="/landing" className="font-semibold text-sm">
          better-auth-starter
        </Link>
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 ring-ring cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session.user.image ?? undefined}
                  alt={session.user.name}
                />
                <AvatarFallback>
                  {(session.user.name?.[0] ?? session.user.email[0]).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-1.5 py-1 text-sm font-medium">{session.user.name}</div>
              <div className="px-1.5 pb-1 text-xs text-muted-foreground">
                {session.user.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile/view")}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/profile/edit")}>
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  signOut({
                    fetchOptions: { onSuccess: () => router.push("/landing") },
                  })
                }
                variant="destructive"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/login" />}
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
