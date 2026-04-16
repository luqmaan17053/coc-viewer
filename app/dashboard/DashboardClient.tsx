"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { DashboardWidget, DashboardLayouts } from "./page";
import DashboardGrid, { type Layout } from "./DashboardGrid";
import { WIDGET_REGISTRY } from "./widgets/registry";
import { saveLayouts, removeWidget, addWidget } from "./actions";
import WidgetPicker from "./WidgetPicker";
import { useBreakpoint } from "./useBreakpoint";
import WidgetConfigModal from "./WidgetConfigModal";
import { updateWidgetConfig } from "./actions";

const BREAKPOINTS = { lg: 1024, sm: 0 };
const COLS = { lg: 12, sm: 1 };
const ROW_HEIGHT = 60;
const SAVE_DEBOUNCE_MS = 800;

export default function DashboardClient({
  widgets: initialWidgets,
  layouts: initialLayouts,
}: {
  widgets: DashboardWidget[];
  layouts: DashboardLayouts;
}) {
  const breakpoint = useBreakpoint();
  const isRealMobile = breakpoint === "sm";

  // Mobile preview toggle — only meaningful on desktop; ignored on mobile.
  const [mobilePreview, setMobilePreview] = useState(false);
  const effectiveBreakpoint: "lg" | "sm" =
    isRealMobile ? "sm" : mobilePreview ? "sm" : "lg";

  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState(initialWidgets);
  const [layouts, setLayouts] = useState<{ lg: Layout[]; sm: Layout[] }>({
    lg: initialLayouts.lg ?? [],
    sm: initialLayouts.sm ?? [],
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [configOpenFor, setConfigOpenFor] = useState<string | null>(null);
  const [pendingWidgetType, setPendingWidgetType] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Force-exit edit mode when viewport shrinks to mobile (edit is desktop-only)
  useEffect(() => {
    if (isRealMobile && editMode) {
      setEditMode(false);
      setMobilePreview(false);
    }
  }, [isRealMobile, editMode]);

  // Debounced save
  const pendingLayoutsRef = useRef<{ lg: Layout[]; sm: Layout[] } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback((next: { lg: Layout[]; sm: Layout[] }) => {
    pendingLayoutsRef.current = next;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");

    saveTimerRef.current = setTimeout(async () => {
      const toSave = pendingLayoutsRef.current;
      if (!toSave) return;
      pendingLayoutsRef.current = null;

      const result = await saveLayouts(toSave);
      if (result?.error) {
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (pendingLayoutsRef.current) {
        saveLayouts(pendingLayoutsRef.current);
      }
    };
  }, []);

  function handleLayoutChange(_: Layout[], allLayouts: { [breakpoint: string]: Layout[] }) {
    const next = {
      lg: allLayouts.lg ?? layouts.lg,
      sm: allLayouts.sm ?? layouts.sm,
    };
    setLayouts(next);
    scheduleSave(next);
  }

  function handleRemoveWidget(widgetId: string) {
    const widget = widgets.find((w) => w.id === widgetId);
    const typeName = widget ? WIDGET_REGISTRY[widget.type]?.displayName ?? widget.type : "this widget";
    if (!window.confirm(`Remove ${typeName}?`)) return;

    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    setLayouts((prev) => ({
      lg: prev.lg.filter((item) => item.i !== widgetId),
      sm: prev.sm.filter((item) => item.i !== widgetId),
    }));

    startTransition(async () => {
      const result = await removeWidget(widgetId);
      if (result?.error) {
        alert(`Failed to remove: ${result.error}. Refresh the page to see actual state.`);
      }
    });
  }

  async function handleSaveWidgetConfig(newConfig: Record<string, unknown>) {
    if (!configOpenFor) return;
    const widgetId = configOpenFor;

    // Optimistic
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, config: newConfig } : w)));
    setConfigOpenFor(null);

    startTransition(async () => {
      const result = await updateWidgetConfig(widgetId, newConfig);
      if (result?.error) {
        alert(`Failed to save config: ${result.error}. Refresh to see actual state.`);
      }
    });
  }

  function handlePickWidget(widgetType: string) {
    setPickerOpen(false);
    const def = WIDGET_REGISTRY[widgetType];
    if (!def) return;

    if (def.requiresConfigOnAdd) {
      // Open config modal in "create" mode — widget only gets added after Save
      setPendingWidgetType(widgetType);
      return;
    }

    // Otherwise, add immediately with defaults
    addWidgetWithConfig(widgetType, def.defaultConfig);
  }

  async function addWidgetWithConfig(widgetType: string, config: Record<string, unknown>) {
    const def = WIDGET_REGISTRY[widgetType];
    if (!def) return;

    const tempId = `temp_${Date.now()}`;
    const newLgItem: Layout = {
      i: tempId,
      x: 0,
      y: Math.max(0, ...layouts.lg.map((l) => l.y + l.h)),
      w: def.defaultLayout.lg.w,
      h: def.defaultLayout.lg.h,
      ...(def.defaultLayout.lg.minW && { minW: def.defaultLayout.lg.minW }),
      ...(def.defaultLayout.lg.minH && { minH: def.defaultLayout.lg.minH }),
    };
    const newSmItem: Layout = {
      i: tempId,
      x: 0,
      y: Math.max(0, ...layouts.sm.map((l) => l.y + l.h)),
      w: def.defaultLayout.sm.w,
      h: def.defaultLayout.sm.h,
      ...(def.defaultLayout.sm.minH && { minH: def.defaultLayout.sm.minH }),
    };

    setWidgets((prev) => [...prev, { id: tempId, type: widgetType, config }]);
    setLayouts((prev) => ({
      lg: [...prev.lg, newLgItem],
      sm: [...prev.sm, newSmItem],
    }));

    startTransition(async () => {
      const result = await addWidget(widgetType, config, def.defaultLayout.lg, def.defaultLayout.sm);
      if (result?.error || !result?.widgetId) {
        setWidgets((prev) => prev.filter((w) => w.id !== tempId));
        setLayouts((prev) => ({
          lg: prev.lg.filter((l) => l.i !== tempId),
          sm: prev.sm.filter((l) => l.i !== tempId),
        }));
        alert(`Failed to add widget: ${result?.error ?? "unknown error"}`);
        return;
      }
      const realId = result.widgetId;
      setWidgets((prev) => prev.map((w) => (w.id === tempId ? { ...w, id: realId } : w)));
      setLayouts((prev) => ({
        lg: prev.lg.map((l) => (l.i === tempId ? { ...l, i: realId } : l)),
        sm: prev.sm.map((l) => (l.i === tempId ? { ...l, i: realId } : l)),
      }));
    });
  }

  if (widgets.length === 0) {
    return (
      <>
        {isRealMobile && (
          <MobileViewOnlyBanner />
        )}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-2">No widgets yet</h2>
          <p className="text-sm text-gray-400 mb-4">
            {isRealMobile
              ? "Switch to desktop to add your first widget."
              : "Add your first widget to get started."}
          </p>
          {!isRealMobile && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-semibold px-5 py-2.5 rounded-lg transition"
            >
              + Add widget
            </button>
          )}
        </div>
        <WidgetPicker
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={handlePickWidget}
        />
      </>
    );
  }

  return (
    <>
      {isRealMobile && <MobileViewOnlyBanner />}

      {/* Toolbar (desktop only) */}
      {!isRealMobile && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {editMode && saveStatus === "saving" && <span>Saving…</span>}
            {editMode && saveStatus === "saved" && <span className="text-green-500">✓ Saved</span>}
            {editMode && saveStatus === "error" && <span className="text-red-400">Save failed</span>}
          </div>

          <div className="flex items-center gap-2">
            {editMode && (
              <>
                <button
                  type="button"
                  onClick={() => setMobilePreview((v) => !v)}
                  className={
                    mobilePreview
                      ? "cursor-pointer bg-gray-800 border border-yellow-500 text-yellow-400 text-sm font-semibold px-3 py-2 rounded-lg transition"
                      : "cursor-pointer bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-yellow-500 text-gray-200 hover:text-yellow-400 text-sm font-semibold px-3 py-2 rounded-lg transition"
                  }
                  title={mobilePreview ? "Switch back to desktop view" : "Preview mobile layout"}
                >
                  📱 {mobilePreview ? "Mobile view" : "Mobile"}
                </button>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="cursor-pointer bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-yellow-500 text-gray-200 hover:text-yellow-400 text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  + Add widget
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={
                editMode
                  ? "cursor-pointer bg-yellow-500 hover:bg-yellow-400 text-gray-950 text-sm font-semibold px-4 py-2 rounded-lg transition"
                  : "cursor-pointer border hover:border-yellow-500 hover:text-yellow-400 text-sm font-semibold px-4 py-2 rounded-lg transition"
              }
              style={editMode ? undefined : { color: "var(--text-primary)", borderColor: "var(--border-glass)" }}
            >
              {editMode ? "Done editing" : "Edit dashboard"}
            </button>
          </div>
        </div>
      )}

      {/* Grid — wrapped in a max-width container when previewing mobile */}
      <div
        className={
          mobilePreview && !isRealMobile
            ? "mx-auto transition-all bg-gray-900/30 rounded-xl p-2 border border-dashed border-gray-700"
            : ""
        }
        style={mobilePreview && !isRealMobile ? { maxWidth: 390 } : undefined}
      >
        {mobilePreview && !isRealMobile && (
          <p className="text-center text-xs text-yellow-500 mb-2">
            📱 Mobile preview — drag widgets to arrange the mobile layout
          </p>
        )}
        <DashboardGrid
          className="layout"
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          isDraggable={editMode && !isRealMobile}
          isResizable={editMode && !isRealMobile}
          draggableHandle=".widget-drag-handle"
          margin={[12, 12]}
          containerPadding={[0, 0]}
          onLayoutChange={handleLayoutChange}
          // Key point: force the breakpoint when previewing mobile
          breakpoint={effectiveBreakpoint}
        >
          {widgets.map((widget) => {
            const def = WIDGET_REGISTRY[widget.type];
            if (!def) {
              return (
                <div key={widget.id} className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-center">
                  <p className="text-sm text-red-300">Unknown widget type: {widget.type}</p>
                </div>
              );
            }
            const WidgetComponent = def.Widget;
            return (
              <div key={widget.id}>
                <WidgetComponent
                  id={widget.id}
                  config={widget.config}
                  editMode={editMode && !isRealMobile}
                  onRemove={() => handleRemoveWidget(widget.id)}
                  onOpenConfig={() => setConfigOpenFor(widget.id)}
                />
              </div>
            );
          })}
        </DashboardGrid>
      </div>

      <WidgetPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickWidget}
      />
      {(() => {
        // Case 1: Editing an existing widget
        if (configOpenFor) {
          const widget = widgets.find((w) => w.id === configOpenFor);
          const def = widget ? WIDGET_REGISTRY[widget.type] : null;
          return (
            <WidgetConfigModal
              isOpen={!!widget && !!def}
              definition={def}
              initialConfig={widget?.config ?? {}}
              onSave={handleSaveWidgetConfig}
              onClose={() => setConfigOpenFor(null)}
            />
          );
        }
        // Case 2: Creating a new widget that requires config first
        if (pendingWidgetType) {
          const def = WIDGET_REGISTRY[pendingWidgetType];
          return (
            <WidgetConfigModal
              isOpen={!!def}
              definition={def}
              initialConfig={def?.defaultConfig ?? {}}
              onSave={(newConfig) => {
                addWidgetWithConfig(pendingWidgetType, newConfig);
                setPendingWidgetType(null);
              }}
              onClose={() => setPendingWidgetType(null)}
            />
          );
        }
        return null;
      })()}
    </>
  );
}

function MobileViewOnlyBanner() {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-lg px-4 py-2 text-xs mb-4 text-center">
      Switch to desktop to edit your dashboard.
    </div>
  );
}