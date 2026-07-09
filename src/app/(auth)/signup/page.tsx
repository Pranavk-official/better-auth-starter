import { AuthForm } from "@/components/auth";

const SignupPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <AuthForm defaultTab="signup" />
  </div>
);

export default SignupPage;
