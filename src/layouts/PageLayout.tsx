import { ParentProps, Show, createEffect, createSignal } from "solid-js";
import { useBackdropContext } from "../context/BackdropContext";
import SideBar from "../components/SideBar";
import NavBar from "../components/NavBar";
import GlobalErrorBoundary from "@/pages/GlobalErrorBoundary";

function createHexPair() {
  let randomNumber = () => Math.floor(Math.random() * 256);
  let firstNumbers = [randomNumber(), randomNumber(), randomNumber()];
  let secondNumbers = [randomNumber(), randomNumber(), randomNumber()];
  let satisfiesRange = firstNumbers.every(
    (_, idx) => Math.abs(firstNumbers[idx] - secondNumbers[idx]) > 70,
  );

  let intoHex = (nums: number[]) =>
    nums.map((n) => n.toString(16).padStart(2, "0")).join("");

  if (!satisfiesRange) {
    return createHexPair();
  }
  return [intoHex(firstNumbers), intoHex(secondNumbers)] as const;
}

function generate() {
  let deg = Math.floor(Math.random() * 360);
  let [from, to] = createHexPair();
  let gradient = `linear-gradient(${deg}deg, #${from}, #${to})`;

  return gradient;
}

export default function PageLayout(props: ParentProps) {
  let [{ currentBackdrop }] = useBackdropContext();
  let backdropElement: HTMLImageElement;
  let gradientElement: HTMLDivElement;
  let [isLoaded, setIsLoaded] = createSignal(false);

  let animation = {
    opacity: [0, 1],
  };
  let options = {
    duration: 200,
    easing: "ease-in-out",
  };

  createEffect(() => {
    setIsLoaded(false);
    if (currentBackdrop()) {
      backdropElement.animate(animation, options);
    } else {
      gradientElement.animate(animation, options);
    }
  });

  return (
    <>
      <SideBar />
      <NavBar />
      <div ref={backdropElement!} class="absolute inset-0">
        <div class="relative h-full w-full">
          <Show when={!currentBackdrop()}>
            <div
              ref={gradientElement!}
              style={`background: ${generate()};`}
              class="h-full w-full object-cover transition-opacity"
            ></div>
          </Show>
          <Show when={currentBackdrop() || isLoaded()}>
            <img
              ref={backdropElement!}
              onLoad={() => setIsLoaded(true)}
              src={currentBackdrop()}
              class={`h-full w-full object-cover ${
                isLoaded() ? "block" : "hidden"
              }`}
            />
          </Show>
          <div class="absolute inset-0 bg-black/80" />
        </div>
      </div>
      <main class="relative flex min-h-screen w-full flex-col overflow-y-scroll rounded-md pt-16 text-white">
        <GlobalErrorBoundary>{props.children}</GlobalErrorBoundary>
      </main>
    </>
  );
}
