import { type Context, useContext } from "solid-js";

/**
 * Reads a context that is always expected to have a provider above it.
 */
export function useRequiredContext<T>(
  context: Context<T | undefined>,
  name: string,
): T {
  const value = useContext(context);
  if (value === undefined) {
    throw new Error(`${name} is used outside of its provider`);
  }
  return value;
}
