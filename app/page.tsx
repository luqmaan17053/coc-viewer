"use client";

import { useState } from "react";
import PlayerCard from "./components/PlayerCard";
import ClanCard from "./components/ClanCard";

type Tab = "player" | "clan";

export default function Home() {
  const [tab, setTab] = useState<Tab>("player");
  const [token, setToken] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);

  function handleTabChange(t: Tab) {
    setTab(t);
    setData(null);
    setError("");
    setTag("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setData(null);
    setLoading(true);

    try {
      const endpoint = tab === "player" ? "/api/player" : "/api/clan";
      const body = tab === "player"
        ? { token, playerTag: tag }
        : { token, clanTag: tag };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong.");
      } else {
        setData(json);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const placeholder = tab === "player" ? "#ABC123XYZ (player tag)" : "#ABC123XYZ (clan tag)";
  const label = tab === "player" ? "Player Tag" : "Clan Tag";

  return (
    <main className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">⚔️ CoC Viewer</h1>
          <p className="text-gray-400">Look up Clash of Clans players and clans</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => handleTabChange("player")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              tab === "player"
                ? "bg-yellow-500 text-gray-950"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Player
          </button>
          <button
            onClick={() => handleTabChange("clan")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              tab === "clan"
                ? "bg-yellow-500 text-gray-950"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Clan
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              API Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your Clash of Clans API token"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your token at{" "}
              <a
                href="https://developer.clashofclans.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-500 hover:underline"
              >
                developer.clashofclans.com
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {label}
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder={placeholder}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-800 disabled:cursor-not-allowed text-gray-950 font-bold py-2.5 rounded-lg transition"
          >
            {loading ? "Loading..." : `Look Up ${tab === "player" ? "Player" : "Clan"}`}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-5 py-4 mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {data && tab === "player" && <PlayerCard player={data} />}
        {data && tab === "clan" && <ClanCard clan={data} token={token} />}
      </div>
    </main>
  );
}
