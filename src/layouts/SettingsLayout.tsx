import { ParentProps } from "solid-js";
import Title from "../utils/Title";

export default function SettingsLayout(props: ParentProps) {
  return (
    <>
      <Title text="Settings" />
      {props.children}
    </>
  );
}
