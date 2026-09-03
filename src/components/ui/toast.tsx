"use client";

import { Toast as ToastPrimitive } from "radix-ui";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/class-names";

type ToastVariant = "success" | "error" | "info";
type ToastInput = Readonly<{
  description?: ReactNode;
  title: ReactNode;
  variant?: ToastVariant;
}>;
type ToastEntry = ToastInput & Readonly<{ id: number }>;
type ToastContextValue = Readonly<{ toast: (input: ToastInput) => void }>;

const ToastContext = createContext<ToastContextValue | null>(null);

const variants: Record<ToastVariant, string> = {
  success: "border-success/30 bg-surface",
  error: "border-danger/30 bg-surface",
  info: "border-info/30 bg-surface",
};

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [toasts, setToasts] = useState<readonly ToastEntry[]>([]);
  const nextId = useRef(0);
  const toast = useCallback((input: ToastInput) => {
    nextId.current += 1;
    setToasts((current) => [...current, { ...input, id: nextId.current }]);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider duration={5000} label="Notification">
        {children}
        {toasts.map((item) => (
          <ToastPrimitive.Root
            className={cn(
              "grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-lg border p-4 text-text-primary shadow-lg",
              variants[item.variant ?? "info"],
            )}
            key={item.id}
            onOpenChange={(open) => {
              if (!open)
                setToasts((current) =>
                  current.filter(({ id }) => id !== item.id),
                );
            }}
          >
            <ToastPrimitive.Title className="text-sm font-semibold">
              {item.title}
            </ToastPrimitive.Title>
            {item.description ? (
              <ToastPrimitive.Description className="col-start-1 text-sm text-text-secondary">
                {item.description}
              </ToastPrimitive.Description>
            ) : null}
            <ToastPrimitive.Close
              aria-label="Fermer la notification"
              className="row-span-2 grid size-11 place-items-center self-center rounded-md border border-transparent bg-transparent text-xl text-text-secondary hover:bg-surface-subtle"
            >
              ×
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport
          className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 p-4 outline-none"
          label="Notifications ({hotkey})"
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null)
    throw new Error("useToast must be used within ToastProvider.");
  return context;
}
