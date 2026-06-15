import SearchBar from "../SearchBar";
import { AppBreadcrumbs } from "../Breadcrumbs";
import ScanButton from "./ScanButton";

// Background opacity at the top of the page and once fully scrolled.
const MIN_BG_OPACITY = 0.3;
const MAX_BG_OPACITY = 0.95;

export default function NavBar(props: { scrollProgress?: number }) {
  let bgOpacity = () =>
    MIN_BG_OPACITY + (props.scrollProgress ?? 0) * (MAX_BG_OPACITY - MIN_BG_OPACITY);
  return (
    <header
      class="hover-hide h-navbar flex w-full items-center px-4 py-8 text-white"
      style={{ "background-color": `rgb(0 0 0 / ${bgOpacity()})` }}
    >
      <nav class="flex flex-1 items-center justify-between gap-3 text-sm font-semibold">
        <div class="flex flex-1 items-center">
          <AppBreadcrumbs />
        </div>
        <div class="flex flex-1 justify-center">
          <SearchBar />
        </div>
        <div class="flex-1 flex justify-end">
          <ScanButton />
        </div>
      </nav>
    </header>
  );
}
