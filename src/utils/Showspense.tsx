import { Accessor, JSX, Show, Suspense } from "solid-js";

type Props<T> = {
  when: T | undefined | null | false;
  fallback?: JSX.Element;
  children: JSX.Element | ((item: Accessor<NonNullable<T>>) => JSX.Element);
};

export default function Showspense<T>(props: Props<T>) {
  return (
    <Suspense fallback={props.fallback}>
      <Show when={props.when}>{props.children}</Show>
    </Suspense>
  );
}
