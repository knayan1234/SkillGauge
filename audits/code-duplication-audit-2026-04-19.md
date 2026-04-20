# Code Duplication Audit — SkillGauge (Phase 0b)

**Date:** 2026-04-19
**Scope:** `web/` — excludes `web/components/ui/` (shadcn upstream), `web/node_modules/`, `web/.next/`.
**Method:** Static inspection of every `.ts`/`.tsx` under the scope; cross-file pattern matching on identifiers, strings, and structural JSX/hook patterns.

Severity is a 1-10 judgment of maintainability risk and drift likelihood, not LOC count. Effort: S = ≤30 min, M = 30-60 min, L = >60 min.

---

## Summary Table

| #  | Finding                                        | Type          | Severity | Effort | Phase      |
|----|------------------------------------------------|---------------|----------|--------|------------|
| 1  | Storage key magic strings scattered            | EXACT/DATA    | 7/10     | S      | Phase 0    |
| 2  | `ACCEPTED_RESUME_TYPES` vs HTML `accept` drift | DATA          | 7/10     | M      | Phase 0    |
| 3  | `useAuth` mutation success handler duplicated  | EXACT         | 6/10     | S      | Phase 0    |
| 4  | `useAuth` login/register wrapper duplicated    | NEAR          | 6/10     | M      | Phase 0/1  |
| 5  | Inline loading-spinner Tailwind repeated       | NEAR          | 5/10     | M      | Phase 0    |
| 6  | Form-field error block repeated 4×             | STRUCTURAL    | 4/10     | M      | Defer → Phase 1 |
| 7  | Mock-API `setTimeout` sleep repeated 6×        | NEAR          | 3/10     | S      | Defer → Phase 1 (mocks go away) |
| 8  | `useForm` + `zodResolver` shape                | STRUCTURAL    | 3/10     | —      | No action (idiomatic) |
| 9  | Test-wrapper vs prod `QueryClient` factories   | NEAR          | 2/10     | —      | No action (intentional) |
| 10 | Form-field wrapper `<div>` + `<Label>` block   | STRUCTURAL    | 4/10     | M      | Defer → Phase 1 |

Total high-value work for Phase 0: ~2 hours. All findings verified by grep.

---

## 1. Storage-key magic strings scattered across three files — **Severity 7/10**

**Category:** EXACT (string literals) + DATA (no single source of truth)

**Evidence:**
- [web/services/api.ts:44-45](web/services/api.ts#L44-L45) — `TOKEN_KEY = "skillgauge_token"`, `USER_KEY = "skillgauge_user"` (module-local constants)
- [web/features/session-setup/SessionSetupForm.tsx:34-35](web/features/session-setup/SessionSetupForm.tsx#L34-L35) — `sessionStorage.setItem("current_session", …)`, `sessionStorage.setItem("job_description", …)` (hard-coded)
- [web/app/interview/page.tsx:40-41](web/app/interview/page.tsx#L40-L41) + [web/app/interview/page.tsx:73-74](web/app/interview/page.tsx#L73-L74) — same two strings hard-coded 4 more times

**Duplication:** 100% string-literal match across 2 files (`"current_session"`, `"job_description"` appear 3× each; MIME-style `TOKEN_KEY`/`USER_KEY` are already constants but live in only one module).

**Why this matters:** Phase 1 migration plans to move the auth token to an httpOnly cookie (see [ARCHITECTURE.md](ARCHITECTURE.md)). If a key needs to be namespaced (e.g. per-user `user_123:current_session`), the four hard-coded call sites will be missed. Inconsistent treatment — auth keys *are* constants, session keys *aren't* — is itself a smell.

**Remediation:** Create `web/lib/storageKeys.ts`:

```typescript
// web/lib/storageKeys.ts
export const STORAGE_KEYS = {
  auth: {
    token: "skillgauge_token",
    user: "skillgauge_user",
  },
  session: {
    id: "current_session",
    jobDescription: "job_description",
  },
} as const;
```

Then in [web/services/api.ts](web/services/api.ts):

```typescript
import { STORAGE_KEYS } from "@/lib/storageKeys";
const TOKEN_KEY = STORAGE_KEYS.auth.token;
const USER_KEY = STORAGE_KEYS.auth.user;
```

In [web/features/session-setup/SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx) and [web/app/interview/page.tsx](web/app/interview/page.tsx):

```typescript
import { STORAGE_KEYS } from "@/lib/storageKeys";
sessionStorage.setItem(STORAGE_KEYS.session.id, sessionId);
sessionStorage.setItem(STORAGE_KEYS.session.jobDescription, jobDescription);
// etc.
```

**Effort:** S — 1 new file, 3 touched files, ~8 string replacements.

---

## 2. `ACCEPTED_RESUME_TYPES` (MIME) vs HTML `accept` (extensions) drift — **Severity 7/10**

**Category:** DATA (single logical rule, two physical representations)

**Evidence:**
- [web/features/session-setup/sessionSetupSchema.ts:3-7](web/features/session-setup/sessionSetupSchema.ts#L3-L7) — MIME whitelist: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- [web/features/session-setup/SessionSetupForm.tsx:48](web/features/session-setup/SessionSetupForm.tsx#L48) — `<Input accept=".pdf,.doc,.docx" …/>` hard-coded

**Duplication:** Semantic. Two places encode the same "what file types we accept" decision. Add `.xlsx` and you must update both, or the picker lets users select files the validator rejects.

**Remediation:** Co-locate both forms in the schema file:

```typescript
// web/features/session-setup/sessionSetupSchema.ts
export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ACCEPTED_RESUME_ACCEPT_ATTR = ".pdf,.doc,.docx";
```

In [web/features/session-setup/SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx):

```typescript
import { ACCEPTED_RESUME_ACCEPT_ATTR } from "./sessionSetupSchema";
<Input accept={ACCEPTED_RESUME_ACCEPT_ATTR} … />
```

Add a comment in the schema flagging that both lists must change together. A future refinement is a MIME→extension map, but one pair of constants side-by-side is cheaper and obvious enough.

**Effort:** M — export constant, import in form, verify tests still pass.

---

## 3. `useAuth` mutation `onSuccess` block copied verbatim — **Severity 6/10**

**Category:** EXACT

**Evidence:** `loginMutation.onSuccess` and `registerMutation.onSuccess` in [web/hooks/useAuth.ts](web/hooks/useAuth.ts) have 5 identical lines:

```typescript
onSuccess: ({ user: nextUser, token }) => {
  setStoredToken(token);
  setStoredUser(nextUser);
  setUser(nextUser);
  queryClient.setQueryData(AUTH_QUERY_KEY, nextUser);
}
```

**Duplication:** 100%.

**Remediation:** Hoist to a single handler inside the hook:

```typescript
const handleAuthSuccess = useCallback(
  ({ user: nextUser, token }: AuthResponse) => {
    setStoredToken(token);
    setStoredUser(nextUser);
    setUser(nextUser);
    queryClient.setQueryData(AUTH_QUERY_KEY, nextUser);
  },
  [queryClient],
);

const loginMutation = useMutation({
  mutationFn: ({ email, password }) => loginUser(email, password),
  onSuccess: handleAuthSuccess,
});

const registerMutation = useMutation({
  mutationFn: ({ email, password }) => registerUser(email, password),
  onSuccess: handleAuthSuccess,
});
```

**Effort:** S.

---

## 4. `useAuth.login` / `useAuth.register` are twins — **Severity 6/10**

**Category:** NEAR (structural 95% identical, only the mutation reference and error string differ)

**Evidence:** [web/hooks/useAuth.ts](web/hooks/useAuth.ts) — both wrappers follow `try { await mutation.mutateAsync(…); return { success: true } } catch { return { success: false, error: "X failed" } }`.

**Remediation:** Factor a helper **inside** the hook body (keep it colocated — this is hook-specific, not a general util):

```typescript
function useAuthOp(
  mutation: UseMutationResult<AuthResponse, Error, { email: string; password: string }>,
  label: string,
) {
  return useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        await mutation.mutateAsync({ email, password });
        return { success: true };
      } catch {
        return { success: false, error: `${label} failed` };
      }
    },
    [mutation, label],
  );
}

const login    = useAuthOp(loginMutation,    "Login");
const register = useAuthOp(registerMutation, "Registration");
```

Note: the `UseMutationResult` generics must match `loginUser`/`registerUser`'s return type. Do **not** hoist this into `lib/` — it depends on `AuthResult`/`AuthResponse` shapes owned by the auth feature.

**Effort:** M — types need care; add a unit test asserting `error` strings round-trip.

---

## 5. Inline loading-spinner Tailwind repeated — **Severity 5/10**

**Category:** NEAR (95% identical, size & opacity differ)

**Evidence:**
- [web/app/setup/page.tsx:30](web/app/setup/page.tsx#L30) — `h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin`
- [web/app/interview/page.tsx:66](web/app/interview/page.tsx#L66) — `h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin`
- [web/features/interview/TypingIndicator.tsx:7](web/features/interview/TypingIndicator.tsx#L7) — uses `lucide-react`'s `<Loader2 className="h-4 w-4 animate-spin text-primary" />` — **different primitive**, so it's a third variant of "loading affordance"

**Remediation:** Standardize on `<Loader2>` (already a dependency) and delete the two bespoke border-spinners:

```tsx
// web/app/setup/page.tsx
import { Loader2 } from "lucide-react";
<Loader2 className="h-6 w-6 animate-spin text-primary" />

// web/app/interview/page.tsx
<Loader2 className="h-8 w-8 animate-spin text-primary" />
```

This is simpler than a new `<LoadingSpinner>` wrapper component: `Loader2` already handles rotation, and the lucide usage is pre-established in [TypingIndicator.tsx](web/features/interview/TypingIndicator.tsx).

**Effort:** M — touch 2 files, verify visual parity in dev server.

---

## 6. Form-field error `<p>` repeated 4 times — **Severity 4/10**

**Category:** STRUCTURAL

**Evidence:** The exact JSX

```tsx
{errors.<field> && (
  <p className="text-sm text-destructive">{errors.<field>.message}</p>
)}
```

appears at [AuthModal.tsx:89-91](web/features/auth/AuthModal.tsx#L89-L91), [AuthModal.tsx:103-107](web/features/auth/AuthModal.tsx#L103-L107), and twice in [SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx) (resume + jobDescription fields).

**Remediation (defer):** Introduce a minimal component only once you have a 3rd form. Today, 4 copies across 2 files isn't worth the abstraction — the "rule of three" for similar code hasn't clearly fired (it's two forms, two fields each). Revisit in Phase 1 when adding profile/settings forms.

If you do extract:

```tsx
// web/components/FormFieldError.tsx
import type { FieldError } from "react-hook-form";
export function FormFieldError({ error }: { error?: FieldError }) {
  if (!error?.message) return null;
  return <p className="text-sm text-destructive">{String(error.message)}</p>;
}
```

**Effort:** M if done. **Recommendation:** don't do it yet.

---

## 7. Mock-API `setTimeout(resolve, …)` repeated 6 times — **Severity 3/10**

**Category:** NEAR (pattern identical, delay varies: 500/500/1000/800/1500/1000 ms)

**Evidence:** 5 occurrences in [web/services/api.ts](web/services/api.ts) at lines 85, 101, 109, 125, 140; 1 occurrence in [web/features/session-setup/SessionSetupForm.tsx:36](web/features/session-setup/SessionSetupForm.tsx#L36).

**Remediation (defer):** Phase 1 replaces the mocks with real HTTP, deleting all 5 of the `api.ts` occurrences at once. The 6th (in `SessionSetupForm`) is itself a mock for the initialize step and will also be removed. Extracting a `sleep(ms)` util now saves ~20 chars per call and introduces an import that gets deleted in the same phase. **No action.**

If you disagree, the drop-in is:

```typescript
// web/lib/mockDelay.ts
export const mockDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));
```

**Effort:** S, but net-negative value pre-Phase-1.

---

## 8. `useForm({ resolver: zodResolver(…) })` shape repeated — **Severity 3/10**

**Category:** STRUCTURAL

**Evidence:** [AuthModal.tsx:31-43](web/features/auth/AuthModal.tsx#L31-L43), [SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx).

**Remediation:** None. This is the library's idiom. Wrapping it hides what readers already know how to read and complicates type inference. Keep.

---

## 9. Two `QueryClient` factories (prod vs test) — **Severity 2/10**

**Category:** NEAR (75% shape overlap; defaults diverge intentionally)

**Evidence:** [web/lib/queryClient.ts](web/lib/queryClient.ts) vs the test wrapper under [web/test/](web/test/).

**Remediation:** None. Divergent defaults are the whole point (test client disables retry + cache for determinism). Collapsing them would couple prod config to test config, which is the wrong direction.

---

## 10. Form-field wrapper markup — **Severity 4/10**

**Category:** STRUCTURAL

**Evidence:** Both forms repeat the `<div className="space-y-2"> <Label htmlFor=…>…</Label> <Input|Textarea … /> {errors…} </div>` skeleton. [AuthModal.tsx:80-108](web/features/auth/AuthModal.tsx#L80-L108) and the resume/JD blocks in [SessionSetupForm.tsx](web/features/session-setup/SessionSetupForm.tsx).

**Remediation (defer):** Same reasoning as #6 — 4 instances in 2 files isn't a clear extraction win. Revisit in Phase 1 alongside the `FormFieldError` extraction; they'd fold together into a single `<FormField label control error />` compound.

---

## Utilities module recommendation

Only **one** new shared module is justified today:

- **`web/lib/storageKeys.ts`** (fixes finding #1; see snippet above).

Do **not** create `lib/mockDelay.ts`, `lib/formField.tsx`, or `components/LoadingSpinner.tsx` right now. Each has a valid future home but introducing them now either:

- inverts dependencies (util file for code that disappears next phase), or
- adds an abstraction before the "rule of three" fires, or
- duplicates something we already have (`lucide-react`'s `Loader2`).

The three accepted Phase 0 items are #1 (storage keys), #2 (accept-attr constant), #3 (`handleAuthSuccess`). Everything else earns its keep only in Phase 1 context.

---

## Unable to verify

- **Runtime behavior parity** between inline border-spinners and `Loader2` (finding #5) — requires visual inspection in the dev server; no Storybook or visual-regression test exists to confirm.
- **Barrel exports** — no `index.ts` files under `features/` or `lib/`; no duplication can exist until one does. Not a finding, just a note.
- **E2E/integration test duplication** — none exists (only unit tests). Nothing to audit.
