"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { Responsive } from "react-grid-layout";

// Dynamic import of WidthProvider(Responsive) — runs only on the client.
// We compose the HOC inside the import function so SSR never touches react-grid-layout.
const ResponsiveGridLayout = dynamic(
  async () => {
    const mod = await import("react-grid-layout");
    return mod.WidthProvider(mod.Responsive);
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

// Use the original Responsive component's prop types — they include all the
// breakpoint/cols/layouts/onLayoutChange props we'll need in 5c onwards.
type ResponsiveGridProps = ComponentProps<typeof Responsive>;

export default function DashboardGrid(props: ResponsiveGridProps) {
  return <ResponsiveGridLayout {...props} />;
}

// Re-export Layout for consumers. There's no `Layouts` type — it's just
// `{ [breakpoint: string]: Layout[] }` which we'll define inline where needed.
export type { Layout } from "react-grid-layout";