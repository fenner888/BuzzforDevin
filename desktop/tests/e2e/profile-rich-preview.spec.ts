import { expect, test, type Page } from "@playwright/test";

import { waitForAnimations } from "../helpers/animations";
import { installMockBridge, TEST_IDENTITIES } from "../helpers/bridge";

const SHOTS = "test-results/profile-rich-preview";

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
  await installMockBridge(page, {
    searchProfiles: [
      {
        about:
          "Building practical AI workflows and sharing what works with the community.",
        displayName: "Mark Fenner",
        nip05Handle: "mark@devin-builders.example",
        pubkey: TEST_IDENTITIES.bob.pubkey,
        website: "https://markfenner.dev/builds",
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
  await expect(panel.getByTestId("user-profile-channel-role")).toContainText(
    "Member in #general",
  );
  await expect(panel.getByTestId("user-profile-copy-pubkey")).toBeVisible();

  await waitForAnimations(page);
  await panel.screenshot({ path: `${SHOTS}/human-profile.png` });
});
