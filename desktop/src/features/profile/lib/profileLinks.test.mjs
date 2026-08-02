import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeProfileLinks,
  normalizeProfileLinkUrl,
  profileLinkDisplayValue,
} from "./profileLinks.ts";

test("normalizes official social profile URLs", () => {
  assert.equal(
    normalizeProfileLinkUrl("github.com/alice", "github"),
    "https://github.com/alice",
  );
  assert.equal(
    normalizeProfileLinkUrl("https://example.com/alice", "github"),
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
    profileLinkDisplayValue("https://github.com/alice", "github"),
    "@alice",
  );
  assert.equal(
    profileLinkDisplayValue(
      "https://www.linkedin.com/in/alice-example?tracking=ignored",
      "linkedin",
    ),
    "@alice-example",
  );
  assert.equal(
    profileLinkDisplayValue("https://x.com/alice_example/status/123", "x"),
    "@alice_example",
  );
  assert.equal(
    profileLinkDisplayValue(
      "https://portfolio.example/private/path?token=nope",
    ),
    "portfolio.example",
  );
});
