import { test, expect, Page } from "@playwright/test";
const token = `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
const account = {
  token,
  userId: "user-test",
  email: "test@example.com",
  isAdmin: false,
};
const plan = {
  id: "free-plan",
  name: "free",
  displayName: "Free",
  description: "No card required.",
  priceCents: 0,
  currency: "usd",
  rateLimitRpm: 10,
  monthlyQuota: 100,
  sortOrder: 1,
  stripePriceId: null,
  isActive: true,
};
const job = {
  id: "c12a6a30-4ab6-43c1-8a55-9ce2a25b2c12",
  status: "PENDING",
  inputImages: ["front", "back"],
  inputImage1: "front",
  inputImage2: "back",
  outputGlbUrl: null,
  outputUsdzUrl: null,
  errorMessage: null,
  createdAt: "2026-10-07T19:00:00Z",
  completedAt: null,
};
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8qkAAAAASUVORK5CYII=",
  "base64",
);
function photos(count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    name: `angle-${i + 1}.png`,
    mimeType: "image/png",
    buffer: png,
  }));
}
async function switchAccount(page: Page) {
  const otherTab = await page.context().newPage();
  await otherTab.goto(new URL("/", page.url()).href);
  await otherTab.evaluate(
    (user) => localStorage.setItem("omni3d_auth", JSON.stringify(user)),
    {
      ...account,
      userId: "second-user",
      email: "second@example.com",
      token: `${token}2`,
    },
  );
  await expect(
    page.getByText("second@example.com", { exact: true }),
  ).toBeAttached();
  await otherTab.close();
}
async function setup(
  page: Page,
  {
    admin = false,
    active = true,
    failSubmit = false,
    max = 4,
    signedIn = true,
  }: {
    admin?: boolean;
    active?: boolean;
    failSubmit?: boolean;
    max?: number;
    signedIn?: boolean;
  } = {},
) {
  const state = {
    active,
    jobs: [] as any[],
    submissions: 0,
    keyCreates: 0,
    body: "",
    keys: [] as any[],
    webhook: null as any,
    adminReads: 0,
    planSaves: 0,
    jobReads: 0,
  };
  if (signedIn)
    await page.addInitScript(
      (user) => localStorage.setItem("omni3d_auth", JSON.stringify(user)),
      { ...account, isAdmin: admin },
    );
  await page.route("**/api/backend/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/backend", "");
    const method = request.method();
    const reply = (body: any, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (path === "/public/plans") return reply([plan]);
    if (path === "/dashboard/generation-options")
      return reply({ provider: "meshy", minImages: 1, maxImages: max });
    if (path === "/dashboard/subscription")
      return reply({
        planId: state.active ? plan.id : null,
        planName: state.active ? "free" : null,
        displayName: state.active ? "Free" : null,
        priceCents: state.active ? 0 : null,
        status: state.active ? "active" : null,
        currentPeriodEnd: null,
        isActive: state.active,
      });
    if (path === "/dashboard/subscription/checkout") {
      state.active = true;
      return reply({ checkoutUrl: "http://127.0.0.1:3100/dashboard" });
    }
    if (path === "/dashboard/api-keys" && method === "POST") {
      state.keyCreates++;
      state.keys.push({
        id: "key-test",
        keyPrefix: "omni_pk_test",
        label: "Website generation",
        planName: "free",
        isActive: true,
        createdAt: job.createdAt,
        revokedAt: null,
      });
      return reply(
        {
          id: "key-test",
          key: "omni_pk_browser_test",
          label: "Website generation",
          planName: "free",
          createdAt: job.createdAt,
        },
        201,
      );
    }
    if (path === "/dashboard/api-keys") return reply(state.keys);
    if (path.startsWith("/dashboard/api-keys/") && method === "DELETE") {
      state.keys[0].isActive = false;
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/v1/generate") {
      state.submissions++;
      state.body = request.postDataBuffer()?.toString("latin1") || "";
      expect(request.headers()["x-api-key"]).toBe("omni_pk_browser_test");
      expect(request.headers()["authorization"]).toBeUndefined();
      state.jobs = [{ ...job }];
      if (failSubmit) return reply({ message: "Response timed out" }, 504);
      return reply({ jobId: job.id, status: "PENDING" }, 202);
    }
    if (path === "/dashboard/jobs") {
      state.jobReads++;
      return reply(state.jobs);
    }
    if (path.endsWith("/history"))
      return reply([
        {
          id: "history-test",
          jobId: job.id,
          status: state.jobs[0]?.status || "PENDING",
          details: "Generation task status",
          createdAt: job.createdAt,
        },
      ]);
    if (path === "/dashboard/webhooks") {
      if (method === "PUT") {
        state.webhook = {
          id: "webhook-test",
          url: JSON.parse(request.postData()!).url,
          createdAt: job.createdAt,
          updatedAt: job.createdAt,
        };
        return reply(state.webhook);
      }
      if (method === "DELETE") {
        state.webhook = null;
        return route.fulfill({ status: 204 });
      }
      return reply(state.webhook);
    }
    if (path === "/admin/plans") {
      if (method === "GET") {
        state.adminReads++;
        return reply([plan]);
      }
      state.planSaves++;
      return reply({ ...plan, ...JSON.parse(request.postData()!) }, 201);
    }
    if (path.startsWith("/admin/plans/")) {
      state.planSaves++;
      return reply({ ...plan, ...JSON.parse(request.postData() || "{}") });
    }
    if (path === "/auth/login" || path === "/auth/register")
      return reply(account);
    return reply(
      { message: `Unexpected mock endpoint: ${method} ${path}` },
      404,
    );
  });
  return state;
}
test("uploads multiple photos, submits once, polls and downloads outputs", async ({
  page,
}) => {
  const state = await setup(page, { active: false });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Activate free plan" }).click();
  await expect(page.getByText("Free active")).toBeVisible();
  await page.getByLabel("Upload photos").setInputFiles(photos(4));
  await expect(page.getByAltText(/Selected photo/)).toHaveCount(4);
  await page
    .getByRole("button", { name: "Generate 3D model", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Generation in progress" }),
  ).toBeDisabled();
  expect(state.submissions).toBe(1);
  expect(state.keyCreates).toBe(1);
  expect(state.body.match(/name="images"/g)?.length).toBe(4);
  expect(state.body).not.toContain('name="image1"');
  state.jobs = [
    {
      ...job,
      status: "SUCCESS",
      outputGlbUrl: "https://models.example.test/result.glb",
      outputUsdzUrl: "https://models.example.test/result.usdz",
      completedAt: "2026-10-07T19:05:00Z",
    },
  ];
  await page.getByRole("button", { name: "Refresh jobs" }).click();
  await expect(
    page.getByRole("link", { name: "Download GLB" }),
  ).toHaveAttribute("href", "https://models.example.test/result.glb");
  await expect(page.getByRole("link", { name: "Download USDZ" })).toBeVisible();
  await page.getByRole("button", { name: "View job history" }).click();
  await expect(page.getByText("Generation task status")).toBeVisible();
  await page.screenshot({
    path: `test-results/generation-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByRole("link", { name: "Download GLB" })).toBeVisible();
  expect(state.submissions).toBe(1);
  await page.getByRole("button", { name: "Start a new generation" }).click();
  await expect(page.getByAltText(/Selected photo/)).toHaveCount(0);
});
test("ambiguous response blocks retry and survives reload", async ({
  page,
}) => {
  const state = await setup(page, { failSubmit: true });
  await page.goto("/dashboard");
  await expect(page.getByText("Free active")).toBeVisible();
  await page.getByLabel("Upload photos").setInputFiles(photos(1));
  await page
    .getByRole("button", { name: "Generate 3D model", exact: true })
    .click();
  await expect(
    page.getByText(/backend may already have accepted/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate 3D model", exact: true }),
  ).toHaveCount(0);
  expect(state.submissions).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Check job history" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check job history" }).click();
  await expect(
    page.getByRole("button", {
      name: "I checked history; allow a new submission",
    }),
  ).toBeVisible();
  expect(state.submissions).toBe(1);
});
test("provider photo limit and backend failure are visible", async ({
  page,
}) => {
  const state = await setup(page, { max: 2 });
  await page.goto("/dashboard");
  await expect(page.getByText("Free active")).toBeVisible();
  await page.getByLabel("Upload photos").setInputFiles(photos(3));
  await expect(page.getByText(/accepts at most 2 photos/)).toBeVisible();
  await expect(page.getByAltText(/Selected photo/)).toHaveCount(0);
  await page.getByLabel("Upload photos").setInputFiles(photos(1));
  await page
    .getByRole("button", { name: "Generate 3D model", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Generation in progress" }),
  ).toBeDisabled();
  state.jobs = [
    {
      ...job,
      status: "FAILED",
      errorMessage: "Provider request timed out; submission uncertain",
    },
  ];
  await page.getByRole("button", { name: "Refresh jobs" }).click();
  await page.getByRole("button", { name: new RegExp(job.id) }).click();
  await expect(
    page.getByText("Provider request timed out; submission uncertain"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start a new generation" }),
  ).toBeVisible();
});
test("user role cannot load admin data", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin access required" }),
  ).toBeVisible();
  expect(state.adminReads).toBe(0);
  await expect(
    page.getByRole("link", { name: "Admin", exact: true }),
  ).toHaveCount(0);
});
test("admin can edit backend plans", async ({ page }) => {
  const state = await setup(page, { admin: true });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Display name").fill("Updated free plan");
  await page.getByRole("button", { name: "Save plan" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.planSaves).toBe(1);
});
test("webhook can be saved and removed", async ({ page }) => {
  await setup(page);
  await page.goto("/dashboard/webhooks");
  await page.getByLabel("Webhook URL").fill("https://example.test/events");
  await page.getByRole("button", { name: "Save endpoint" }).click();
  await expect(
    page.getByText("Current endpoint: https://example.test/events"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove webhook" }).click();
  await expect(page.getByText("No webhook configured.")).toBeVisible();
});

test("editing a zero-quota plan preserves zero when saving another field", async ({
  page,
}) => {
  await setup(page, { admin: true });
  let saved: any;
  await page.route("**/api/backend/admin/plans**", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: [{ ...plan, monthlyQuota: 0 }] });
    saved = route.request().postDataJSON();
    await route.fulfill({ json: { ...plan, ...saved } });
  });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Monthly job quota")).toHaveValue("0");
  await page.getByLabel("Display name").fill("Renamed plan");
  await page.getByRole("button", { name: "Save plan" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(saved).toMatchObject({ displayName: "Renamed plan", monthlyQuota: 0 });
});
test("key is shown once and can be revoked", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/dashboard/keys");
  await page.getByRole("button", { name: "Create key", exact: true }).click();
  await page.getByLabel("Label").fill("Browser test");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create key", exact: true })
    .click();
  await expect(
    page.getByText("omni_pk_browser_test", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByText("omni_pk_browser_test", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Revoke", exact: true }).click();
  await page.getByRole("button", { name: "Revoke key", exact: true }).click();
  await expect(page.getByText("Revoked", { exact: true })).toBeVisible();
  expect(state.keys[0].isActive).toBe(false);
});
test("expired session redirects to sign-in", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "omni3d_auth",
      JSON.stringify({
        token: "expired",
        userId: "test",
        email: "test@example.com",
        isAdmin: true,
      }),
    ),
  );
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});
test("public pages fit the viewport", async ({ page }) => {
  await setup(page);
  for (const path of ["/", "/subscribe", "/docs"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("registration leads to the generation workspace", async ({ page }) => {
  await setup(page, { signedIn: false });
  await page.goto("/auth/register");
  await page.getByLabel("Name", { exact: true }).fill("Website tester");
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Photos into 3D." }),
  ).toBeVisible();
});

test("account switch clears photos and the previous account's pending task", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/dashboard");
  await expect(page.getByText("Free active")).toBeVisible();
  await page.getByLabel("Upload photos").setInputFiles(photos(1));
  await page
    .getByRole("button", { name: "Generate 3D model", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Generation in progress" }),
  ).toBeDisabled();
  state.jobs = [];
  await switchAccount(page);
  await expect(page.getByText("Free active")).toBeVisible();
  await expect(page.getByText(job.id, { exact: true })).toHaveCount(0);
  await expect(page.getByAltText(/Selected photo/)).toHaveCount(0);
  await page.getByLabel("Upload photos").setInputFiles(photos(1));
  await expect(
    page.getByRole("button", { name: "Generate 3D model", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() => sessionStorage.getItem("3dify:website-key")),
  ).toBeNull();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("3dify:pending:user-test")!).jobId,
    ),
  ).toBe(job.id);
});

test("a late API key response cannot submit or cache credentials after account switch", async ({
  page,
}) => {
  const state = await setup(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received!: () => void;
  const started = new Promise<void>((resolve) => {
    received = resolve;
  });
  await page.route("**/api/backend/dashboard/api-keys", async (route) => {
    received();
    await gate;
    await route.fulfill({ json: { id: "old-key", key: "old-account-secret" } });
  });
  await page.goto("/dashboard");
  await expect(page.getByText("Free active")).toBeVisible();
  await page.getByLabel("Upload photos").setInputFiles(photos(1));
  await page
    .getByRole("button", { name: "Generate 3D model", exact: true })
    .click();
  await started;
  await switchAccount(page);
  const response = page.waitForResponse("**/api/backend/dashboard/api-keys");
  release();
  await (await response).finished();
  await expect(page.getByText("Free active")).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("3dify:website-key")),
  ).toBeNull();
  expect(state.submissions).toBe(0);
});

test("a late 401 from the previous account does not sign out the current account", async ({
  page,
}) => {
  await setup(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/backend/dashboard/jobs", async (route) => {
    if (route.request().headers().authorization !== `Bearer ${token}`)
      return route.fulfill({ json: [] });
    await gate;
    await route.fulfill({
      status: 401,
      json: { message: "Expired old session" },
    });
  });
  await page.goto("/dashboard");
  await expect(page.getByText("Free active")).toBeVisible();
  await switchAccount(page);
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith("/dashboard/jobs") && response.status() === 401,
  );
  release();
  await (await response).finished();
  await expect(
    page.getByText("second@example.com", { exact: true }),
  ).toBeAttached();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("omni3d_auth")!).userId,
    ),
  ).toBe("second-user");
});

test("job polling stops after completion and manual refresh still works", async ({
  page,
}) => {
  const state = await setup(page);
  state.jobs = [{ ...job }];
  await page.clock.install();
  await page.goto("/dashboard/jobs");
  await expect(
    page.getByRole("button", { name: new RegExp(job.id) }),
  ).toContainText("Queued");
  const initialReads = state.jobReads;
  state.jobs[0].status = "PROCESSING";
  await page.clock.fastForward(8000);
  await expect(
    page.getByRole("button", { name: new RegExp(job.id) }),
  ).toContainText("Generating");
  expect(state.jobReads).toBe(initialReads + 1);
  state.jobs[0].status = "SUCCESS";
  await page.clock.fastForward(8000);
  await expect(
    page.getByRole("button", { name: new RegExp(job.id) }),
  ).toContainText("Ready");
  expect(state.jobReads).toBe(initialReads + 2);
  await page.clock.fastForward(24000);
  expect(state.jobReads).toBe(initialReads + 2);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect.poll(() => state.jobReads).toBe(initialReads + 3);
});

test("an accepted job keeps polling until it appears in history", async ({
  page,
}) => {
  const state = await setup(page);
  let visible = false;
  await page.route("**/api/backend/dashboard/jobs", async (route) => {
    state.jobReads++;
    await route.fulfill({ json: visible ? state.jobs : [] });
  });
  await page.clock.install();
  await page.goto("/dashboard");
  await expect(page.getByText("Free active")).toBeVisible();
  await expect(page.getByText("Your first model starts here.")).toBeVisible();
  const initialReads = state.jobReads;
  await page.clock.fastForward(16000);
  expect(state.jobReads).toBe(initialReads);
  await page.getByLabel("Upload photos").setInputFiles(photos(1));
  await page
    .getByRole("button", { name: "Generate 3D model", exact: true })
    .click();
  await expect(
    page.getByText("Task accepted. Waiting for its first update."),
  ).toBeVisible();
  await expect.poll(() => state.jobReads).toBe(initialReads + 1);
  visible = true;
  await page.clock.fastForward(8000);
  await expect(
    page.getByRole("button", { name: new RegExp(job.id) }),
  ).toBeVisible();
  expect(state.jobReads).toBe(initialReads + 2);
});

test("job polling retries a temporary history error", async ({ page }) => {
  await setup(page);
  let reads = 0;
  let failing = true;
  await page.route("**/api/backend/dashboard/jobs", async (route) => {
    reads++;
    await route.fulfill(
      failing
        ? { status: 503, json: { message: "Temporary history outage" } }
        : { json: [] },
    );
  });
  await page.clock.install();
  await page.goto("/dashboard/jobs");
  await expect(page.getByText("Temporary history outage")).toBeVisible();
  const initialReads = reads;
  failing = false;
  await page.clock.fastForward(8000);
  await expect(page.getByText("Temporary history outage")).toHaveCount(0);
  expect(reads).toBe(initialReads + 1);
});
