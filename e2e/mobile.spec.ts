import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(0);
}

test("mobile controls and ship details remain usable in both views", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("2 ships found");
  await expectNoHorizontalOverflow(page);
  const premiumGroup = page.getByRole("group", {
    name: "Premium",
    exact: true,
  });
  await premiumGroup
    .getByRole("button", { name: "Premium", exact: true })
    .tap();
  await expect(page.getByRole("status")).toHaveText("1 ship found");
  await expect(
    page.getByRole("button", { name: "View details for Hill" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await premiumGroup.getByRole("button", { name: "Regular" }).tap();
  await expect(premiumGroup.getByRole("button", { pressed: true })).toHaveCount(
    2,
  );
  await expect(page.getByRole("status")).toHaveText("2 ships found");
  await expect(
    page.getByRole("button", { name: "View details for Yamato" }),
  ).toBeVisible();
  await premiumGroup.getByRole("button", { name: "All", exact: true }).tap();
  await expect(page.getByRole("status")).toHaveText("2 ships found");
  const search = page.getByRole("searchbox", { name: "Search ships" });
  await search.tap();
  await search.fill("Yamato");
  await search.press("Enter");
  await page
    .getByRole("group", { name: "Nation", exact: true })
    .getByRole("button", { name: "Japan", exact: true })
    .tap();
  await expect(page.getByRole("status")).toHaveText("1 ship found");
  await page.getByRole("button", { name: "View details for Yamato" }).tap();
  const dialog = page.getByRole("dialog", { name: "Yamato", exact: true });
  await expect(
    dialog.getByRole("heading", { name: "Yamato", exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText(/The preliminary draft design/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await dialog.getByRole("button", { name: "Close ship details" }).tap();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Clear search" }).tap();
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await page.getByRole("button", { name: "Reset", exact: true }).tap();
  await page.getByRole("button", { name: "Table view" }).tap();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("2 ships found");
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "View details for Hill" }).tap();
  const tableDialog = page.getByRole("dialog", { name: "Hill", exact: true });
  await expect(
    tableDialog.getByRole("heading", { name: "Hill", exact: true }),
  ).toBeVisible();
  await tableDialog.getByRole("button", { name: "Close ship details" }).tap();
  await expect(tableDialog).toHaveCount(0);
  await page.getByRole("button", { name: "Grid view" }).tap();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "View details for Yamato" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
