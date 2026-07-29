import type { AcpRuntimeCatalogEntry } from "@/shared/api/types";

function compareOnboardingRuntimes(
  left: AcpRuntimeCatalogEntry,
  right: AcpRuntimeCatalogEntry,
) {
  return (
    left.sortPriority - right.sortPriority ||
    (left.displayLabel || left.label || left.id).localeCompare(
      right.displayLabel || right.label || right.id,
    )
  );
}

export function runtimeIsVisibleInOnboarding(runtime: AcpRuntimeCatalogEntry) {
  return runtime.onboardingVisible;
}

export function runtimeIsReadyForOnboarding(runtime: AcpRuntimeCatalogEntry) {
  return (
    runtime.availability === "available" &&
    (runtime.authStatus.status === "logged_in" ||
      runtime.authStatus.status === "not_applicable")
  );
}

export function getVisibleOnboardingRuntimes(
  runtimes: readonly AcpRuntimeCatalogEntry[],
) {
  return runtimes
    .filter(runtimeIsVisibleInOnboarding)
    .sort(compareOnboardingRuntimes);
}

export function getReadyOnboardingRuntimes(
  runtimes: readonly AcpRuntimeCatalogEntry[],
) {
  return getVisibleOnboardingRuntimes(runtimes).filter(
    runtimeIsReadyForOnboarding,
  );
}

/**
 * Runtime choices for the first-run default-harness step.
 *
 * The setup step intentionally shows only catalog entries marked for first-run
 * discovery. The defaults step has a different job: it must also offer a
 * bundled, ready harness so installing an external CLI does not silently make
 * that CLI the default for Fizz, Honey, Bumble, and every other unpinned
 * persona.
 *
 * Capability facts still come from the runtime catalog. A hidden entry is
 * eligible here only when it is available, authenticated (when applicable),
 * and does not require a separately installed CLI.
 */
export function getDefaultConfigOnboardingRuntimes(
  runtimes: readonly AcpRuntimeCatalogEntry[],
  readyRuntimeIds: readonly string[],
) {
  const readyRuntimeIdSet = new Set(readyRuntimeIds);
  return runtimes
    .filter(
      (runtime) =>
        (runtime.onboardingVisible && readyRuntimeIdSet.has(runtime.id)) ||
        (!runtime.requiresExternalCli && runtimeIsReadyForOnboarding(runtime)),
    )
    .sort(compareOnboardingRuntimes);
}
