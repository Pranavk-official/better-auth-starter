import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";
import { AuthForm } from "@/components/auth";
import { Button } from "@/components/ui/button";

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) => {
  const { redirect } = await searchParams;
  // Only honor internal paths to avoid open-redirect abuse.
  const redirectTo = redirect?.startsWith("/") ? redirect : "/";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background">
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-4 top-4"
        render={<Link href="/" />}
      >
        <LuArrowLeft className="h-4 w-4" />
        Back to home
      </Button>
      <AuthForm defaultTab="signin" redirectTo={redirectTo} />
    </div>
  );
};

export default LoginPage;
