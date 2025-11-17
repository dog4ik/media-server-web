import { Show, Suspense } from "solid-js";
import tracing from "./tracing";

type Props = {
  text?: string;
};

export default function Title(props: Props) {
  let title = () => `${props.text ? props.text + " | " : ""}Media server`;
  tracing.debug({ title: title() }, "Updated page title");
  return <></>;
}
