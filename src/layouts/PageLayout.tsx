import { ParentProps } from "solid-js";
import { useBackdropContext } from "../context/BackdropContext";
export default function PageLayout(props: ParentProps) {
  let [{ backdrop }] = useBackdropContext();
  return (
    <>
      <div class="fixed blur-sm brightness-50 inset-0">
        <div class="absolute w-full h-full">
          <div
            class="h-full w-full"
            style={{
              "background-image": `url(${backdrop()})`,
              "background-size": "cover",
            }}
          ></div>
        </div>
      </div>
      <main class="w-full relative overflow-y-scroll min-h-screen p-4 text-white flex flex-col rounded-md">
        {props.children}
      </main>
    </>
  );
}
