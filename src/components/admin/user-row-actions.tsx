"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LuEllipsisVertical } from "react-icons/lu";
import {
  banUser,
  deleteUser,
  setUserRole,
  unbanUser,
} from "@/actions/admin";
import { ROLES, type UserRowActionsProps } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared";

export const UserRowActions = ({ user, disabled }: UserRowActionsProps) => {
  const queryClient = useQueryClient();
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isAdmin = user.role === ROLES.admin;

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      // Refetch every admin view (users list, dashboard counts, audit log).
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled || pending}
          render={
            <Button variant="ghost" size="icon-sm" aria-label="User actions">
              <LuEllipsisVertical className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() =>
              run(() =>
                setUserRole({
                  userId: user.id,
                  role: isAdmin ? ROLES.user : ROLES.admin,
                }),
              )
            }
          >
            {isAdmin ? "Demote to user" : "Promote to admin"}
          </DropdownMenuItem>
          {user.banned ? (
            <DropdownMenuItem onClick={() => run(() => unbanUser({ userId: user.id }))}>
              Unban
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => run(() => banUser({ userId: user.id }))}>
              Ban
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete user?"
        description={`This permanently deletes ${user.email} and can't be undone.`}
        confirmLabel="Delete"
        destructive
        pending={pending}
        onConfirm={() => run(() => deleteUser({ userId: user.id }))}
      />
    </>
  );
};
