import SearchBar from "../SearchBar";
import { AppBreadcrumbs } from "../Breadcrumbs";
import ScanButton from "./ScanButton";
import MobileNav from "./MobileNav";

// Background opacity at the top of the page and once fully scrolled.
const MIN_BG_OPACITY = 0.3;
const MAX_BG_OPACITY = 0.95;

export default function NavBar(props: { scrollProgress?: number }) {
  let bgOpacity = () =>
    MIN_BG_OPACITY + (props.scrollProgress ?? 0) * (MAX_BG_OPACITY - MIN_BG_OPACITY);
  return (
    <header
      class="hover-hide h-navbar flex w-full items-center gap-2 px-3 text-white sm:gap-3 sm:px-4"
      style={{ "background-color": `rgb(0 0 0 / ${bgOpacity()})` }}
    >
      <nav class="flex flex-1 items-center gap-2 text-sm font-semibold sm:gap-3">
        <MobileNav />
        <div class="hidden min-w-0 flex-1 items-center md:flex">
          <AppBreadcrumbs />
        </div>
        <div class="flex min-w-0 flex-1 justify-center">
          <SearchBar />
        </div>
        <div class="flex justify-end md:flex-1">
          <ScanButton />
        </div>
      </nav>
    </header>
  );
}
