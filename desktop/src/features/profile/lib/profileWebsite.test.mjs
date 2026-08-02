import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeProfileWebsite,
  profileWebsiteDisplayValue,
} from "./profileWebsite.ts";

test("profile website adds HTTPS when the scheme is omitted", () => {
  assert.equal(
    normalizeProfileWebsite("example.com/builds"),
    "https://example.com/builds",
  );
});

test("profile website accepts explicit HTTP and HTTPS links", () => {
  assert.equal(
    normalizeProfileWebsite("https://example.com"),
    "https://example.com/",
  );
  assert.equal(
    normalizeProfileWebsite("http://localhost:3000/about"),
    "http://localhost:3000/about",
  );
});

test("profile website rejects non-web schemes and invalid URLs", () => {
  assert.equal(normalizeProfileWebsite("javascript:alert(1)"), null);
  assert.equal(normalizeProfileWebsite("mailto:person@example.com"), null);
  assert.equal(normalizeProfileWebsite("https://user:pass@example.com"), null);
  assert.equal(normalizeProfileWebsite("https://"), null);
});

test("profile website display removes only cosmetic scheme and root slash", () => {
  assert.equal(
    profileWebsiteDisplayValue("https://example.com/"),
    "example.com",
  );
  assert.equal(
    profileWebsiteDisplayValue("https://example.com/work?q=1"),
    "example.com/work?q=1",
  );
});
