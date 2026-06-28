import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { ToastContext } from "@/hooks/useToast";

export type ToastContextValue = {
  showToast: (message: string) => void;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((nextMessage: string) => {
    if (timer.current) clearTimeout(timer.current);

    setMessage(nextMessage);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="rounded-chip bg-ink px-4 py-3 text-center text-sm font-semibold text-surface shadow-lg">
          {message}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
