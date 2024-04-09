import { ParentProps } from "solid-js";
import Table from "../components/ContentTable";

export default function SettingsLayout(props: ParentProps) {
  return (
    <>
      <div id="settings" class="flex h-full justify-between">
        {props.children}
        <Table />
      </div>
    </>
  );
}
