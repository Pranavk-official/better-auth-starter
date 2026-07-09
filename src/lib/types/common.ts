import type { ReactNode } from "react";

/** Shape returned by `GET /api/profile`. */
export interface ProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface EditProfileFormProps {
  defaultValues: { name: string; image: string };
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as destructive (red). */
  destructive?: boolean;
  /** Keep the dialog open + disable buttons while the action runs. */
  pending?: boolean;
  onConfirm: () => void;
}
