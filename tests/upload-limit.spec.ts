import { test, expect } from "@playwright/test";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/backend/[...path]/route";

test("proxy bounds streamed uploads without trusting the declared size", async () => {
  const originalFetch = globalThis.fetch;
  let forwarded = 0;
  globalThis.fetch = async (_input, init) => {
    forwarded++;
    return Response.json({ bytes: (init?.body as Buffer).byteLength });
  };
  try {
    const limit = 85 * 1024 * 1024;
    const chunk = new Uint8Array(1024 * 1024);
    for (const [bytes, declaredSize] of [
      [limit, undefined],
      [limit + 1, undefined],
      [limit + 1, "1"],
    ] as const) {
      let remaining = bytes;
      let cancelled = false;
      const body = new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            if (!remaining) return controller.close();
            const next = Math.min(remaining, chunk.byteLength);
            remaining -= next;
            controller.enqueue(chunk.subarray(0, next));
          },
          cancel() {
            cancelled = true;
          },
        },
        { highWaterMark: 0 },
      );
      const request = new NextRequest(
        "http://localhost/api/backend/api/v1/generate",
        {
          method: "POST",
          body,
          headers: declaredSize ? { "content-length": declaredSize } : {},
          duplex: "half",
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ path: ["api", "v1", "generate"] }),
      });
      expect(response.status).toBe(bytes > limit ? 413 : 200);
      if (bytes === limit)
        expect(await response.json()).toEqual({ bytes: limit });
      else expect(cancelled).toBe(true);
    }
    expect(forwarded).toBe(1);
    const controller = new AbortController();
    let cancelled = false;
    const stalledBody = new ReadableStream<Uint8Array>(
      {
        pull() {
          controller.abort();
        },
        cancel() {
          cancelled = true;
        },
      },
      { highWaterMark: 0 },
    );
    const response = await POST(
      new NextRequest("http://localhost/api/backend/api/v1/generate", {
        method: "POST",
        body: stalledBody,
        duplex: "half",
        signal: controller.signal,
      }),
      { params: Promise.resolve({ path: ["api", "v1", "generate"] }) },
    );
    expect(response.status).toBe(504);
    expect(cancelled).toBe(true);
    expect(forwarded).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
