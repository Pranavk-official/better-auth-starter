"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetchProfile = async (): Promise<ProfileData> => {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
};

export const ProfileDetails = () => {
  const { data, error } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4 pb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={data.image ?? undefined} alt={data.name} />
          <AvatarFallback className="text-xl">
            {(data.name?.[0] ?? data.email[0]).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl">{data.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{data.email}</p>
        <Button variant="outline" size="sm" render={<Link href="/profile/edit" />}>
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  );
};
