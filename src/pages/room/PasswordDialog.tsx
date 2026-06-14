import React, { useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../components/ui/Button";
import CommonDialog from "../../components/ui/CustomDialog";

interface PasswordDialogProps {
  open: boolean;
  onClose?: () => void;
  onSubmit: (password: string) => void;
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input);
      setInput("");
      onClose?.();
    }
  };

  if (!open) return null;

  return (
    <CommonDialog
      title="Enter Room Password"
      open={open}
      showCloseButton={false}
    >
      {/* Content */}
      <div className="px-6 py-4">
        <div className="relative">
          <input
            autoFocus
            type="password"
            id="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full px-4 py-3 text-[#E6EDF3] bg-[#2a2a2a] border border-[#444] rounded-xl focus:outline-none focus:border-[#00D8FF] focus:ring-1 focus:ring-[#00D8FF] transition-colors"
            placeholder=" "
          />
          <label
            htmlFor="password"
            className={`absolute left-4 transition-all duration-200 pointer-events-none
                ${
                  input
                    ? "text-xs -top-2 bg-[#1c1c1c] px-1 text-[#aaa]"
                    : "text-base top-3 text-[#aaa]"
                }`}
          >
            Password
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center items-center px-6 pb-6 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className={`px-6 py-2 bg-[#00D8FF] text-black font-bold rounded-xl transition-all
              ${
                input.trim()
                  ? "hover:bg-[#00bddd] active:scale-95"
                  : "opacity-50 cursor-not-allowed"
              }`}
        >
          Join
        </Button>
      </div>
    </CommonDialog>
  );
};

export default PasswordDialog;
