"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import {
  ACCEPTED_RESUME_ACCEPT_ATTR,
  INTERVIEW_STYLES,
  DIFFICULTY_LEVELS,
  ROLE_LEVELS,
  QUESTION_COUNTS,
  sessionSetupSchema,
  type SessionSetupFormInput,
  type SessionSetupFormValues,
} from "./sessionSetupSchema";
import { STORAGE_KEYS } from "@/lib/storageKeys";

// Read the file as raw bytes and base64-encode for transport. The BE then dispatches
// to pdf-parse / mammoth / UTF-8 fallback based on `resumeMime`. We use ArrayBuffer
// + chunked btoa() (rather than reader.readAsDataURL) so we can return ONLY the
// base64 payload — no MIME prefix the server would have to strip.
async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      // Chunked encoding to avoid "Maximum call stack" on big files. 0x8000 bytes per
      // chunk is the conventional safe size for String.fromCharCode + spread.
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(
          ...bytes.subarray(i, i + chunkSize),
        );
      }
      resolve(btoa(binary));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

type PendingSubmit = {
  resumeFileName: string;
  resumeContent: string;
  resumeMime: string;
  jobDescription: string;
  interviewStyle: SessionSetupFormValues["interviewStyle"];
  difficulty: SessionSetupFormValues["difficulty"];
  roleLevel: SessionSetupFormValues["roleLevel"];
  questionCount: SessionSetupFormValues["questionCount"];
  focusAreas?: string;
};

// Mirror of SessionOptions stored alongside the resume snapshot so /interview can forward
// everything to POST /api/sessions without re-collecting.
function persistAndGo(data: PendingSubmit, router: { push: (p: string) => void }) {
  sessionStorage.setItem(STORAGE_KEYS.session.jobDescription, data.jobDescription);
  sessionStorage.setItem(
    STORAGE_KEYS.session.id,
    JSON.stringify({
      resumeFileName: data.resumeFileName,
      resumeContent: data.resumeContent,
      resumeMime: data.resumeMime,
    }),
  );
  sessionStorage.setItem(
    STORAGE_KEYS.session.options,
    JSON.stringify({
      interviewStyle: data.interviewStyle,
      difficulty: data.difficulty,
      roleLevel: data.roleLevel,
      questionCount: data.questionCount,
      focusAreas: data.focusAreas,
    }),
  );
  sessionStorage.setItem(STORAGE_KEYS.session.active, "true");
  router.push("/interview");
}

function archivePreviousSession() {
  // Archive just the snapshot metadata — the backend still holds the real session + messages.
  const prevResume = sessionStorage.getItem(STORAGE_KEYS.session.id);
  const prevJD = sessionStorage.getItem(STORAGE_KEYS.session.jobDescription);
  const prevOpts = sessionStorage.getItem(STORAGE_KEYS.session.options);
  if (!prevResume && !prevJD) return;
  const raw = localStorage.getItem(STORAGE_KEYS.session.archived);
  const list = raw ? (JSON.parse(raw) as unknown[]) : [];
  list.push({
    archivedAt: new Date().toISOString(),
    resume: prevResume,
    jobDescription: prevJD,
    options: prevOpts,
  });
  localStorage.setItem(STORAGE_KEYS.session.archived, JSON.stringify(list));
}

export function SessionSetupForm() {
  const router = useRouter();
  const [confirmData, setConfirmData] = useState<PendingSubmit | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SessionSetupFormInput, unknown, SessionSetupFormValues>({
    resolver: zodResolver(sessionSetupSchema),
    mode: "onBlur",
    defaultValues: {
      interviewStyle: "mixed",
      difficulty: "medium",
      roleLevel: "mid",
      questionCount: "5",
    },
  });

  const resumeFiles = watch("resume");
  const resumeFile = resumeFiles?.[0];

  const onSubmit = handleSubmit(async (values) => {
    const file = values.resume[0];
    const resumeContent = await readFileAsBase64(file);
    const payload: PendingSubmit = {
      resumeFileName: file.name,
      resumeContent,
      // Some browsers report empty `file.type` for unusual extensions. Default to
      // application/octet-stream — the BE's parseResume falls back to UTF-8 decode
      // for unknown MIMEs, which keeps the path open for plain-text files even
      // when the browser declines to identify them.
      resumeMime: file.type || "application/octet-stream",
      jobDescription: values.jobDescription,
      interviewStyle: values.interviewStyle,
      difficulty: values.difficulty,
      roleLevel: values.roleLevel,
      questionCount: values.questionCount,
      focusAreas: values.focusAreas || undefined,
    };
    // Guard: if an interview is already in progress, warn before overwriting the handoff blob.
    const inProgress = sessionStorage.getItem(STORAGE_KEYS.session.active) === "true";
    if (inProgress) {
      setConfirmData(payload);
      return;
    }
    persistAndGo(payload, router);
  });

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="resume">Resume</Label>
          <div className="relative">
            <Input
              id="resume"
              type="file"
              accept={ACCEPTED_RESUME_ACCEPT_ATTR}
              aria-invalid={errors.resume ? "true" : "false"}
              className="cursor-pointer"
              {...register("resume")}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          {resumeFile && !errors.resume && (
            <p className="text-xs text-muted-foreground">
              Selected: {resumeFile.name}
            </p>
          )}
          {errors.resume && (
            <p className="text-sm text-destructive">
              {errors.resume.message as string}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="interviewStyle">Interview style</Label>
            <select
              id="interviewStyle"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("interviewStyle")}
            >
              {INTERVIEW_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <select
              id="difficulty"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("difficulty")}
            >
              {DIFFICULTY_LEVELS.map((d) => (
                <option key={d} value={d}>
                  {d[0].toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleLevel">Role level</Label>
            <select
              id="roleLevel"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("roleLevel")}
            >
              {ROLE_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionCount">Number of questions</Label>
            <select
              id="questionCount"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("questionCount")}
            >
              {QUESTION_COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="focusAreas">Focus areas (optional)</Label>
          <Input
            id="focusAreas"
            placeholder="e.g. system design, React hooks, SQL performance"
            {...register("focusAreas")}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated topics you&apos;d like the interviewer to lean into.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description</Label>
          <Textarea
            id="jobDescription"
            placeholder="Paste the job description here..."
            rows={8}
            aria-invalid={errors.jobDescription ? "true" : "false"}
            className="resize-none"
            {...register("jobDescription")}
          />
          {errors.jobDescription ? (
            <p className="text-sm text-destructive">
              {errors.jobDescription.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Paste the full job description to get tailored interview questions
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Starting session..." : "Start Interview"}
        </Button>
      </form>

      <Dialog
        open={confirmData !== null}
        onOpenChange={(open) => !open && setConfirmData(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new interview?</DialogTitle>
            <DialogDescription>
              You have an interview in progress. Starting a new session will
              archive the current one locally — you won&apos;t be able to return
              to it until the session history view ships.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmData(null)}
            >
              Keep current session
            </Button>
            <Button
              onClick={() => {
                if (!confirmData) return;
                archivePreviousSession();
                persistAndGo(confirmData, router);
                setConfirmData(null);
              }}
            >
              Archive and start new
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
