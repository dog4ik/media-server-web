import { For, createSignal, onCleanup, onMount } from "solid-js";
import styles from "./Table.module.css";

type TagType = "H2" | "H3";

type Chapter = {
  number: number;
  href: string;
  title: string;
  topOffset: number;
  children: SubChapter[];
};

type SubChapter = {
  title: string;
  href: string;
};

export default function Table() {
  let [currentItem, setCurrentItem] = createSignal(1);
  let [content, setContent] = createSignal<ReturnType<typeof generateContent>>(
    [],
  );
  let container: HTMLDivElement;

  function generateContent(headings: ReturnType<typeof getHeadings>) {
    let result: Chapter[] = [];
    let number = 0;
    for (let heading of headings) {
      let id = heading.getAttribute("id");
      let content = heading.innerText;
      let tagname = heading.tagName as TagType;
      let offsetFromTop =
        heading.getBoundingClientRect().top +
        container.scrollTop -
        // 30% of the screen
        (container.clientHeight / 100) * 30;

      if (tagname != "H2" && tagname != "H3") {
        continue;
      }

      if (id && content) {
        if (tagname == "H3" && result[number - 1]) {
          result[number - 1].children.push({
            href: `#${id}`,
            title: content,
          });
        }
        if (tagname == "H2") {
          result.push({
            href: `#${id}`,
            topOffset: offsetFromTop,
            title: content,
            number: ++number,
            children: [],
          });
        }
      }
    }
    return result;
  }

  function getHeadings() {
    return document.querySelectorAll<HTMLHeadingElement>(".heading");
  }

  function onScroll() {
    let currentScroll = container.scrollTop;
    content().forEach((item) => {
      if (item.topOffset < currentScroll) {
        setCurrentItem(item.number);
        return;
      }
    });
  }

  onMount(() => {
    container = document.querySelector("main") as HTMLDivElement;
    let headings = getHeadings();
    setContent(generateContent(headings));
    onScroll();
    container?.addEventListener("scroll", onScroll);
  });

  onCleanup(() => {
    container?.removeEventListener("scroll", onScroll);
  });

  return (
    <div class="fixed bottom-0 right-4 top-0 z-10 flex h-screen w-80 items-start justify-center text-white">
      <ol class="relative flex list-none flex-col pl-6 pr-6 pt-20">
        <For each={content()}>
          {(chapter) => (
            <>
              <li
                class={`rounded-md px-2 py-1.5 text-start font-medium hover:underline ${
                  chapter.number == currentItem() ? " bg-white text-black " : ""
                }`}
              >
                <a class="h-full" href={chapter.href}>
                  {chapter.title}
                </a>
              </li>
              <div
                class={`${styles.childrenContainer} ${
                  chapter.number == currentItem() ? styles.open : ""
                }`}
              >
                <ul>
                  {chapter.children.map((child) => (
                    <li class="py-1 pl-8 text-start text-gray-200">
                      <a href={child.href}>
                        <span>{child.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </For>
      </ol>
    </div>
  );
}
