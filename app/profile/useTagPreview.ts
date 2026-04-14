"use client";

import { useEffect, useState } from "react";

type PreviewState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

function normalizeTag(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#/, "").toUpperCase();
  if (!/^[0-9A-Z]{4,12}$/.test(trimmed)) return null;
  return `#${trimmed}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useClanPreview(raw: string, debounceMs = 500): PreviewState<any> {
  const [state, setState] = useState<PreviewState<unknown>>({ status: "idle" });

  useEffect(() => {
    if (raw.trim() === "") {
      setState({ status: "idle" });
      return;
    }

    const tag = normalizeTag(raw);
    if (!tag) {
      setState({ status: "error", message: "Invalid tag format" });
      return;
    }

    setState({ status: "loading" });
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/clan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clanTag: tag }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          setState({ status: "error", message: data.error || "Clan not found" });
        } else {
          setState({ status: "success", data });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({ status: "error", message: "Network error" });
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [raw, debounceMs]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return state as PreviewState<any>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePlayerPreview(raw: string, debounceMs = 500): PreviewState<any> {
  const [state, setState] = useState<PreviewState<unknown>>({ status: "idle" });

  useEffect(() => {
    if (raw.trim() === "") {
      setState({ status: "idle" });
      return;
    }

    const tag = normalizeTag(raw);
    if (!tag) {
      setState({ status: "error", message: "Invalid tag format" });
      return;
    }

    setState({ status: "loading" });
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerTag: tag }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          setState({ status: "error", message: data.error || "Player not found" });
        } else {
          setState({ status: "success", data });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({ status: "error", message: "Network error" });
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [raw, debounceMs]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return state as PreviewState<any>;
}