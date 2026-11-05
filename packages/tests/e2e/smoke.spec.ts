import { expect, test } from "@playwright/test"

/**
 * The smoke of the app.
 *
 * @remarks
 * The title starts with the acceptance criterion's id. That is the contract
 * the factory relies on to run one criterion at a time, and the rule
 * `rules/0003-los-tests-e2e-empiezan-por-su-ac` checks it.
 */
test("AC-1 · la home muestra el título y el botón inicial", async ({
  page,
}) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Project ready!" }),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Button" })).toBeVisible()
})
