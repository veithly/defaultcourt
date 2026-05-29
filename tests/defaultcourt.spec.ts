import { expect, test } from "@playwright/test";
import { resetCases } from "../src/lib/cases";

test.beforeEach(async () => {
  await resetCases();
});

test("DefaultCourt hero flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Missed covenants become recovery receipts.")).toBeVisible();
  await page.getByRole("link", { name: /Enter the court/i }).click();
  await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
  await expect(page.getByTestId("case-room")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: /Trigger covenant breach/i }).click();
  await expect(page.getByText("Breach active")).toBeVisible();
  await page.getByRole("button", { name: /Attach evidence/i }).click();
  await page.getByRole("button", { name: /Cast guardian vote/i }).click();
  await expect(page.getByText(/1\/2 approvals|2\/2 approvals/)).toBeVisible();
  await page.getByRole("button", { name: /Cast guardian vote/i }).click();
  await expect(page.getByText("2/2 approvals needed to close recovery.")).toBeVisible();
  await page.getByRole("button", { name: /Resolve recovery/i }).click();
  await page.getByRole("link", { name: /Open receipt/i }).click();
  await expect(page.getByText("DefaultCourt receipt")).toBeVisible();
  await page.goto("/app/contract");
  await expect(page.getByText(/Waiting for funded mnemonic|Funded signer configured/i)).toBeVisible();
});
