import assert from "node:assert/strict";
import test from "node:test";

import { formatAgentCardModelLabel } from "./formatAgentCardModelLabel.ts";

test("runtime-owned models do not claim the Buzz global default", () => {
  assert.equal(
    formatAgentCardModelLabel(null, "swe-1-7-lightning", false),
    "Runtime default",
  );
  assert.equal(
    formatAgentCardModelLabel("stored-but-not-applicable", "global", false),
    "Runtime default",
  );
});

test("supported and unknown runtimes preserve configured model labels", () => {
  assert.equal(
    formatAgentCardModelLabel(null, "swe-1-7-lightning", true),
    "Default model (swe-1-7-lightning)",
  );
  assert.equal(
    formatAgentCardModelLabel("explicit-model", "global", null),
    "explicit-model",
  );
});
