"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---------- Types (mirror what's in page.tsx and types.ts) ----------

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface DashboardLayouts {
  lg?: LayoutItem[];
  sm?: LayoutItem[];
}

interface DashboardWidget {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

// ---------- Helpers ----------

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  return { supabase, user };
}

function generateWidgetId(): string {
  // Short, URL-safe, collision-resistant enough for per-user widget IDs
  return `w_${Math.random().toString(36).slice(2, 10)}`;
}

// Compute next-available y position for adding a new widget at the bottom of the lg layout
function nextBottomY(layout: LayoutItem[]): number {
  if (layout.length === 0) return 0;
  return Math.max(...layout.map((item) => item.y + item.h));
}

// ---------- Actions ----------

export async function saveLayouts(layouts: DashboardLayouts) {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from("dashboard_layouts")
    .update({
      layouts,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to save layout." };
  }

  // No revalidatePath — layout saves happen mid-edit; we don't want to invalidate the page
  return { success: true };
}

export async function addWidget(
  type: string,
  defaultConfig: Record<string, unknown>,
  defaultLg: { w: number; h: number; minW?: number; minH?: number },
  defaultSm: { w: number; h: number; minW?: number; minH?: number }
) {
  const { supabase, user } = await getUser();

  const { data: row } = await supabase
    .from("dashboard_layouts")
    .select("widgets, layouts")
    .eq("user_id", user.id)
    .single();

  const widgets = (row?.widgets as DashboardWidget[] | null) ?? [];
  const layouts = (row?.layouts as DashboardLayouts | null) ?? {};

  const newId = generateWidgetId();

  const newWidget: DashboardWidget = {
    id: newId,
    type,
    config: defaultConfig,
  };

  const lgLayout = layouts.lg ?? [];
  const smLayout = layouts.sm ?? [];

  const newLgItem: LayoutItem = {
    i: newId,
    x: 0,
    y: nextBottomY(lgLayout),
    w: defaultLg.w,
    h: defaultLg.h,
    ...(defaultLg.minW && { minW: defaultLg.minW }),
    ...(defaultLg.minH && { minH: defaultLg.minH }),
  };

  const newSmItem: LayoutItem = {
    i: newId,
    x: 0,
    y: nextBottomY(smLayout),
    w: defaultSm.w,
    h: defaultSm.h,
    ...(defaultSm.minW && { minW: defaultSm.minW }),
    ...(defaultSm.minH && { minH: defaultSm.minH }),
  };

  const { error } = await supabase
    .from("dashboard_layouts")
    .update({
      widgets: [...widgets, newWidget],
      layouts: {
        lg: [...lgLayout, newLgItem],
        sm: [...smLayout, newSmItem],
      },
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to add widget." };
  }

  revalidatePath("/dashboard");
  return { success: true, widgetId: newId };
}

export async function removeWidget(widgetId: string) {
  const { supabase, user } = await getUser();

  const { data: row } = await supabase
    .from("dashboard_layouts")
    .select("widgets, layouts")
    .eq("user_id", user.id)
    .single();

  const widgets = (row?.widgets as DashboardWidget[] | null) ?? [];
  const layouts = (row?.layouts as DashboardLayouts | null) ?? {};

  const newWidgets = widgets.filter((w) => w.id !== widgetId);
  const newLayouts: DashboardLayouts = {
    lg: (layouts.lg ?? []).filter((item) => item.i !== widgetId),
    sm: (layouts.sm ?? []).filter((item) => item.i !== widgetId),
  };

  const { error } = await supabase
    .from("dashboard_layouts")
    .update({
      widgets: newWidgets,
      layouts: newLayouts,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to remove widget." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateWidgetConfig(widgetId: string, newConfig: Record<string, unknown>) {
  const { supabase, user } = await getUser();

  const { data: row } = await supabase
    .from("dashboard_layouts")
    .select("widgets")
    .eq("user_id", user.id)
    .single();

  const widgets = (row?.widgets as DashboardWidget[] | null) ?? [];
  const updated = widgets.map((w) => (w.id === widgetId ? { ...w, config: newConfig } : w));

  const { error } = await supabase
    .from("dashboard_layouts")
    .update({
      widgets: updated,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update widget config." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}