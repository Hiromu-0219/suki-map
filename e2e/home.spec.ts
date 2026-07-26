import { expect, test } from "@playwright/test";

test("top page and event form are available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /空き時間を塗って/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "日程調整を作る" }).first()).toHaveAttribute("href", "/events/new");
  await page.goto("/events/new");
  await expect(page.getByRole("heading", { name: "日程調整を作る" })).toBeVisible();
});
