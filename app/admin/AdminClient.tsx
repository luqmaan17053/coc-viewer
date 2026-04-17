"use client";

import { useCallback, useEffect, useState } from "react";

type StatusCounts = { "2xx": number; "3xx": number; "4xx": number; "5xx": number };

type StatsWindow = {
  requests: number;
  avg_rps: number;
  avg_latency_ms: number | null;
  status_counts: StatusCounts;
  proxy_failures: number;
};

type EndpointCount = { endpoint: string; requests: number };

type Health = {
  ok?: boolean;
  uptimeSeconds?: number;
  cacheSize?: number;
  hits?: number;
  misses?: number;
  upstreamCalls?: number;
  coalesced?: number;
  hitRate?: string;
  keys?: number;
  error?: string;
};

type Stats = {
  now?: string;
  windows?: Record<string, StatsWindow>;
  endpoint_breakdown?: { window: string; limit: number; endpoints: EndpointCount[] };
  error?: string;
};

type AdminRow = {
  id: string;
  display_name: string | null;
  linked_player_tag: string | null;
  is_admin: boolean;
};

const POLL_MS = 10_000;

export default function AdminClient({ currentUserId }: { currentUserId: string }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminRow[] | null>(null);
  const [adminsErr, setAdminsErr] = useState<string | null>(null);
  const [newUid, setNewUid] = useState("");
  const [busy, setBusy] = useState(false);
  const [opMsg, setOpMsg] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!res.ok) throw new Error(`stats ${res.status}`);
      const json = await res.json();
      setHealth(json.health);
      setStats(json.stats);
      setStatsErr(null);
    } catch (e) {
      setStatsErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const loadAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) throw new Error(`users ${res.status}`);
      const json = await res.json();
      setAdmins(json.admins ?? []);
      setAdminsErr(null);
    } catch (e) {
      setAdminsErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadAdmins();
    const t = setInterval(loadStats, POLL_MS);
    return () => clearInterval(t);
  }, [loadStats, loadAdmins]);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setOpMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUid.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setOpMsg(`Granted admin to ${newUid.trim()}`);
      setNewUid("");
      await loadAdmins();
    } catch (e) {
      setOpMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (uid: string) => {
    if (!confirm(`Revoke admin from ${uid}?`)) return;
    setBusy(true);
    setOpMsg(null);
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(uid)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setOpMsg(`Revoked admin from ${uid}`);
      await loadAdmins();
    } catch (e) {
      setOpMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Section title="Proxy health" error={statsErr}>
        {health ? <HealthGrid h={health} /> : <Skeleton />}
      </Section>

      <Section title="Rolling windows" error={statsErr}>
        {stats?.windows ? <WindowsTable windows={stats.windows} /> : <Skeleton />}
      </Section>

      <Section title="Top endpoints (24h)" error={statsErr}>
        {stats?.endpoint_breakdown ? (
          <EndpointsTable endpoints={stats.endpoint_breakdown.endpoints} />
        ) : (
          <Skeleton />
        )}
      </Section>

      <Section title="Admins" error={adminsErr}>
        <form onSubmit={grant} className="flex gap-2 mb-4">
          <input
            value={newUid}
            onChange={(e) => setNewUid(e.target.value)}
            placeholder="user UUID"
            className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={busy || !newUid.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500 hover:bg-yellow-400 text-gray-950 disabled:opacity-50 transition"
          >
            Grant admin
          </button>
        </form>
        {opMsg && (
          <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>{opMsg}</p>
        )}
        {admins ? (
          <ul className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {admins.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {a.display_name ?? "(no display name)"}
                    {a.linked_player_tag ? (
                      <span className="ml-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {a.linked_player_tag}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{a.id}</div>
                </div>
                <button
                  onClick={() => revoke(a.id)}
                  disabled={busy || a.id === currentUserId}
                  className="px-3 py-1.5 rounded-md text-xs disabled:opacity-40"
                  style={{ background: "var(--bg-surface-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
                  title={a.id === currentUserId ? "You can't revoke yourself" : "Revoke admin"}
                >
                  Revoke
                </button>
              </li>
            ))}
            {admins.length === 0 && (
              <li className="py-2 text-sm" style={{ color: "var(--text-secondary)" }}>No admins.</li>
            )}
          </ul>
        ) : (
          <Skeleton />
        )}
      </Section>
    </div>
  );
}

function Section({ title, error, children }: { title: string; error?: string | null; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-glass)" }}
    >
      <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{title}</h2>
      {error && <p className="text-xs mb-3 text-red-400">{error}</p>}
      {children}
    </section>
  );
}

function HealthGrid({ h }: { h: Health }) {
  const cells: Array<[string, string | number]> = [
    ["OK", h.ok ? "yes" : "no"],
    ["Uptime", h.uptimeSeconds != null ? formatUptime(h.uptimeSeconds) : "—"],
    ["Keys", h.keys ?? "—"],
    ["Cache size", h.cacheSize ?? "—"],
    ["Hit rate", h.hitRate ?? "—"],
    ["Hits", h.hits ?? "—"],
    ["Misses", h.misses ?? "—"],
    ["Upstream calls", h.upstreamCalls ?? "—"],
    ["Coalesced", h.coalesced ?? "—"],
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cells.map(([k, v]) => (
        <div key={k} className="rounded-lg p-3" style={{ background: "var(--bg-surface-subtle)" }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{k}</div>
          <div className="text-base font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function WindowsTable({ windows }: { windows: Record<string, StatsWindow> }) {
  const order = ["10s", "1m", "5m", "15m", "1h", "6h", "12h", "24h"];
  const keys = order.filter((k) => k in windows).concat(Object.keys(windows).filter((k) => !order.includes(k)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
            <th className="text-left py-1.5 pr-3">Window</th>
            <th className="text-right py-1.5 pr-3">Reqs</th>
            <th className="text-right py-1.5 pr-3">RPS</th>
            <th className="text-right py-1.5 pr-3">Latency ms</th>
            <th className="text-right py-1.5 pr-3">2xx</th>
            <th className="text-right py-1.5 pr-3">4xx</th>
            <th className="text-right py-1.5 pr-3">5xx</th>
            <th className="text-right py-1.5">Fails</th>
          </tr>
        </thead>
        <tbody style={{ color: "var(--text-primary)" }}>
          {keys.map((k) => {
            const w = windows[k];
            return (
              <tr key={k} className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <td className="py-1.5 pr-3 font-mono">{k}</td>
                <td className="py-1.5 pr-3 text-right">{w.requests}</td>
                <td className="py-1.5 pr-3 text-right">{w.avg_rps?.toFixed(2) ?? "—"}</td>
                <td className="py-1.5 pr-3 text-right">{w.avg_latency_ms?.toFixed(1) ?? "—"}</td>
                <td className="py-1.5 pr-3 text-right">{w.status_counts["2xx"]}</td>
                <td className="py-1.5 pr-3 text-right">{w.status_counts["4xx"]}</td>
                <td className="py-1.5 pr-3 text-right">{w.status_counts["5xx"]}</td>
                <td className="py-1.5 text-right">{w.proxy_failures}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EndpointsTable({ endpoints }: { endpoints: EndpointCount[] }) {
  if (!endpoints.length) {
    return <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No traffic yet.</p>;
  }
  return (
    <ul className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
      {endpoints.map((e) => (
        <li key={e.endpoint} className="py-1.5 flex items-center justify-between gap-3">
          <span className="font-mono text-xs truncate" style={{ color: "var(--text-primary)" }}>{e.endpoint}</span>
          <span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>{e.requests}</span>
        </li>
      ))}
    </ul>
  );
}

function Skeleton() {
  return <div className="h-16 rounded-lg animate-pulse" style={{ background: "var(--bg-surface-subtle)" }} />;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
