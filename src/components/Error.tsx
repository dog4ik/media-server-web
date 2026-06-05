import { Button } from "@/ui/button";
import {
  NotFoundError,
  InternalServerError,
  UnavailableError,
  BaseError,
  BadRequestError,
} from "@/utils/errors";
import { MEDIA_SERVER_URL } from "@/utils/serverApi";
import { useServerStatus } from "@/context/ServerStatusContext";
import { FiAlertOctagon, FiAlertTriangle, FiRefreshCw, FiSearch, FiWifiOff } from "solid-icons/fi";
import { ComponentProps, ErrorBoundary, JSX, onCleanup, ParentProps, Show } from "solid-js";

/**
 * Centers the error panel inside whatever content area it is rendered in.
 * It claims a comfortable chunk of vertical space so the panel never feels
 * cramped, while leaving the surrounding layout (sidebar, navbar, page title)
 * untouched.
 */
function ErrorLayout(props: ParentProps) {
  return (
    <div class="flex min-h-[60vh] w-full items-center justify-center p-4">{props.children}</div>
  );
}

type Accent = "destructive" | "muted";

type PanelProps = {
  title: string;
  message?: JSX.Element;
  icon: JSX.Element;
  accent?: Accent;
  retry?: () => void;
};

function ErrorPanel(props: PanelProps) {
  let accent = () => props.accent ?? "destructive";
  return (
    <div class="bg-card/70 border-border/60 flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border p-8 text-center shadow-xl backdrop-blur-md">
      <div
        class="flex size-16 items-center justify-center rounded-full"
        classList={{
          "bg-destructive/10 text-destructive": accent() === "destructive",
          "bg-muted text-muted-foreground": accent() === "muted",
        }}
      >
        {props.icon}
      </div>
      <div class="space-y-1.5">
        <h2 class="text-xl font-semibold">{props.title}</h2>
        <Show when={props.message}>
          <p class="text-muted-foreground text-sm leading-relaxed wrap-break-word">
            {props.message}
          </p>
        </Show>
      </div>
      <Show when={props.retry}>
        {(retry) => (
          <Button onClick={retry()} class="gap-2">
            <FiRefreshCw />
            Try again
          </Button>
        )}
      </Show>
    </div>
  );
}

function ServerUnavailable(props: { reset: () => void }) {
  // When the connection comes back, automatically retry instead of forcing
  // the user to click. `useServerStatus` may be undefined if the panel is
  // rendered outside the provider (e.g. the root error fallback), so guard it.
  let status = useServerStatus();
  if (status) {
    let [, { addWakeSubscriber, removeWakeSubscriber }] = status;
    let id = addWakeSubscriber(props.reset);
    onCleanup(() => removeWakeSubscriber(id));
  }

  return (
    <ErrorPanel
      accent="muted"
      icon={<FiWifiOff size={32} />}
      title="Server is not available"
      message={
        <>
          Make sure it's on and reachable at{" "}
          <a class="text-foreground hover:underline" href={MEDIA_SERVER_URL}>
            {MEDIA_SERVER_URL}
          </a>
        </>
      }
      retry={() => window.location.reload()}
    />
  );
}

type Props = {
  err: Error;
  reset: () => void;
  context?: string;
};

export function ApplicationErrorBoundary(props: ComponentProps<typeof ErrorBoundary>) {
  return (
    <ErrorBoundary
      fallback={(err, reset) => {
        if (!(err instanceof BaseError) || err instanceof UnavailableError) {
          throw err;
        }
        if (typeof props.fallback === "function") {
          return props.fallback(err, reset);
        }
        return props.fallback;
      }}
    >
      {props.children}
    </ErrorBoundary>
  );
}

export function errorBoundaryFallback(
  context?: string,
): (err: any, reset: () => void) => JSX.Element {
  return (err, reset) => {
    return <ErrorComponent err={err} reset={reset} context={context} />;
  };
}

export function ErrorComponent(props: Props) {
  console.error(props.err);

  if (props.err instanceof UnavailableError) {
    return (
      <ErrorLayout>
        <ServerUnavailable reset={props.reset} />
      </ErrorLayout>
    );
  }

  if (props.err instanceof NotFoundError) {
    return (
      <ErrorLayout>
        <ErrorPanel
          accent="muted"
          icon={<FiSearch size={32} />}
          title="Not found"
          message={props.err.message || props.context || "The requested resource doesn't exist."}
        />
      </ErrorLayout>
    );
  }

  if (props.err instanceof BadRequestError) {
    return (
      <ErrorLayout>
        <ErrorPanel
          icon={<FiAlertOctagon size={32} />}
          title="Request failed"
          message={props.context ? `${props.context} (${props.err.message})` : props.err.message}
          retry={props.reset}
        />
      </ErrorLayout>
    );
  }

  if (props.err instanceof InternalServerError) {
    return (
      <ErrorLayout>
        <ErrorPanel
          icon={<FiAlertOctagon size={32} />}
          title="Internal server error"
          message={props.err.message || props.context}
          retry={props.reset}
        />
      </ErrorLayout>
    );
  }

  return (
    <ErrorLayout>
      <ErrorPanel
        icon={<FiAlertTriangle size={32} />}
        title="Something went wrong"
        message={props.context ?? props.err.message ?? "An unexpected error occurred."}
        retry={props.reset}
      />
    </ErrorLayout>
  );
}
