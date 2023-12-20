import { A, useNavigate } from "@solidjs/router";
import { ParentProps } from "solid-js";

type Props = {
  href: string;
  startCallBack?: () => void;
  endCallBack?: () => Promise<void>;
  class?: string;
};

export default function TransitionLink(props: Props & ParentProps) {
  let navigator = useNavigate();
  let linkRef: HTMLAnchorElement;
  function handleTransition(e: Event) {
    e.preventDefault();
    props.startCallBack && props.startCallBack();
    document.startViewTransition(async () => {
      let url = new URL(linkRef.href);
      props.endCallBack && (await props.endCallBack());
      navigator(url.pathname);
    });
  }

  return (
    <A
      href={props.href}
      ref={linkRef!}
      class={props.class}
      onClick={handleTransition}
    >
      {props.children}
    </A>
  );
}
