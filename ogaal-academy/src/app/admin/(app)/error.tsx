"use client";

import { Notice } from "@/components/admin/ui";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-4">
      <Notice tone="bad">The records could not be loaded from storage. Please try again in a moment.</Notice>
      <button type="button" onClick={reset} className="btn btn-outline">Try again</button>
    </div>
  );
}
