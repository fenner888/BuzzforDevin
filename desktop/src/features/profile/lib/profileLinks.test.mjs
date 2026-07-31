import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeProfileLinks,
  normalizeProfileLinkUrl,
  profileLinkDisplayValue,
} from "./profileLinks.ts";

test("normalizes official social profile URLs", () => {
  assert.equal(
    normalizeProfileLinkUrl("github.com/fenner888", "github"),
    "https://github.com/fenner888",
  );
  assert.equal(
    normalizeProfileLinkUrl("https://example.com/fenner888", "github"),
    null,
  );
  assert.equal(normalizeProfileLinkUrl("http://x.com/hybrid", "x"), null);
});

test("validates custom labels and duplicate predefined links", () => {
  assert.equal(
    normalizeProfileLinks([
      { kind: "github", label: "GitHub", url: "github.com/a" },
      { kind: "github", label: "GitHub", url: "github.com/b" },
    ]),
    null,
  );
  assert.deepEqual(
    normalizeProfileLinks([
      { kind: "custom", label: " Portfolio ", url: "portfolio.example" },
    ]),
    [
      {
        kind: "custom",
        label: "Portfolio",
        url: "https://portfolio.example/",
      },
    ],
  );
});

test("formats profile link display values", () => {
  assert.equal(
    profileLinkDisplayValue("https://github.com/fenner888"),
    "github.com/fenner888",
  );
});
