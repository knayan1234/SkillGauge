/**
 * Shared grouping helpers for chatroom lists.
 *
 * Used by both `InterviewSidebar` (active interview view) and `SessionsHistorySidebar`
 * (authenticated landing). Centralizing keeps the grouping rules consistent — change once
 * and both surfaces update together.
 */

import type { ChatroomEntryData } from "@/components/ChatroomEntry";

/**
 * Day-bucket label for an ISO timestamp. Buckets are coarse on purpose — fine enough to
 * be useful at a glance, coarse enough to avoid a 50-bucket sidebar.
 */
export function dayBucket(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfThen = new Date(
    then.getFullYear(),
    then.getMonth(),
    then.getDate(),
  ).getTime();
  const dayDiff = Math.floor((startOfToday - startOfThen) / 86_400_000);
  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return "This week";
  if (dayDiff < 30) return "This month";
  return "Older";
}

export const DAY_BUCKET_ORDER = [
  "Today",
  "Yesterday",
  "This week",
  "This month",
  "Older",
] as const;

export interface ResumeGroup {
  resumeFileName: string;
  /** Most-recent createdAt across this résumé's entries — drives group ordering. */
  latest: number;
  /** Entries grouped by day-bucket, in DAY_BUCKET_ORDER. */
  buckets: { label: string; entries: ChatroomEntryData[] }[];
}

/**
 * Group chatrooms by résumé first, then by day bucket within each résumé. Returns groups
 * sorted by recency (most-recent activity first) so the active interview lands at the top.
 * Entries with no résumé filename collapse into a "No résumé" group at the end.
 */
export function groupSessionsByResumeAndDay(
  chatrooms: ChatroomEntryData[],
  now: Date = new Date(),
): ResumeGroup[] {
  const byResume = new Map<string, ChatroomEntryData[]>();
  for (const c of chatrooms) {
    const key = c.resumeFileName ?? "No résumé";
    const list = byResume.get(key) ?? [];
    list.push(c);
    byResume.set(key, list);
  }

  const groups: ResumeGroup[] = [];
  for (const [resumeFileName, entries] of byResume.entries()) {
    const byBucketMap = new Map<string, ChatroomEntryData[]>();
    let latest = 0;
    for (const e of entries) {
      const t = new Date(e.createdAt).getTime();
      if (t > latest) latest = t;
      const bucket = dayBucket(e.createdAt, now);
      const list = byBucketMap.get(bucket) ?? [];
      list.push(e);
      byBucketMap.set(bucket, list);
    }

    const buckets = DAY_BUCKET_ORDER.flatMap((label) => {
      const list = byBucketMap.get(label);
      if (!list || list.length === 0) return [];
      const sorted = [...list].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return [{ label, entries: sorted }];
    });

    groups.push({ resumeFileName, latest, buckets });
  }

  // Active résumé (= one with the live entry) goes first; others by recency.
  return groups.sort((a, b) => {
    const aHasLive = a.buckets.some((b) =>
      b.entries.some((e) => e.isActive),
    );
    const bHasLive = b.buckets.some((b) =>
      b.entries.some((e) => e.isActive),
    );
    if (aHasLive !== bHasLive) return aHasLive ? -1 : 1;
    return b.latest - a.latest;
  });
}
