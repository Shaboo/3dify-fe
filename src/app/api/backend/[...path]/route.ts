import { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 85 * 1024 * 1024;
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const backend = process.env.BACKEND_URL || "http://localhost:8080";
  const path = segments.map(encodeURIComponent).join("/");
  if (!["auth", "public", "dashboard", "admin", "api"].includes(segments[0]))
    return Response.json({ message: "Unknown API route" }, { status: 404 });
  const headers = new Headers();
  for (const name of ["content-type", "authorization", "x-api-key"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(240000),
    ]);
    let body: Buffer<ArrayBuffer> | undefined;
    if (request.body && request.method !== "GET" && request.method !== "HEAD") {
      const reader = request.body.getReader();
      const abort = () => {
        void reader.cancel().catch(() => {});
      };
      signal.addEventListener("abort", abort, { once: true });
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          signal.throwIfAborted();
          const { done, value } = await reader.read();
          signal.throwIfAborted();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY_BYTES) {
            await reader.cancel();
            return Response.json(
              { message: "Upload exceeds the 85 MB request limit." },
              { status: 413 },
            );
          }
          chunks.push(value);
        }
        body = Buffer.concat(chunks, size);
      } finally {
        signal.removeEventListener("abort", abort);
        reader.releaseLock();
      }
    }
    const response = await fetch(
      `${backend.replace(/\/$/, "")}/${path}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal,
      },
    );
    return new Response(response.body, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const timeout =
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name);
    return Response.json(
      {
        message: timeout
          ? "The backend response timed out. Check job history before submitting again."
          : "The backend is unavailable. Make sure it is running on the configured BACKEND_URL.",
      },
      { status: timeout ? 504 : 502 },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };
