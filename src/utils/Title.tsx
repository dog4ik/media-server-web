import { Title as MetaTitle } from "@solidjs/meta";
import { Show, Suspense } from "solid-js";
import tracing from "./tracing";

type Props = {
  text?: string;
};

function LoadingFallback() {
  return <MetaTitle>Loading... | Media server</MetaTitle>;
}

export default function Title(props: Props) {
  let title = () => `${props.text ? props.text + " | " : ""}Media server`;
  tracing.debug({ title: title() }, "Updated page title");
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Show when={props.text !== undefined} fallback={<LoadingFallback />}>
        <MetaTitle>{title()}</MetaTitle>
      </Show>
    </Suspense>
  );
}
