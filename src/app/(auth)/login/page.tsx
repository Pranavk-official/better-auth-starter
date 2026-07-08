import { LoginForm } from "@/components/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  // Only honor internal paths to avoid open-redirect abuse.
  const redirectTo = redirect?.startsWith("/") ? redirect : "/landing";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
