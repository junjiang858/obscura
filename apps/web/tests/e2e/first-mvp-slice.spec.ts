import path from "node:path";
import { expect, test } from "@playwright/test";

test("edits and downloads an image without external media upload requests", async ({ page }) => {
  const externalRequests: string[] = [];

  await page.addInitScript(() => {
    Object.defineProperty(window, "showSaveFilePicker", {
      configurable: true,
      value: undefined,
    });
  });

  page.on("request", (request) => {
    const url = new URL(request.url());
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";

    if (isHttp && !isLocal) {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(page.getByText(/obscura/i)).toBeVisible();
  await expect(page.getByText(/local & private/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /^upload$/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /add media/i })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: /start your creation/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /import media/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /explore templates/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /export current asset/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^edit$/i })).toHaveCount(0);

  await page
    .getByLabel(/choose media files/i)
    .setInputFiles(path.join(import.meta.dirname, "../fixtures/local-image.svg"));
  await expect(page.getByRole("button", { name: /local-image\.svg/i })).toBeVisible();
  await expect(page.getByText(/privacy status/i)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^edit$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^export$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /export current asset/i })).toBeVisible();

  await page.getByRole("button", { name: /1:1 square/i }).click();
  await page.getByRole("button", { name: /rotate 90/i }).click();
  await page.getByRole("button", { name: /flip horizontal/i }).click();
  await page.getByLabel(/output width/i).fill("512");
  await page.getByRole("tab", { name: /beautify/i }).click();
  await page.getByLabel(/brightness/i).fill("14");
  await page.getByRole("tab", { name: /layers/i }).click();
  await page.getByLabel(/watermark text/i).fill("Draft");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export current asset/i }).click();
  const download = await downloadPromise;
  await expect(page.getByText(/export saved/i)).toBeVisible();

  expect(download.suggestedFilename()).toBe("local-image-edited.png");
  expect(externalRequests).toEqual([]);
});

test("uses Chinese for Chinese browsers and allows manual English switching", async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: "zh-CN" });
  const page = await context.newPage();

  await page.goto("/");
  await expect(page.getByRole("button", { name: /添加媒体/i }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /开始你的创作/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /导入媒体/i })).toBeVisible();
  await expect(page.getByText(/隐私状态/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /探索模板/i })).toHaveCount(0);

  await page.getByLabel(/语言/i).selectOption("en");
  await expect(page.getByRole("button", { name: /add media/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /import media/i })).toBeVisible();

  await context.close();
});
