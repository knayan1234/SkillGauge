/**
 * BFF (Backend-For-Frontend) catch-all proxy.
 *
 * Forwards any /api/* request from the browser to the Express backend, server-side, with
 * cookies preserved both ways. Why we want this:
 *
 *   1. **Single-origin FE**. The browser only ever sees `/api/...` on the same host
 *      as the page; CORS preflights disappear entirely. The Express CORS allow-list
 *      only needs to recognise the Next dev/prod origin (or nothing in production —
 *      the BE never receives cross-origin browser requests).
 *
 *   2. **Hide the BE URL**. `NEXT_PUBLIC_*` envs are exposed to the browser. Moving
 *      `BACKEND_URL` to a server-only env keeps the deployment topology private —
 *      attackers can't grep the JS bundle for the backend hostname.
 *
 *   3. **Centralised place to add server-only concerns later**. Future hooks (request
 *      ID injection, rate-limit IP forwarding, retry policy, response shaping for
 *      multi-call aggregation) all slot in here without touching FE call sites.
 *
 * Implementation notes:
 *   - We forward all five HTTP methods we use (GET / POST / PUT / DELETE / PATCH).
 *     Each is a thin wrapper around the same `forward()` function.
 *   - The path catch-all `[...path]` collects everything after `/api/` so
 *     `fetch("/api/auth/login")` proxies to `${BACKEND_URL}/api/auth/login`.
 *   - We forward `Cookie` (incoming) and `Set-Cookie` (outgoing) so the JWT cookie
 *     round-trips correctly. `credentials: "include"` on the FE side stays valid.
 *   - The body is forwarded as a `ReadableStream` for non-GET methods so we don't have
 *     to buffer multi-MB resume uploads in the BFF process.
 *   - Header allow-list: we strip headers that don't belong on the BE leg
 *     (`host`, `connection`, etc.) — Node's `fetch` would reject them.
 */

import { type NextRequest } from "next/server";

// Server-only env. Falls back to the legacy `NEXT_PUBLIC_API_BASE_URL` so existing
// `.env.local` files keep working without a manual update — but new deploys should
// use `BACKEND_URL` to avoid exposing the BE host to the client bundle.
const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

// Headers we explicitly drop before forwarding. These are managed by the runtime
// (Node's fetch) and trying to pass them through breaks the request.
const DROP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  // Keep `accept-encoding` off so we don't get a gzipped body Node's fetch can't
  // decode in-flight; the BE is local enough that compression buys nothing.
  "accept-encoding",
]);

const DROP_RESPONSE_HEADERS = new Set([
  "transfer-encoding",
  "connection",
  // content-encoding is dropped because we drop accept-encoding upstream — the BE
  // shouldn't be sending a compressed body; if it does, leaving the header on
  // would tell the browser to decode it again and break.
  "content-encoding",
  // content-length: Node's runtime sets this for us based on the buffered body.
  "content-length",
]);

interface RouteParams {
  // Next 16 typed dynamic params come back as Promises.
  params: Promise<{ path: string[] }>;
}

async function forward(req: NextRequest, params: RouteParams["params"]): Promise<Response> {
  const { path } = await params;
  // The catch-all gives us ["auth", "login"] for /api/auth/login. Re-join + preserve
  // the query string off the original URL so search params survive the proxy.
  const url = new URL(req.url);
  const target = `${BACKEND_URL}/api/${path.join("/")}${url.search}`;

  // Sanitise incoming headers for the BE leg.
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!DROP_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Body: forward as a stream for non-GET/HEAD methods so we don't buffer large bodies
  // (résumé uploads can be multi-MB). For GET/HEAD, body must be omitted entirely.
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
    // Node 18+ requires explicit duplex when streaming a request body.
    init.duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    // BE unreachable — return a 502 so the FE error path can show "service down"
    // rather than a generic network error. Logged server-side for observability.
    console.error("[BFF] upstream fetch failed:", err);
    return Response.json(
      { code: "BFF_UPSTREAM_UNREACHABLE", message: "Backend service unavailable" },
      { status: 502 },
    );
  }

  // Sanitise outgoing headers and pass through the body. We DON'T re-stream the body
  // because Next's Response constructor handles ReadableStream sources fine.
  const outHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!DROP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      outHeaders.set(key, value);
    }
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

export async function GET(req: NextRequest, ctx: RouteParams) {
  return forward(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: RouteParams) {
  return forward(req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: RouteParams) {
  return forward(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: RouteParams) {
  return forward(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: RouteParams) {
  return forward(req, ctx.params);
}
