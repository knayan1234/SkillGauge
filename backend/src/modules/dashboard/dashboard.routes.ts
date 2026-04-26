/**
 * Dashboard route — single read endpoint that returns the headline stats + trend
 * data the `/dashboard` page renders. Auth-required (every metric is per-user).
 */

import { Router, type Application, type NextFunction, type Request, type Response } from "express";
import { requireAuth } from "@/plugins/auth";
import { dashboardService } from "./dashboard.service";

type AsyncHandler = (req: Request, res: Response) => Promise<void | Response>;
const wrap = (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res)).catch(next);

export function dashboardRoutes(app: Application): void {
  const router = Router();
  router.use(requireAuth);

  router.get(
    "/summary",
    wrap(async (req, res) => {
      const summary = await dashboardService.summary(req.userId!);
      res.json(summary);
    }),
  );

  // "My Résumés" data — one entry per distinct résumé filename, including the full
  // question bank. Backs the dashboard panel that proves the "no repeats" claim.
  router.get(
    "/resumes",
    wrap(async (req, res) => {
      const resumes = await dashboardService.resumes(req.userId!);
      res.json({ resumes });
    }),
  );

  app.use("/api/dashboard", router);
}
