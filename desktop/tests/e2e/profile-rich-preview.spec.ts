import { expect, test, type Page } from "@playwright/test";

import { waitForAnimations } from "../helpers/animations";
import { installMockBridge, TEST_IDENTITIES } from "../helpers/bridge";
import { openSettings } from "../helpers/settings";

const SHOTS = "test-results/profile-rich-preview";
const MOCK_BANNER_URL = "https://images.example/banner.png";
const UPLOADED_BANNER_URL = "https://images.example/uploaded-banner.png";
const BANNER_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#182449"/>
        <stop offset="0.52" stop-color="#4361ee"/>
        <stop offset="1" stop-color="#13b8a6"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="360" rx="32" fill="url(#background)"/>
    <circle cx="190" cy="90" r="150" fill="#ffffff" opacity="0.12"/>
    <circle cx="1040" cy="320" r="250" fill="#ffffff" opacity="0.08"/>
    <path d="M0 300 C240 190 400 390 650 260 S980 180 1200 250 V360 H0Z" fill="#ffffff" opacity="0.12"/>
  </svg>`;

async function serveMockBanners(page: Page) {
  await page.route("https://images.example/*.png", async (route) => {
    await route.fulfill({ body: BANNER_SVG, contentType: "image/svg+xml" });
  });
}

async function waitForMockLiveSubscription(page: Page, channelName: string) {
  await expect
    .poll(() =>
      page.evaluate(
        (name) =>
          (
            window as Window & {
              __BUZZ_E2E_HAS_MOCK_LIVE_SUBSCRIPTION__?: (input: {
                channelName: string;
              }) => boolean;
            }
          ).__BUZZ_E2E_HAS_MOCK_LIVE_SUBSCRIPTION__?.({
            channelName: name,
          }) ?? false,
        channelName,
      ),
    )
    .toBe(true);
}

test.use({ viewport: { width: 1280, height: 900 } });

test("shows a richer human profile with verified channel context", async ({
  page,
}) => {
  await serveMockBanners(page);
  await installMockBridge(page, {
    searchProfiles: [
      {
        about:
          "Building practical AI workflows and sharing what works with the community.",
        displayName: "Mark Fenner",
        nip05Handle: "mark@devin-builders.example",
        pubkey: TEST_IDENTITIES.bob.pubkey,
        website: "https://markfenner.dev/builds",
        bannerUrl: MOCK_BANNER_URL,
        bannerPosition: { x: 18, y: 82 },
        socialLinks: [
          {
            kind: "github",
            label: "GitHub",
            url: "https://github.com/fenner888",
          },
          {
            kind: "linkedin",
            label: "LinkedIn",
            url: "https://linkedin.com/in/mark-fenner",
          },
          {
            kind: "x",
            label: "X",
            url: "https://x.com/hybrid",
          },
        ],
      },
    ],
  });
  await page.goto("/");
  await page.getByTestId("channel-general").click();
  await expect(page.getByTestId("chat-title")).toHaveText("general");
  await waitForMockLiveSubscription(page, "general");

  await page.evaluate(
    ({ pubkey }) => {
      const emit = (
        window as Window & {
          __BUZZ_E2E_EMIT_MOCK_MESSAGE__?: (input: {
            channelName: string;
            content: string;
            pubkey: string;
          }) => void;
        }
      ).__BUZZ_E2E_EMIT_MOCK_MESSAGE__;
      if (!emit) throw new Error("Mock message emitter is unavailable.");
      emit({
        channelName: "general",
        content: "Here is the profile preview.",
        pubkey,
      });
    },
    { pubkey: TEST_IDENTITIES.bob.pubkey },
  );

  const message = page
    .getByTestId("message-row")
    .filter({ hasText: "Here is the profile preview." });
  await expect(message).toBeVisible();
  await message.locator("button").first().click();

  const panel = page.getByTestId("user-profile-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Mark Fenner");
  await expect(panel).toContainText(
    "Building practical AI workflows and sharing what works with the community.",
  );
  await expect(panel.getByTestId("user-profile-website")).toContainText(
    "markfenner.dev/builds",
  );
  await expect(panel.getByTestId("user-profile-banner")).toBeVisible();
  await expect
    .poll(() =>
      panel
        .getByTestId("user-profile-banner")
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBeGreaterThanOrEqual(144);
  await expect
    .poll(() =>
      panel
        .getByTestId("user-profile-banner")
        .locator("img")
        .evaluate((image) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(
    panel.getByTestId("user-profile-banner").locator("img"),
  ).toHaveCSS("object-position", "18% 82%");
  await expect(panel.getByTestId("user-profile-social-github-0")).toContainText(
    "@fenner888",
  );
  await expect(panel.getByTestId("user-profile-social-x-2")).toContainText(
    "@hybrid",
  );
  await expect(panel.getByTestId("user-profile-channel-role")).toContainText(
    "Member in #general",
  );
  await expect(panel.getByTestId("user-profile-identity")).toBeVisible();
  await expect(panel.getByTestId("user-profile-copy-pubkey")).not.toBeVisible();

  await waitForAnimations(page);
  await panel.screenshot({ path: `${SHOTS}/human-profile.png` });

  await panel.getByTestId("user-profile-identity-toggle").click();
  await expect(panel.getByTestId("user-profile-copy-pubkey")).toBeVisible();
});

test("falls back to the avatar when a public profile banner cannot load", async ({
  page,
}) => {
  const brokenBannerUrl = "https://images.example/broken-banner.png";
  await page.route(brokenBannerUrl, (route) => route.abort());
  await installMockBridge(page, {
    searchProfiles: [
      {
        bannerUrl: brokenBannerUrl,
        displayName: "Broken Banner",
        pubkey: TEST_IDENTITIES.bob.pubkey,
      },
    ],
  });
  await page.goto("/");
  await page.getByTestId("channel-general").click();
  await waitForMockLiveSubscription(page, "general");
  await page.evaluate(
    ({ pubkey }) => {
      (
        window as Window & {
          __BUZZ_E2E_EMIT_MOCK_MESSAGE__: (input: {
            channelName: string;
            content: string;
            pubkey: string;
          }) => void;
        }
      ).__BUZZ_E2E_EMIT_MOCK_MESSAGE__({
        channelName: "general",
        content: "My banner is unavailable.",
        pubkey,
      });
    },
    { pubkey: TEST_IDENTITIES.bob.pubkey },
  );
  await page
    .getByTestId("message-row")
    .filter({ hasText: "My banner is unavailable." })
    .locator("button")
    .first()
    .click();

  const panel = page.getByTestId("user-profile-panel");
  await expect(panel.getByTestId("user-profile-avatar")).toBeVisible();
  await expect(panel.getByTestId("user-profile-banner")).toHaveCount(0);
});

test("uploads a banner and saves social links from profile settings", async ({
  page,
}) => {
  await serveMockBanners(page);
  await installMockBridge(page, {
    uploadDescriptors: [
      {
        sha256: "b".repeat(64),
        size: 512,
        type: "image/png",
        uploaded: 1_785_499_200,
        url: UPLOADED_BANNER_URL,
      },
    ],
  });
  await page.goto("/");
  await openSettings(page, "profile");

  await expect(page.getByTestId("profile-banner-upload")).toHaveText(
    "Add banner",
  );
  await page.getByTestId("profile-banner-file-input").setInputFiles({
    buffer: Buffer.from([137, 80, 78, 71]),
    mimeType: "image/png",
    name: "profile-banner.png",
  });
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: "Banner saved" }),
  ).toBeVisible();
  await expect(page.getByTestId("profile-banner-upload")).toHaveText(
    "Change banner",
  );
  await expect
    .poll(() =>
      page
        .getByTestId("profile-banner-editor")
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBeGreaterThanOrEqual(192);
  await expect
    .poll(async () => {
      const bannerBox = await page
        .getByTestId("profile-banner-editor")
        .boundingBox();
      const profileCardBox = await page
        .getByTestId("profile-metadata-card")
        .boundingBox();
      if (!bannerBox || !profileCardBox) return Number.POSITIVE_INFINITY;
      return Math.abs(bannerBox.width - profileCardBox.width);
    })
    .toBeLessThanOrEqual(1);
  await expect
    .poll(() =>
      page
        .getByTestId("profile-banner-editor")
        .locator("img")
        .evaluate((image) => image.naturalWidth),
    )
    .toBeGreaterThan(0);

  await page.getByTestId("profile-banner-adjust").click();
  await expect(
    page.getByTestId("profile-banner-position-controls"),
  ).toBeVisible();
  await page.getByTestId("profile-banner-position-x").fill("28");
  await page.getByTestId("profile-banner-position-y").fill("76");
  await expect(
    page.getByTestId("profile-banner-editor").locator("img"),
  ).toHaveCSS("object-position", "28% 76%");
  await page.getByTestId("profile-banner-position-save").click();
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Banner position saved" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("profile-banner-position-controls"),
  ).toHaveCount(0);

  await page.getByTestId("profile-metadata-edit").click();
  await page.getByTestId("profile-social-github").fill("github.com/fenner888");
  await page
    .getByTestId("profile-social-linkedin")
    .fill("linkedin.com/in/mark-fenner");
  await page.getByText("Add custom link", { exact: true }).click();
  await page.getByLabel("Custom link 1 label").fill("Portfolio");
  await page
    .getByLabel("Custom link 1 URL")
    .fill("https://markfenner.dev/work");
  await page.getByTestId("profile-metadata-edit").click();

  await expect(page.getByTestId("profile-social-github-value")).toContainText(
    "@fenner888",
  );
  await expect(page.getByTestId("profile-social-linkedin-value")).toContainText(
    "@mark-fenner",
  );
  await expect(page.getByTestId("profile-social-custom-value")).toContainText(
    "markfenner.dev",
  );

  await waitForAnimations(page);
  await page
    .getByTestId("settings-profile")
    .screenshot({ path: `${SHOTS}/profile-settings.png` });

  await page.getByTestId("profile-banner-remove").click();
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: "Banner removed" }),
  ).toBeVisible();
  await expect(
    page.getByTestId("profile-banner-editor").locator("img"),
  ).toHaveCount(0);
});

test("rejects mismatched social domains and caps custom profile links", async ({
  page,
}) => {
  await installMockBridge(page);
  await page.goto("/");
  await openSettings(page, "profile");
  await page.getByTestId("profile-metadata-edit").click();

  await page
    .getByTestId("profile-social-github")
    .fill("https://example.com/not-github");
  await expect(page.getByTestId("profile-social-error")).toContainText(
    "matching service",
  );
  await page.getByTestId("profile-metadata-edit").click();
  await expect(page.getByTestId("profile-social-github")).toBeVisible();

  await page
    .getByTestId("profile-social-github")
    .fill("https://github.com/fenner888");
  for (let index = 0; index < 5; index += 1) {
    await page.getByText("Add custom link", { exact: true }).click();
  }
  await expect(page.getByText("Add custom link", { exact: true })).toHaveCount(
    0,
  );

  const profileInputs = page
    .getByTestId("profile-metadata-card")
    .locator("input, textarea");
  await expect
    .poll(async () => {
      const inputs = await profileInputs.evaluateAll((elements) =>
        elements.map((element) => {
          const input = element as HTMLInputElement;
          const label = input.labels?.[0]?.textContent?.trim();
          return Boolean(label || input.getAttribute("aria-label"));
        }),
      );
      return inputs.every(Boolean);
    })
    .toBe(true);
});

test("shows a recoverable fallback when a banner preview cannot load", async ({
  page,
}) => {
  const brokenBannerUrl = "https://images.example/broken-upload.png";
  await page.route(brokenBannerUrl, (route) => route.abort());
  await installMockBridge(page, {
    uploadDescriptors: [
      {
        sha256: "c".repeat(64),
        size: 512,
        type: "image/png",
        uploaded: 1_785_499_200,
        url: brokenBannerUrl,
      },
    ],
  });
  await page.goto("/");
  await openSettings(page, "profile");
  await page.getByTestId("profile-banner-file-input").setInputFiles({
    buffer: Buffer.from([137, 80, 78, 71]),
    mimeType: "image/png",
    name: "broken-profile-banner.png",
  });

  await expect(page.getByTestId("profile-banner-fallback")).toBeVisible();
  await expect(page.getByTestId("profile-banner-upload")).toHaveText(
    "Change banner",
  );
  await expect(page.getByTestId("profile-banner-remove")).toBeVisible();
});

test("keeps the rich profile inside a narrow desktop viewport", async ({
  page,
}) => {
  await serveMockBanners(page);
  await installMockBridge(page, {
    searchProfiles: [
      {
        about: "Building practical AI workflows for the community.",
        bannerUrl: MOCK_BANNER_URL,
        displayName: "Mark Fenner",
        pubkey: TEST_IDENTITIES.bob.pubkey,
        socialLinks: [
          {
            kind: "github",
            label: "GitHub",
            url: "https://github.com/fenner888",
          },
        ],
      },
    ],
  });
  await page.goto("/");
  await page.getByTestId("channel-general").click();
  await waitForMockLiveSubscription(page, "general");
  await page.setViewportSize({ width: 720, height: 800 });
  await page.evaluate(
    ({ pubkey }) => {
      (
        window as Window & {
          __BUZZ_E2E_EMIT_MOCK_MESSAGE__: (input: {
            channelName: string;
            content: string;
            pubkey: string;
          }) => void;
        }
      ).__BUZZ_E2E_EMIT_MOCK_MESSAGE__({
        channelName: "general",
        content: "Open my narrow profile.",
        pubkey,
      });
    },
    { pubkey: TEST_IDENTITIES.bob.pubkey },
  );
  await page
    .getByTestId("message-row")
    .filter({ hasText: "Open my narrow profile." })
    .locator("button")
    .first()
    .click();

  const panel = page.getByTestId("user-profile-panel");
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(720);
  await expect
    .poll(() =>
      panel.evaluate((element) => element.scrollWidth <= element.clientWidth),
    )
    .toBe(true);
});
