import { AuthForm } from "@/components/auth";

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) => {
  const { redirect } = await searchParams;
  // Only honor internal paths to avoid open-redirect abuse.
  const redirectTo = redirect?.startsWith("/") ? redirect : "/landing";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthForm defaultTab="signin" redirectTo={redirectTo} />
    </div>
  );
};

export default LoginPage;
