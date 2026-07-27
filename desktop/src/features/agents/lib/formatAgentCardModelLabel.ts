import { formatAgentModelLabel } from "./formatAgentModelLabel.ts";

/**
 * Describe only model configuration that Buzz can actually apply.
 *
 * Unknown/custom runtimes preserve the historic card label. Known runtimes
 * without a model-selection path use their own runtime default.
 */
export function formatAgentCardModelLabel(
  explicitModel: string | null | undefined,
  defaultModel: string,
  supportsBuzzModelConfig: boolean | null,
) {
  if (supportsBuzzModelConfig === false) return "Runtime default";
  const explicit = explicitModel?.trim();
  if (explicit) return formatAgentModelLabel(explicit);
  const inherited = defaultModel.trim();
  return inherited ? `Default model (${inherited})` : "Default model";
}
