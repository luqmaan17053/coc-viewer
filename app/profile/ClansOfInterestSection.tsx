"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  addClanOfInterest,
  removeClanOfInterest,
  promoteClanOfInterestToMain,
} from "./actions";
import { useClanPreview } from "./useTagPreview";
import { ClanCard, type ClanData } from "./MainClanSection";
import HashInput from "@/app/components/HashInput";

export default function ClansOfInterestSection({
  tags,
  mainClanTag,
  onChange,
}: {
  tags: string[];
  mainClanTag: string | null;
  onChange: (newInterests: string[], newMain?: string | null) => void;
}) {
  const [clanData, setClanData] = useState<Record<string, ClanData>>({});
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClans() {
      const tagsToFetch = tags.filter((t) => !clanData[t]);
      if (tagsToFetch.length === 0) return;
      const results = await Promise.all(
        tagsToFetch.map(async (tag) => {
          try {
            const res = await fetch("/api/clan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clanTag: tag }),
            });
            if (!res.ok) return null;
            return { tag, data: (await res.json()) as ClanData };
          } catch {
            return null;
          }
        })
      );
      setClanData((prev) => {
        const next = { ...prev };
        for (const r of results) if (r) next[r.tag] = r.data;
        return next;
      });
    }
    loadClans();
  }, [tags, clanData]);

  const addPreview = useClanPreview(newTag);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.append("clanTag", newTag);

    startTransition(async () => {
      const result = await addClanOfInterest(fd);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        const normalized = `#${newTag.trim().replace(/^#/, "").toUpperCase()}`;
        onChange([...tags, normalized]);
        setNewTag("");
        setShowAddInput(false);
      }
    });
  }

  async function handleRemove(tag: string) {
    const refCount = await countWidgetsReferencing(tag);
    const clanName = clanData[tag]?.name ?? tag;
    const msg =
      refCount > 0
        ? `"${clanName}" is used by ${refCount} widget${refCount === 1 ? "" : "s"} on your dashboard. Removing will drop its data from those widgets. Continue?`
        : `Remove "${clanName}" from your clans of interest?`;
    if (!window.confirm(msg)) return;

    startTransition(async () => {
      const result = await removeClanOfInterest(tag);
      if (result?.error) setError(result.error);
      else onChange(tags.filter((t) => t !== tag));
    });
  }

  async function handlePromote(tag: string) {
    const clanName = clanData[tag]?.name ?? tag;
    const confirmed = window.confirm(
      mainClanTag
        ? `Set "${clanName}" as your main clan? Your current main will become a clan of interest.`
        : `Set "${clanName}" as your main clan?`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await promoteClanOfInterestToMain(tag);
      if (result?.error) {
        setError(result.error);
      } else {
        // Compute new state based on CURRENT mainClanTag (fresh from props)
        const withoutPromoted = tags.filter((t) => t !== tag);
        const newInterests = mainClanTag ? [mainClanTag, ...withoutPromoted] : withoutPromoted;
        onChange(newInterests, tag);
      }
    });
  }

  return (
    <section className="glass-panel">
      <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        Clans of interest <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>({tags.length}/10)</span>
      </h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Quick-access clans reusable across widgets. Click ☆ to promote to main, ✕ to remove.
      </p>

      {tags.length === 0 && !showAddInput && (
        <p className="text-sm italic mb-4" style={{ color: "var(--text-muted)" }}>No clans added yet.</p>
      )}

      <div className="space-y-2">
        {tags.map((tag) => (
          <div key={tag} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {clanData[tag] ? (
                <ClanCard clan={clanData[tag]} />
              ) : (
                <div className="glass-mini-card">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading {tag}...</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handlePromote(tag)}
              disabled={isPending}
              title="Set as main clan"
              className="text-yellow-400/60 hover:text-yellow-400 disabled:opacity-40 w-10 h-10 flex items-center justify-center text-lg transition shrink-0"
            >
              ☆
            </button>
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              disabled={isPending}
              title="Remove"
              className="hover:text-red-400 disabled:opacity-40 w-10 h-10 flex items-center justify-center text-lg transition shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {showAddInput ? (
        <form onSubmit={handleAdd} className="mt-4 space-y-3">
          <div className="flex gap-2">
            <HashInput
              value={newTag}
              onChange={setNewTag}
              placeholder="CLAN12345"
              inputClassName="flex-1 glass-input min-w-0"
              autoFocus
            />
            <button
              type="submit"
              disabled={isPending || addPreview.status !== "success"}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-800 disabled:cursor-not-allowed text-gray-950 font-semibold px-5 rounded-lg transition shrink-0"
            >
              {isPending ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddInput(false); setNewTag(""); setError(""); }}
              className="hover:text-yellow-400 transition px-3 shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              Cancel
            </button>
          </div>
          {addPreview.status === "loading" && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Looking up clan...</p>}
          {addPreview.status === "error" && newTag.trim() !== "" && (
            <p className="text-sm text-red-400">{addPreview.message}</p>
          )}
          {addPreview.status === "success" && <ClanCard clan={addPreview.data} />}
        </form>
      ) : (
        tags.length < 10 && (
          <button
            type="button"
            onClick={() => setShowAddInput(true)}
            className="mt-4 w-full border border-dashed hover:border-yellow-500 hover:text-yellow-400 rounded-lg py-2.5 text-sm transition"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            + Add a clan of interest
          </button>
        )
      )}

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </section>
  );
}

async function countWidgetsReferencing(tag: string): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase.from("dashboard_layouts").select("widgets").eq("user_id", user.id).single();
  if (!data?.widgets) return 0;
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const widget of data.widgets as any[]) {
    const cfg = widget.config ?? {};
    if (cfg.clanSource?.kind === "interest" && cfg.clanSource.tag === tag) count++;
    if (Array.isArray(cfg.clanSources)) {
      for (const src of cfg.clanSources) {
        if (src.kind === "interest" && src.tag === tag) { count++; break; }
      }
    }
  }
  return count;
}
