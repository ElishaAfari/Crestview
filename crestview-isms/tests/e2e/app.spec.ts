import { expect, test } from "@playwright/test";

test("public home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Crestview International School" })).toBeVisible();
});

test("login flow page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("transport fare collection requires an authorised portal session", async ({
  page,
}) => {
  await page.goto("/transport/fares");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
