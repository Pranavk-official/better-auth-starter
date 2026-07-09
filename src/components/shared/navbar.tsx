"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LuLogOut, LuSettings, LuShield, LuUser } from "react-icons/lu";
import { useAuth } from "@/context/auth";
import { ROLES } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth";
import { SignOutConfirm } from "./sign-out-button";

export const Navbar = () => {
  const { session } = useAuth();
  const router = useRouter();
  const [signOutOpen, setSignOutOpen] = useState(false);

  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === ROLES.admin;

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold">
          better-auth-starter
        </Link>
        {session ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none ring-ring ring-offset-2 focus-visible:ring-2">
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
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-1.5 py-1 text-sm font-medium">
                  {session.user.name}
                </div>
                <div className="px-1.5 pb-1 text-xs text-muted-foreground">
                  {session.user.email}
                </div>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <LuShield className="h-4 w-4" />
                    Admin dashboard
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => router.push("/profile/view")}>
                      <LuUser className="h-4 w-4" />
                      View profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile/edit")}>
                      <LuSettings className="h-4 w-4" />
                      Edit profile
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setSignOutOpen(true)}
                >
                  <LuLogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <SignOutConfirm
              open={signOutOpen}
              onOpenChange={setSignOutOpen}
              redirectTo="/"
            />
          </>
        ) : (
          <AuthModal
            trigger={
              <Button variant="default" size="sm">
                Sign in
              </Button>
            }
          />
        )}
      </div>
    </header>
  );
};
