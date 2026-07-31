import assert from "node:assert/strict";
import test from "node:test";

import { formatChannelRole } from "./profileMemberContext.ts";

test("formats channel roles for display", () => {
  assert.equal(formatChannelRole("owner"), "Owner");
  assert.equal(formatChannelRole("admin"), "Admin");
  assert.equal(formatChannelRole("member"), "Member");
  assert.equal(formatChannelRole("guest"), "Guest");
});
