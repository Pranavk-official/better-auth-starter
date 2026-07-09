import type { ReactNode } from "react";

/** Which tab the auth surface shows first. */
export type AuthTab = "signin" | "signup";

export interface AuthFormProps {
  defaultTab?: AuthTab;
  redirectTo?: string;
  className?: string;
}

export interface AuthModalProps {
  trigger: ReactNode;
  defaultTab?: AuthTab;
  redirectTo?: string;
}

export interface GoogleButtonProps {
  redirectTo: string;
}

export interface SignInFormProps {
  redirectTo: string;
}

export interface SignUpFormProps {
  /** Called when the user asks to jump back to the sign-in tab. */
  onDone: () => void;
}
