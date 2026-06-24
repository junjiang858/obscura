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
  await expect(page.getByRole("button", { name: /export asset/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^edit$/i })).toHaveCount(0);

  await page
    .getByLabel(/choose media files/i)
    .setInputFiles(path.join(import.meta.dirname, "../fixtures/local-image.svg"));
  await expect(page.getByRole("button", { name: /local-image\.svg/i })).toBeVisible();
  await expect(page.getByText(/privacy status/i)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^edit$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^export$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /export asset/i })).toBeVisible();

  await page.getByRole("button", { name: /1:1 square/i }).click();
  await page.getByRole("button", { name: /rotate 90/i }).click();
  await page.getByRole("button", { name: /flip horizontal/i }).click();
  await page.getByLabel(/output width/i).fill("512");
  await page.getByRole("tab", { name: /beautify/i }).click();
  await page.getByLabel(/brightness/i).fill("14");
  await page.getByRole("tab", { name: /layers/i }).click();
  await page.getByLabel(/watermark text/i).fill("Draft");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export asset/i }).click();
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

test("supports mobile tabs, keyboard asset switching, and unsupported media state", async ({
  browser,
}) => {
  const context = await browser.newContext({
    isMobile: true,
    viewport: { height: 844, width: 390 },
  });
  const page = await context.newPage();
  const externalRequests: string[] = [];

  page.on("request", (request) => {
    const url = new URL(request.url());
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";

    if (isHttp && !isLocal) {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("tab", { name: /^media$/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^preview$/i })).toBeVisible();

  await page
    .getByLabel(/choose media files/i)
    .setInputFiles([
      path.join(import.meta.dirname, "../fixtures/local-image.svg"),
      path.join(import.meta.dirname, "../fixtures/local-video.webm"),
    ]);

  await expect(page.getByRole("heading", { name: /local-image\.svg/i })).toBeVisible();
  await page.getByRole("heading", { name: /local-image\.svg/i }).click();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: /local-video\.webm/i })).toBeVisible();

  await page.getByRole("tab", { name: /^edit$/i }).click();
  await expect(page.getByRole("heading", { name: /^edit$/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^trim$/i })).toBeVisible();

  await page.getByRole("tab", { name: /^export$/i }).click();
  await expect(page.getByRole("heading", { name: /^export$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /export asset/i })).toBeVisible();

  await page.getByLabel(/choose media files/i).setInputFiles({
    buffer: Buffer.from("not a supported media file"),
    mimeType: "text/plain",
    name: "notes.txt",
  });

  await expect(page.getByRole("heading", { name: /notes\.txt/i })).toBeVisible();
  await expect(page.getByText(/unsupported format/i)).toBeVisible();
  expect(externalRequests).toEqual([]);

  await context.close();
});

test("edits and exports a short video with timeline evidence and no media upload", async ({
  page,
}) => {
  test.setTimeout(90_000);
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
  await page
    .getByLabel(/choose media files/i)
    .setInputFiles(path.join(import.meta.dirname, "../fixtures/local-video.webm"));

  await expect(page.getByRole("button", { name: /local-video\.webm/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^edit$/i })).toBeVisible();
  await expect(page.locator(".video-workbench-badges")).toContainText("WEBM");
  await expect(page.locator(".video-preview")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.getByText(/source preview/i)).toHaveCount(0);

  await expect(page.locator('[data-testid="video-thumbnail-frame"]').first()).toBeVisible();
  expect(
    await page.locator('[data-testid="video-thumbnail-frame"]').count(),
  ).toBeGreaterThanOrEqual(4);

  await page.getByLabel(/start time/i).fill("0.2");
  await page.getByLabel(/end time/i).fill("1.6");

  await page.getByRole("tab", { name: /speed/i }).click();
  await page.getByLabel(/playback speed/i).selectOption("1.5");

  await page.getByRole("tab", { name: /subtitles/i }).click();
  await page.getByRole("button", { name: /add subtitle/i }).click();
  await page.getByLabel(/subtitle text/i).fill("Local caption");

  const subtitleCue = page.locator('[data-testid="subtitle-cue-block"]').first();
  await expect(subtitleCue).toBeVisible();
  const beforeDragStart = await page.getByLabel(/subtitle start/i).inputValue();
  const cueBox = await subtitleCue.boundingBox();
  expect(cueBox).not.toBeNull();
  if (cueBox) {
    await page.mouse.move(cueBox.x + cueBox.width / 2, cueBox.y + cueBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(cueBox.x + cueBox.width / 2 + 40, cueBox.y + cueBox.height / 2);
    await page.mouse.up();
  }
  await expect(page.getByLabel(/subtitle start/i)).not.toHaveValue(beforeDragStart);

  await page.getByRole("tab", { name: /^format$/i }).click();
  await page.getByLabel(/video format/i).selectOption("mp4");
  await page
    .getByRole("button", { name: /generate preview/i })
    .last()
    .click();

  await expect(page.getByText(/preview ready/i)).toBeVisible({ timeout: 60_000 });
  await expect(page.locator(".video-workbench-badges")).toContainText("WEBM");
  await expect(page.getByText(/source preview/i)).toHaveCount(0);
  await expect(page.getByText(/derived preview/i)).toHaveCount(0);
  await expect(page.getByText(/generated/i)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export asset/i }).click();
  const download = await downloadPromise;

  await expect(page.getByText(/export saved/i)).toBeVisible({ timeout: 60_000 });
  expect(download.suggestedFilename()).toBe("local-video-edited.mp4");
  expect(externalRequests).toEqual([]);
});
