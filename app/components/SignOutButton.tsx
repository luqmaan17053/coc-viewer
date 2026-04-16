"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleClick() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    await fetch("/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hover:text-red-500 transition cursor-pointer"
      style={{ color: "var(--signout-color)" }}
    >
      Sign out
    </button>
  );
}
