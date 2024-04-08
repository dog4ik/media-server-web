import { A } from "@solidjs/router";
import { FiArrowLeftCircle } from "solid-icons/fi";
import Search from "../Search";

export default function NavBar() {
  function back() {
    window.navigation.back();
  }
  return (
    <header class="dark:border-gray-850 fixed top-0 z-10 flex h-16 w-full shrink-0 items-center px-4 text-white">
      <nav class="flex flex-1 justify-between text-sm font-semibold">
        <button onClick={back}>
          <FiArrowLeftCircle stroke="white" size={40} />
        </button>
        <Search />
        <ul class="flex items-center space-x-4">
          <li class="">
            <A class="" href="#">
              Contact
            </A>
          </li>
        </ul>
      </nav>
    </header>
  );
}
