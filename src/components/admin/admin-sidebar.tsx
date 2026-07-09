"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuLayoutDashboard,
  LuLogOut,
  LuPanelLeft,
  LuPanelLeftClose,
  LuScrollText,
  LuUsers,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignOutConfirm } from "@/components/shared";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LuLayoutDashboard },
  { href: "/admin/users", label: "Users", icon: LuUsers },
  { href: "/admin/audit", label: "Audit log", icon: LuScrollText },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r bg-background transition-[width] duration-200",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className="flex h-14 items-center justify-between px-3">
        {!collapsed && <span className="font-semibold">Admin</span>}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <LuPanelLeft /> : <LuPanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          // "/admin" is the dashboard index — match it exactly, not as a prefix.
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="destructive"
          size={collapsed ? "icon-sm" : "sm"}
          onClick={() => setSignOutOpen(true)}
          title={collapsed ? "Sign out" : undefined}
          className={cn("text-muted-foreground", !collapsed && "w-full justify-start")}
        >
          <LuLogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Sign out"}
        </Button>
      </div>

      <SignOutConfirm
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        redirectTo="/login"
      />
    </aside>
  );
};
