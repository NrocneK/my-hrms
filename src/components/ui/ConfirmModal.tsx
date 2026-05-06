"use client";

import { useState, createContext, useContext, useCallback, ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConfirmOptions {
  title:       string;
  message:     string;
  confirmText?: string;
  cancelText?:  string;
  variant?:    "danger" | "warning" | "info";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface ModalState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setModal({ ...options, resolve });
    });
  }, []);

  function handleConfirm() {
    modal?.resolve(true);
    setModal(null);
  }

  function handleCancel() {
    modal?.resolve(false);
    setModal(null);
  }

  const ICONS = {
    danger:  { bg: "bg-red-100",    icon: "text-red-600",    path: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" },
    warning: { bg: "bg-yellow-100", icon: "text-yellow-600", path: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
    info:    { bg: "bg-blue-100",   icon: "text-blue-600",   path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  };

  const BUTTONS = {
    danger:  "btn-danger",
    warning: "btn-primary",
    info:    "btn-primary",
  };

  const v = modal?.variant ?? "danger";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {modal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            {/* Modal */}
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-full ${ICONS[v].bg} flex items-center justify-center mx-auto`}>
                <svg className={`w-6 h-6 ${ICONS[v].icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS[v].path} />
                </svg>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{modal.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{modal.message}</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCancel}
                  className="btn-secondary flex-1"
                >
                  {modal.cancelText ?? "Hủy"}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`${BUTTONS[v]} flex-1`}
                >
                  {modal.confirmText ?? "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </ConfirmContext.Provider>
  );
}
