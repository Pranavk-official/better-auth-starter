import Link from "next/link";
import { getServerSession } from "@/lib/helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfileViewPage() {
  const session = await getServerSession();
  // Layout already redirects if no session; this satisfies TypeScript
  if (!session) return null;

  const { user } = session;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader className="flex-row items-center gap-4 pb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-xl">
              {(user.name?.[0] ?? user.email[0]).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Button variant="outline" size="sm" render={<Link href="/profile/edit" />}>
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
