"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { profileSchema, type ProfileInput } from "@/lib/zod/profile.zod";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditProfileFormProps {
  defaultValues: ProfileInput;
}

export function EditProfileForm({ defaultValues }: EditProfileFormProps) {
  const router = useRouter();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: ProfileInput) => updateProfile(data),
    onSuccess: () => router.push("/profile/view"),
  });

  return (
    <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="image">Avatar URL</Label>
        <Input
          id="image"
          type="url"
          placeholder="https://example.com/avatar.png"
          {...form.register("image")}
        />
        {form.formState.errors.image && (
          <p className="text-xs text-destructive">
            {form.formState.errors.image.message}
          </p>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive">{(error as Error).message}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
