import {
  ParentProps,
  Show,
  createEffect,
  createSignal,
  onMount,
} from "solid-js";
import { useBackdropContext } from "../context/BackdropContext";
function createHex() {
  let hexCode = "";
  let hexValues = "0123456789abcdef";

  for (var i = 0; i < 6; i++) {
    hexCode += hexValues.charAt(Math.floor(Math.random() * hexValues.length));
  }
  return hexCode;
}

function generate() {
  let deg = Math.floor(Math.random() * 360);

  let gradient =
    "linear-gradient(" +
    deg +
    "deg, " +
    "#" +
    createHex() +
    ", " +
    "#" +
    createHex() +
    ")";

  return gradient;
}
export default function PageLayout(props: ParentProps) {
  let [{ backdrop }] = useBackdropContext();
  let backdropElement: HTMLImageElement;
  let gradientElement: HTMLDivElement;
  let [isLoaded, setIsLoaded] = createSignal(false);
  onMount(() => {
    setIsLoaded(backdropElement.complete);
  });

  let animation = {
    opacity: [0, 1],
  };
  let options = {
    duration: 200,
    easing: "ease-in-out",
  };

  createEffect(() => {
    if (backdrop()) {
      backdropElement.animate(animation, options);
    } else {
      gradientElement.animate(animation, options);
    }
  });

  return (
    <>
      <div ref={backdropElement!} class="fixed blur-sm brightness-50 inset-0">
        <div class="absolute w-full h-full">
          <Show when={!backdrop() || !isLoaded()}>
            <div
              ref={gradientElement!}
              style={`background: ${generate()};`}
              class="h-full w-full object-cover"
            ></div>
          </Show>
          <Show when={backdrop()}>
            <img
              ref={backdropElement!}
              onLoad={() => setIsLoaded(true)}
              src={backdrop()}
              class={`h-full w-full object-cover ${
                isLoaded() ? "block" : "hidden"
              }`}
            />
          </Show>
        </div>
      </div>
      <main class="w-full relative overflow-y-scroll min-h-screen p-4 text-white flex flex-col rounded-md">
        {props.children}
      </main>
    </>
  );
}
