"use client";

import { useEffect, useState } from "react";

/** Keeps the copyright year current without needing a rebuild. */
export function CurrentYear() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <span suppressHydrationWarning>{year}</span>;
}
