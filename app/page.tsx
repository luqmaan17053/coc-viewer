"use client";

import { useState } from "react";
import PlayerCard from "./components/PlayerCard";
import ClanCard from "./components/ClanCard";
import HashInput from "./components/HashInput";

type Tab = "player" | "clan";

export default function Home() {
  const [tab, setTab] = useState<Tab>("player");
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
      const body = tab === "player" ? { playerTag: tag } : { clanTag: tag };

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

  const placeholder = tab === "player" ? "ABC123XYZ" : "CLAN12345";
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
              {label}
            </label>
            <HashInput
              value={tag}
              onChange={setTag}
              placeholder={placeholder}
              prefixClassName="text-gray-500"
              inputClassName="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pr-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition"
              required
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
        {data && tab === "clan" && <ClanCard clan={data} />}
      </div>
    </main>
  );
}