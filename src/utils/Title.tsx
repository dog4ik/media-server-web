import { Title as MetaTitle } from "@solidjs/meta";
import { Show, Suspense } from "solid-js";

type Props = {
  text?: string;
};

function LoadingFallback() {
  return <MetaTitle>Loading... | Media server</MetaTitle>;
}

export default function Title(props: Props) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Show when={props.text !== undefined} fallback={<LoadingFallback />}>
        <MetaTitle>{`${props.text ? props.text + " | " : ""}Media server`}</MetaTitle>
      </Show>
    </Suspense>
  );
}
