"use client";

import { useState, useTransition } from "react";
import { saveLinkedTag } from "./actions";

export default function LinkedTagForm({ initialTag }: { initialTag: string | null }) {
  const [tag, setTag] = useState(initialTag ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await saveLinkedTag(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Your player tag
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name="playerTag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="#ABC123XYZ"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition font-mono"
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-800 disabled:cursor-not-allowed text-gray-950 font-semibold px-5 rounded-lg transition"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Leave empty to unlink.</p>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      {saved && (
        <p className="text-sm text-green-400">✓ Saved</p>
      )}
    </form>
  );
}