import type { Page } from "@playwright/test";
import { expect, generateFleet, mockEncyclopedia, test } from "./fixtures";

const shipButtons = (page: Page) =>
  page.getByRole("button", { name: /^View details for / });

async function expectSettledFleet(page: Page) {
  await expect(page.getByText("VESSEL", { exact: true })).toHaveCount(0);
  await expect(async () => {
    const names = await shipButtons(page).evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")),
    );
    expect(names.length).toBeGreaterThan(0);
    // Leave room for overscan while catching accidental full-list rendering.
    expect(names.length).toBeLessThan(100);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual([...names].sort());
  }).toPass({ timeout: 5_000 });
}

for (const view of ["grid", "table"] as const) {
  test(`rapid scrolling in ${view} keeps ships and details correct`, async ({
    page,
    fleet,
  }) => {
    fleet.vehicles = generateFleet(1_000);
    await page.goto(`/?sort=name&view=${view}`);
    await expect(page.getByRole("status")).toHaveText("1,000 ships found");
    const first = page.getByRole("button", {
      name: "View details for Ship 0000",
      exact: true,
    });
    const last = page.getByRole("button", {
      name: "View details for Ship 0999",
      exact: true,
    });
    await expect(first).toBeInViewport();
    await expectSettledFleet(page);

    await page.mouse.move(640, 700);
    for (let step = 0; step < 3; step++) await page.mouse.wheel(0, 4_000);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(6_000);
    await expect(first).toHaveCount(0);
    await expectSettledFleet(page);

    // Newly measured table rows can change the estimated document height.
    await expect(async () => {
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      await expect(last).toBeInViewport({ timeout: 500 });
    }).toPass({ timeout: 5_000 });
    await expectSettledFleet(page);
    await last.click();
    const dialog = page.getByRole("dialog", { name: "Ship 0999", exact: true });
    // The dialog wrapper has no box; its fixed-position panel is visible.
    await expect(
      dialog.getByRole("heading", { name: "Ship 0999", exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByText("Test profile for Ship 0999.", { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Close ship details" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(last).toBeFocused();

    const endScroll = await page.evaluate(() => window.scrollY);
    for (let step = 0; step < 3; step++) await page.mouse.wheel(0, -4_000);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(endScroll - 6_000);
    await expect(last).toHaveCount(0);
    await expectSettledFleet(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(first).toBeInViewport();
    await expectSettledFleet(page);
  });
}

async function selectYamatoFilters(page: Page) {
  await page.getByRole("searchbox", { name: "Search ships" }).fill("Yamato");
  await page
    .getByRole("group", { name: "Class", exact: true })
    .getByRole("button", { name: "Battleship", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Nation", exact: true })
    .getByRole("button", { name: "Japan", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Ship tier" })
    .getByRole("button", { name: "X", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("1 ship found");
  await expect(shipButtons(page)).toHaveCount(1);
  await expect(shipButtons(page)).toHaveAccessibleName(
    "View details for Yamato",
  );
}

test("search and combined filters recover from empty results", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("2 ships found");
  await selectYamatoFilters(page);
  await page
    .getByRole("searchbox", { name: "Search ships" })
    .fill("no-such-vessel");
  await expect(page.getByText("No ships found", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("0 ships found");
  await expect(shipButtons(page)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("2 ships found");
  await expect(shipButtons(page)).toHaveCount(2);
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page).toHaveURL("/");
});

async function expectRestoredFilters(page: Page) {
  await expect(page.getByRole("searchbox")).toHaveValue("Yamato");
  await expect(page.getByRole("button", { name: "Sort ships" })).toHaveText(
    "Name: A to Z",
  );
  await expect(
    page.getByRole("button", { name: "Table view" }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const [group, name] of [
    ["Class", "Battleship"],
    ["Nation", "Japan"],
    ["Ship tier", "X"],
  ]) {
    await expect(
      page
        .getByRole("group", { name: group, exact: true })
        .getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.getByRole("status")).toHaveText("1 ship found");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(shipButtons(page)).toHaveCount(1);
  await expect(shipButtons(page)).toHaveAccessibleName(
    "View details for Yamato",
  );
}

test("sorting and table filters survive reload and a fresh-context deep link", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/?campaign=e2e#fleet");
  await expect(shipButtons(page).first()).toHaveAccessibleName(
    "View details for Yamato",
  );
  await page.getByRole("button", { name: "Sort ships" }).click();
  await page.getByRole("option", { name: "Name: A to Z" }).click();
  await expect(shipButtons(page).first()).toHaveAccessibleName(
    "View details for Hill",
  );
  await page.getByRole("button", { name: "Table view" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(shipButtons(page).first()).toHaveAccessibleName(
    "View details for Hill",
  );
  await selectYamatoFilters(page);
  await expect(page).toHaveURL(
    (url) =>
      url.hash === "#fleet" &&
      url.searchParams.get("campaign") === "e2e" &&
      url.searchParams.get("q") === "Yamato" &&
      url.searchParams.get("type") === "Battleship" &&
      url.searchParams.get("nation") === "japan" &&
      url.searchParams.get("tier") === "10" &&
      url.searchParams.get("sort") === "name" &&
      url.searchParams.get("view") === "table",
  );
  const sharedURL = page.url();
  await page.reload();
  await expectRestoredFilters(page);

  const freshContext = await browser.newContext({ baseURL });
  try {
    await mockEncyclopedia(freshContext, baseURL!);
    const freshPage = await freshContext.newPage();
    await freshPage.goto(sharedURL);
    await expectRestoredFilters(freshPage);
    await freshPage.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(freshPage).toHaveURL("/?campaign=e2e&view=table#fleet");
    await expect(freshPage.getByRole("searchbox")).toHaveValue("");
    await expect(
      freshPage.getByRole("button", { name: "Sort ships" }),
    ).toHaveText("Tier: high to low");
    await expect(
      freshPage.getByRole("button", { name: "Table view" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(freshPage.getByRole("status")).toHaveText("2 ships found");
    await expect(shipButtons(freshPage)).toHaveCount(2);
    await expect(shipButtons(freshPage).first()).toHaveAccessibleName(
      "View details for Yamato",
    );
  } finally {
    await freshContext.close();
  }
});

test("a failed catalogue can be retried from the error screen", async ({
  page,
  fleet,
}) => {
  fleet.vehiclesUnavailable = true;
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Loading fleet" }),
  ).toBeVisible();
  // The production query client retries automatically before showing an error.
  await expect(page.getByRole("alert")).toContainText(
    "Unable to load the fleet",
    { timeout: 15_000 },
  );
  fleet.vehiclesUnavailable = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("status")).toHaveText("2 ships found");
  await expect(shipButtons(page)).toHaveCount(2);
  await expect(page.getByRole("button", { name: "All hulls" })).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
