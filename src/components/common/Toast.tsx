import { createContext, useContext, useState, ReactNode } from "react";
import { HistoryToast } from "../../__Helper/common";

type Toast = {
  id: string;
  title: string;
  message?: string;
  createdBy?: string;
};

type ToastType = {
  showToast: (toast: Omit<Toast, "id">) => void;
};

const Toast = createContext<ToastType | null>(null);

export const useToast = () => {
  const ctx = useContext(Toast);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  };

  return (
    <Toast.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <HistoryToast key={toast.id} {...toast} />
        ))}
      </div>
    </Toast.Provider>
  );
};
