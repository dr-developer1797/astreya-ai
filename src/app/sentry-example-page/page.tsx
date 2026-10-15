"use client";

import { useState } from "react";

export default function SentryExamplePage() {
  const [busy, setBusy] = useState(false);

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-medium">Sentry test</h1>
      <p className="max-w-md text-center text-sm text-neutral-500">
        Throws a real client error through the Sentry SDK so you can confirm
        issues land in the dashboard.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          throw new Error(`Sentry test error ${Date.now()}`);
        }}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        Throw sample error
      </button>
    </main>
  );
}
