"use client";

import { useEffect, useRef } from "react";
import type { WidgetDefinition } from "./widgets/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDef = WidgetDefinition<any>;

export default function WidgetConfigModal({
  isOpen,
  definition,
  initialConfig,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  definition: AnyDef | null;
  initialConfig: Record<string, unknown>;
  onSave: (newConfig: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Close on Escape, focus trap on Tab
  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);

    // Focus the close button on open — simple focus management
    firstFocusableRef.current?.focus();

    // Lock body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !definition) return null;

  const ConfigForm = definition.ConfigForm;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-config-title"
    >
      <div
        className="relative w-full max-w-lg my-8 bg-gray-950 border border-gray-800 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{definition.icon}</span>
            <div className="min-w-0">
              <h2 id="widget-config-title" className="text-base font-bold text-white truncate">
                Configure {definition.displayName}
              </h2>
              <p className="text-xs text-gray-500 truncate">{definition.description}</p>
            </div>
          </div>
          <button
            ref={firstFocusableRef}
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center transition text-lg shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body: the widget's own ConfigForm */}
        <div className="p-5">
          {ConfigForm ? (
            <ConfigForm
              initialConfig={initialConfig}
              onSave={onSave}
              onCancel={onClose}
            />
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              This widget has no configurable options.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}