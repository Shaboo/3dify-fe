import { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();
    const response = await fetch(
      `${backend.replace(/\/$/, "")}/${path}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(240000),
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
