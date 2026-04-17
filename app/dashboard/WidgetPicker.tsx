"use client";

import { useEffect } from "react";
import { WIDGET_REGISTRY } from "./widgets/registry";

export default function WidgetPicker({
  isOpen,
  onClose,
  onPick,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPick: (widgetType: string) => void;
}) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widgetTypes = Object.values(WIDGET_REGISTRY);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-8 rounded-2xl"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-glass)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-glass)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Add a widget
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Pick one to add to your dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center transition text-lg hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Widget list */}
        <div className="p-4">
          {widgetTypes.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
              No widgets available yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {widgetTypes.map((def) => (
                <button
                  key={def.type}
                  type="button"
                  onClick={() => onPick(def.type)}
                  className="text-left rounded-xl p-4 transition group [border-color:var(--border-glass)] hover:border-yellow-500 border"
                  style={{ background: "var(--bg-surface)" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{def.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold group-hover:text-yellow-400 transition"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {def.displayName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {def.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
