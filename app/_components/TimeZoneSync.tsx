"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the stored IANA time zone in step with the device's. Runs once per full
 * page load and only refreshes server data when the zone actually changed.
 */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;

    let cancelled = false;
    fetch("/api/profile/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: timeZone }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { updated?: boolean } | null) => {
        if (!cancelled && data?.updated) router.refresh();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
