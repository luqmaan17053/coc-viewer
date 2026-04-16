"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function ThemeToggleConditional() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <ThemeToggle />;
}
