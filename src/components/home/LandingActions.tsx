"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadQuestionnaireAnswers } from "@/lib/localStorage";

export function LandingActions() {
  const [canResume, setCanResume] = useState(false);

  useEffect(() => {
    setCanResume(Boolean(loadQuestionnaireAnswers()));
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Link
        className="inline-flex min-h-11 min-w-48 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
        href="/questionnaire"
      >
        Start my plant plan
      </Link>
      {canResume ? (
        <Link
          className="inline-flex min-h-11 min-w-48 items-center justify-center rounded-full border border-black/15 bg-white px-6 text-sm font-semibold text-[var(--foreground)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
          href="/questionnaire"
        >
          Resume saved session
        </Link>
      ) : null}
    </div>
  );
}
