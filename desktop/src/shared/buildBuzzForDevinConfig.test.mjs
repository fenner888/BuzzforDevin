import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const generatorPath = fileURLToPath(
  new URL("../../scripts/build-buzz-for-devin-config.mjs", import.meta.url),
);

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "buzz-for-devin-config-"));
  mkdirSync(join(root, "src-tauri"));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  return root;
}

function runGenerator(root, overrides = {}) {
  const env = { ...process.env, ...overrides };
  delete env.BUZZ_UPDATER_PUBLIC_KEY;
  delete env.BUZZ_UPDATER_ENDPOINT;
  Object.assign(env, overrides);
  return spawnSync(process.execPath, [generatorPath], {
    cwd: root,
    encoding: "utf8",
    env,
  });
}

function readGeneratedConfig(root) {
  return JSON.parse(
    readFileSync(
      join(root, "src-tauri", "tauri.buzz-for-devin.conf.json"),
      "utf8",
    ),
  );
}

test("Buzz for Devin config is isolated and non-updating by default", (t) => {
  const root = fixture(t);
  const result = runGenerator(root);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readGeneratedConfig(root), {
    productName: "Buzz for Devin",
    identifier: "community.buzzfordevin.desktop",
    bundle: {
      createUpdaterArtifacts: false,
      macOS: {
        infoPlist: "Info.buzz-for-devin.plist",
        minimumSystemVersion: "11.0",
      },
    },
    plugins: {
      "deep-link": {
        desktop: {
          schemes: ["buzz-for-devin"],
        },
      },
      updater: {
        endpoints: [],
      },
    },
  });
});

test("Buzz for Devin updater configuration fails closed when incomplete", (t) => {
  const root = fixture(t);
  const publicKeyOnly = runGenerator(root, {
    BUZZ_UPDATER_PUBLIC_KEY: "test-public-key",
  });
  const endpointOnly = runGenerator(root, {
    BUZZ_UPDATER_ENDPOINT: "https://updates.example.invalid/latest.json",
  });

  assert.equal(publicKeyOnly.status, 1);
  assert.match(publicKeyOnly.stderr, /must be supplied together/);
  assert.equal(endpointOnly.status, 1);
  assert.match(endpointOnly.stderr, /must be supplied together/);
});

test("Buzz for Devin updater configuration enables only a paired endpoint and key", (t) => {
  const root = fixture(t);
  const result = runGenerator(root, {
    BUZZ_UPDATER_ENDPOINT: "https://updates.example.invalid/latest.json",
    BUZZ_UPDATER_PUBLIC_KEY: "test-public-key",
  });

  assert.equal(result.status, 0, result.stderr);
  const config = readGeneratedConfig(root);
  assert.equal(config.bundle.createUpdaterArtifacts, true);
  assert.deepEqual(config.plugins.updater, {
    endpoints: ["https://updates.example.invalid/latest.json"],
    pubkey: "test-public-key",
  });
});
