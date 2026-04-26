// Single source of truth for browser-storage keys. localStorage auth was removed (moved
// to httpOnly cookie), so only the setup→interview handoff remains.
// Any new keys go here — never hard-code a string at a call site.
export const STORAGE_KEYS = {
  session: {
    id: "current_session",
    jobDescription: "job_description",
    options: "session_options",
    archived: "archived_sessions",
    active: "session_in_progress",
  },
} as const;
