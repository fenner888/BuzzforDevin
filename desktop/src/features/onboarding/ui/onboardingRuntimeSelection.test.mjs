import assert from "node:assert/strict";
import test from "node:test";

import {
  getDefaultConfigOnboardingRuntimes,
  getReadyOnboardingRuntimes,
  getVisibleOnboardingRuntimes,
  runtimeIsReadyForOnboarding,
  runtimeIsVisibleInOnboarding,
} from "./onboardingRuntimeSelection.ts";

function runtime(
  id,
  availability,
  status,
  {
    onboardingVisible = true,
    requiresExternalCli = true,
    sortPriority = 100,
  } = {},
) {
  return {
    id,
    availability,
    authStatus: { status },
    onboardingVisible,
    requiresExternalCli,
    sortPriority,
  };
}

test("onboarding visibility comes from catalog metadata", () => {
  assert.equal(
    runtimeIsVisibleInOnboarding(runtime("devin", "available", "logged_in")),
    true,
  );
  assert.equal(
    runtimeIsVisibleInOnboarding(
      runtime("future-runtime", "available", "logged_in", {
        onboardingVisible: false,
      }),
    ),
    false,
  );
});

test("visible onboarding runtimes use catalog ordering", () => {
  const runtimes = [
    runtime("buzz-agent", "available", "not_applicable", {
      onboardingVisible: false,
      sortPriority: 0,
    }),
    runtime("codex", "available", "logged_in", { sortPriority: 40 }),
    runtime("goose", "available", "not_applicable", {
      onboardingVisible: false,
      sortPriority: 10,
    }),
    runtime("devin", "available", "logged_in", { sortPriority: 20 }),
    runtime("claude", "available", "logged_in", { sortPriority: 30 }),
  ];

  assert.deepEqual(
    getVisibleOnboardingRuntimes(runtimes).map(({ id }) => id),
    ["devin", "claude", "codex"],
  );
});

test("catalog ordering falls back to labels for rolling-upgrade payloads", () => {
  const alpha = runtime("alpha", "available", "logged_in");
  alpha.label = "Alpha";
  const beta = runtime("beta", "available", "logged_in");
  beta.label = "Beta";

  assert.deepEqual(
    getVisibleOnboardingRuntimes([beta, alpha]).map(({ id }) => id),
    ["alpha", "beta"],
  );
});

test("readiness requires an available and authenticated runtime", () => {
  assert.equal(
    runtimeIsReadyForOnboarding(runtime("claude", "available", "logged_in")),
    true,
  );
  assert.equal(
    runtimeIsReadyForOnboarding(runtime("devin", "available", "logged_in")),
    true,
  );
  assert.equal(
    runtimeIsReadyForOnboarding(
      runtime("codex", "available", "not_applicable"),
    ),
    true,
  );
  assert.equal(
    runtimeIsReadyForOnboarding(runtime("claude", "available", "logged_out")),
    false,
  );
  assert.equal(
    runtimeIsReadyForOnboarding(runtime("codex", "not_installed", "logged_in")),
    false,
  );
});

test("ready onboarding runtimes exclude hidden ready harnesses", () => {
  const runtimes = [
    runtime("goose", "available", "not_applicable", {
      onboardingVisible: false,
    }),
    runtime("codex", "available", "logged_out"),
    runtime("buzz-agent", "available", "not_applicable", {
      onboardingVisible: false,
    }),
    runtime("devin", "available", "logged_out"),
    runtime("claude", "available", "logged_in"),
  ];

  assert.deepEqual(
    getReadyOnboardingRuntimes(runtimes).map(({ id }) => id),
    ["claude"],
  );
});

test("default config offers a ready bundled harness alongside ready external CLIs", () => {
  const runtimes = [
    runtime("buzz-agent", "available", "not_applicable", {
      onboardingVisible: false,
      requiresExternalCli: false,
      sortPriority: 0,
    }),
    runtime("goose", "available", "not_applicable", {
      onboardingVisible: false,
      sortPriority: 10,
    }),
    runtime("devin", "available", "logged_in", { sortPriority: 20 }),
    runtime("claude", "available", "logged_in", { sortPriority: 30 }),
  ];

  assert.deepEqual(
    getDefaultConfigOnboardingRuntimes(runtimes, ["devin"]).map(({ id }) => id),
    ["buzz-agent", "devin"],
  );
});

test("default config excludes unavailable bundled and unconfirmed external harnesses", () => {
  const runtimes = [
    runtime("bundled-offline", "not_installed", "not_applicable", {
      onboardingVisible: false,
      requiresExternalCli: false,
    }),
    runtime("claude", "available", "logged_in"),
    runtime("codex", "available", "logged_in"),
  ];

  assert.deepEqual(
    getDefaultConfigOnboardingRuntimes(runtimes, ["claude"]).map(
      ({ id }) => id,
    ),
    ["claude"],
  );
});
