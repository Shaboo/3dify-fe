import { test, expect } from "@playwright/test";
test.beforeEach(async ({ request }) => {
  const response = await request.get("/api/backend/dashboard/test-fixture");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    fixture: "3dify-website-regression",
  });
});
test("real proxy forwards multipart uploads larger than 10 MB with API-key authentication", async ({
  request,
}) => {
  const payload = Buffer.alloc(12 * 1024 * 1024, 1);
  const response = await request.post("/api/backend/api/v1/generate", {
    headers: { "X-API-KEY": "omni_pk_fixture" },
    multipart: {
      images: {
        name: "large-photo.png",
        mimeType: "image/png",
        buffer: payload,
      },
    },
    timeout: 30000,
  });
  expect(response.status()).toBe(202);
  const result = await response.json();
  expect(result.byteCount).toBeGreaterThan(payload.length);
  expect(result.imageParts).toBe(1);
  expect(result.hasApiKey).toBe(true);
  expect(result.hasBearer).toBe(false);
  expect(result.contentType).toContain("multipart/form-data; boundary=");
});
test("real proxy preserves upstream authentication errors and restricts route prefixes", async ({
  request,
}) => {
  const response = await request.post("/api/backend/api/v1/generate", {
    data: "test",
  });
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ message: "API key required" });
  expect((await request.get("/api/backend/actuator/env")).status()).toBe(404);
});
