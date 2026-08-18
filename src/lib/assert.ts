export function assertNever(value: never): never {
  throw Error(`unhandled variant: ${value}`);
}
