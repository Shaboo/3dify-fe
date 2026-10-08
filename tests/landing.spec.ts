import { test, expect } from "@playwright/test";

test("illustrative object detail toggles and workspace action remains available", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Illustrative artwork", { exact: true }),
  ).toBeVisible();
  const detail = page.getByRole("button", { name: "Inspect detail" });
  await detail.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Full object" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Full object" }).click();
  await expect(
    page.getByRole("button", { name: "Inspect detail" }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".stage-action")).toHaveAttribute(
    "href",
    "/dashboard",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
