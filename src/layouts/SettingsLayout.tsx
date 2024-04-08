import { ParentProps } from "solid-js";
import Table from "../components/ContentTable";

export default function SettingsLayout(props: ParentProps) {
  let container: HTMLDivElement;
  return (
    <>
      <div ref={container!} id="settings" class="flex h-full justify-between">
        {props.children}
        <Table scrollContainerRef={container!} />
      </div>
    </>
  );
}
