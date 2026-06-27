import type { ComponentProps, ValidComponent } from "solid-js";
import { Show, mergeProps, splitProps } from "solid-js";
import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";

import { cn } from "@/lib/cn";

export const DialogPortal = DialogPrimitive.Portal;

export type DialogProps = ComponentProps<typeof DialogPrimitive>;

export const Dialog = (props: DialogProps) => {
  return <DialogPrimitive data-slot="dialog" {...props} />;
};

export type DialogTriggerProps<T extends ValidComponent = "button"> = ComponentProps<
  typeof DialogPrimitive.Trigger<T>
>;

export const DialogTrigger = <T extends ValidComponent = "button">(
  props: DialogTriggerProps<T>,
) => {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
};

export type DialogCloseButtonProps<T extends ValidComponent = "button"> = ComponentProps<
  typeof DialogPrimitive.CloseButton<T>
>;

export const DialogCloseButton = <T extends ValidComponent = "button">(
  props: DialogCloseButtonProps<T>,
) => {
  return <DialogPrimitive.CloseButton data-slot="dialog-close" {...props} />;
};

export type DialogContentProps<T extends ValidComponent = "div"> = ComponentProps<
  typeof DialogPrimitive.Content<T>
> & {
  showCloseButton?: boolean;
};

export const DialogContent = <T extends ValidComponent = "div">(props: DialogContentProps<T>) => {
  const merge = mergeProps(
    {
      showCloseButton: true,
    } as DialogContentProps,
    props,
  );
  const [local, rest] = splitProps(merge, ["class", "children", "showCloseButton"]);

  return (
    <>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        class="data-expanded:animate-in data-closed:animate-out data-closed:fade-out-0 data-expanded:fade-in-0 fixed inset-0 z-50 bg-black/50"
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        class={cn(
          "bg-background data-expanded:animate-in data-closed:animate-out data-closed:fade-out-0 data-expanded:fade-in-0 fixed z-50 grid content-start gap-4 overflow-y-auto p-6 shadow-lg duration-200 [&>*]:min-w-0",
          // Mobile: full-screen sheet.
          "inset-0 w-full max-w-none rounded-none border-0",
          // sm and up: centered modal.
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-2/3 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border",
          "sm:data-closed:zoom-out-95 sm:data-expanded:zoom-in-95",
          local.class,
        )}
        {...rest}
      >
        {local.children}
        <Show when={local.showCloseButton}>
          {/* Fixed on mobile so it stays reachable in a full-screen modal even while the
              body scrolls; absolute (modal corner) on desktop. */}
          <DialogPrimitive.CloseButton
            aria-label="Close"
            class="bg-background/70 focus-visible:ring-ring fixed top-3 right-3 z-10 flex size-9 items-center justify-center rounded-md opacity-90 backdrop-blur transition-[opacity,background-color,box-shadow] duration-200 hover:opacity-100 focus-visible:ring-2 focus-visible:outline-hidden sm:absolute sm:top-4 sm:right-4 sm:size-8 sm:bg-transparent sm:backdrop-blur-none [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 sm:[&_svg]:size-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18 6L6 18M6 6l12 12"
              />
            </svg>
          </DialogPrimitive.CloseButton>
        </Show>
      </DialogPrimitive.Content>
    </>
  );
};

export type DialogHeaderProps = ComponentProps<"div">;

export const DialogHeader = (props: DialogHeaderProps) => {
  const [, rest] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="dialog-header"
      class={cn("flex flex-col gap-2 text-center sm:text-left", props.class)}
      {...rest}
    />
  );
};

export type DialogFooterProps = ComponentProps<"div">;

export const DialogFooter = (props: DialogFooterProps) => {
  const [, rest] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="dialog-footer"
      class={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", props.class)}
      {...rest}
    />
  );
};

export type DialogTitleProps<T extends ValidComponent = "h2"> = ComponentProps<
  typeof DialogPrimitive.Title<T>
>;

export const DialogTitle = <T extends ValidComponent = "h2">(props: DialogTitleProps<T>) => {
  const [, rest] = splitProps(props as DialogTitleProps, ["class"]);

  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      class={cn("text-lg leading-none font-semibold", props.class)}
      {...rest}
    />
  );
};

export type DialogDescriptionProps<T extends ValidComponent = "p"> = ComponentProps<
  typeof DialogPrimitive.Description<T>
>;

export const DialogDescription = <T extends ValidComponent = "p">(
  props: DialogDescriptionProps<T>,
) => {
  const [, rest] = splitProps(props as DialogDescriptionProps, ["class"]);

  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      class={cn("text-muted-foreground text-sm", props.class)}
      {...rest}
    />
  );
};
