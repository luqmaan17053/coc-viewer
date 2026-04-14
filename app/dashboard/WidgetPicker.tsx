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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-8 bg-gray-950 border border-gray-800 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Add a widget</h2>
            <p className="text-xs text-gray-500 mt-0.5">Pick one to add to your dashboard.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Widget list */}
        <div className="p-4">
          {widgetTypes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No widgets available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {widgetTypes.map((def) => (
                <button
                  key={def.type}
                  type="button"
                  onClick={() => onPick(def.type)}
                  className="text-left bg-gray-900 border border-gray-800 hover:border-yellow-500 rounded-xl p-4 transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{def.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white group-hover:text-yellow-400 transition">
                        {def.displayName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{def.description}</p>
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