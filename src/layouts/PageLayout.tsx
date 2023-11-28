import { ParentProps } from "solid-js";
export default function PageLayout(props: ParentProps) {
  return (
    <main class="w-full overflow-y-auto min-h-screen bg-neutral-800 text-white flex flex-col rounded-md">
      {props.children}
    </main>
  );
}
