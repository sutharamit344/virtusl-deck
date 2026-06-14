import { JSX, ReactNode } from "react";
import { X } from "lucide-react";
import Button from "./Button";

type CommonDialogProps = {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  showCloseButton?: boolean;
  isLoading?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg";
};

const widthMap = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function CommonDialog({
  open,
  onClose,
  title,
  children,
  actions,
  showCloseButton = true,
  isLoading = false,
  maxWidth = "sm",
}: CommonDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full ${widthMap[maxWidth]} rounded-2xl border-1 border-cyan-400/10 bg-[#1c1c1c] text-[#E6EDF3] shadow-[0_0_25px_rgba(0,216,255,0.2)]`}
      >
        {/* Close */}
        {showCloseButton && (
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-6 top-6 rounded-full p-1 text-gray-400 transition hover:bg-cyan-400/10 hover:text-cyan-400 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        )}

        {/* Title */}
        {title && (
          <div className="border-b border-white/10 px-6 py-4 text-2xl font-bold text-cyan-400">
            {title}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-cyan-400">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommonDialog;

type ConfirmationVariant = "primary" | "danger" | "success" | "warning";

type ConfirmationDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
};

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
}: ConfirmationDialogProps): JSX.Element {
  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>

          <Button
            variant={variant}
            loading={isLoading}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-gray-200">{message}</div>
    </CommonDialog>
  );
}
