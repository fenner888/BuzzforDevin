import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PRODUCT_NAME = "Buzz for Devin";
const IDENTIFIER = "community.buzzfordevin.desktop";
const DEEP_LINK_SCHEME = "buzz-for-devin";
const outputConfigPath = resolve(
  process.cwd(),
  "src-tauri/tauri.buzz-for-devin.conf.json",
);

const updaterPublicKey = process.env.BUZZ_UPDATER_PUBLIC_KEY?.trim();
const updaterEndpoint = process.env.BUZZ_UPDATER_ENDPOINT?.trim();
if (Boolean(updaterPublicKey) !== Boolean(updaterEndpoint)) {
  console.error(
    "BUZZ_UPDATER_PUBLIC_KEY and BUZZ_UPDATER_ENDPOINT must be supplied together",
  );
  process.exit(1);
}

const releaseConfig = {
  productName: PRODUCT_NAME,
  identifier: IDENTIFIER,
  bundle: {
    createUpdaterArtifacts: Boolean(updaterPublicKey),
    macOS: {
      infoPlist: "Info.buzz-for-devin.plist",
      minimumSystemVersion: "11.0",
    },
  },
  plugins: {
    "deep-link": {
      desktop: {
        schemes: [DEEP_LINK_SCHEME],
      },
    },
    updater: updaterPublicKey
      ? {
          pubkey: updaterPublicKey,
          endpoints: [updaterEndpoint],
        }
      : {
          endpoints: [],
        },
  },
};

const formattedConfig = JSON.stringify(releaseConfig, null, 2).replace(
  /\[\n\s+"([^"\n]+)"\n\s+\]/g,
  '["$1"]',
);
writeFileSync(outputConfigPath, `${formattedConfig}\n`);
console.log(`Wrote isolated ${PRODUCT_NAME} config to ${outputConfigPath}`);
