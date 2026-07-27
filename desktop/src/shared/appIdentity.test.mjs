import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_DEEP_LINK_SCHEME,
  APP_RELEASES_URL,
  isSupportedAppDeepLinkProtocol,
  normalizeDeepLinkScheme,
  normalizeReleasesUrl,
} from "./appIdentity.ts";

test("deep-link scheme defaults to upstream Buzz for ordinary builds", () => {
  assert.equal(APP_DEEP_LINK_SCHEME, "buzz");
  assert.equal(normalizeDeepLinkScheme(undefined), "buzz");
});

test("deep-link scheme accepts a valid fork release override", () => {
  assert.equal(normalizeDeepLinkScheme("buzz-for-devin"), "buzz-for-devin");
});

test("deep-link scheme rejects malformed build input", () => {
  assert.equal(normalizeDeepLinkScheme("HTTPS://evil"), "buzz");
  assert.equal(normalizeDeepLinkScheme("1buzz"), "buzz");
  assert.equal(normalizeDeepLinkScheme("buzz for devin"), "buzz");
});

test("configured and legacy Buzz protocols remain parse-compatible", () => {
  assert.equal(isSupportedAppDeepLinkProtocol("buzz:"), true);
  assert.equal(isSupportedAppDeepLinkProtocol("https:"), false);
});

test("release URL defaults to upstream Buzz for ordinary builds", () => {
  assert.equal(
    APP_RELEASES_URL,
    "https://github.com/block/buzz/releases/latest",
  );
  assert.equal(
    normalizeReleasesUrl(undefined),
    "https://github.com/block/buzz/releases/latest",
  );
});

test("release URL accepts only an HTTPS fork override", () => {
  assert.equal(
    normalizeReleasesUrl("https://github.com/fenner888/BuzzforDevin/releases"),
    "https://github.com/fenner888/BuzzforDevin/releases",
  );
  assert.equal(
    normalizeReleasesUrl("http://downloads.example.test/release"),
    "https://github.com/block/buzz/releases/latest",
  );
  assert.equal(
    normalizeReleasesUrl("not a URL"),
    "https://github.com/block/buzz/releases/latest",
  );
});
