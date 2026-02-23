import { Button } from "@/ui/button";
import {
  NotFoundError,
  InternalServerError,
  UnavailableError,
  BaseError,
  BadRequestError,
} from "@/utils/errors";
import { MEDIA_SERVER_URL } from "@/utils/serverApi";
import { FiAlertOctagon, FiSearch, FiSmile, FiWifiOff } from "solid-icons/fi";
import {
  ComponentProps,
  ErrorBoundary,
  JSX,
  ParentProps,
  Show,
} from "solid-js";

function ErrorLayout(props: ParentProps) {
  return (
    <div class="flex size-full items-center justify-center">
      {props.children}
    </div>
  );
}

function ServerUnavailable() {
  return (
    <div class="bg-card flex max-w-md flex-col items-center gap-5 rounded-md p-6">
      <span class="text-xl">Server is not available</span>
      <p class="text-center">
        Make sure it's on and reachable by url:{" "}
        <a class="hover:underline" href={MEDIA_SERVER_URL}>
          {MEDIA_SERVER_URL}
        </a>
      </p>
      <FiWifiOff size={50} />
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </div>
  );
}

type Props = {
  err: Error;
  reset: () => void;
  context?: string;
};

export function ApplicationErrorBoundary(
  props: ComponentProps<typeof ErrorBoundary>,
) {
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
        <ServerUnavailable />
      </ErrorLayout>
    );
  }

  if (props.err instanceof BadRequestError) {
    return (
      <ErrorLayout>
        <GenericError
          icon={<FiAlertOctagon size={40} />}
          title="Request failed"
          message={`${props.context ?? "Request failed"} (${props.err.message})`}
          retry={props.reset}
        />
      </ErrorLayout>
    );
  }

  if (props.err instanceof NotFoundError) {
    return (
      <ErrorLayout>
        <GenericError
          icon={<FiSearch size={40} />}
          message={props.err.message}
          title="Requested resource is not found"
        />
      </ErrorLayout>
    );
  }

  if (props.err instanceof InternalServerError) {
    return (
      <ErrorLayout>
        <GenericError
          title="Internal server props.error"
          message={props.err.message}
          icon={<FiAlertOctagon size={40} />}
        />
      </ErrorLayout>
    );
  }

  console.error(props.err);

  return (
    <ErrorLayout>
      <div class="flex flex-col">
        <span>Unhandled error fallback</span>
        <span>
          Error: {props.context ?? props.err.message ?? "Unknown error"}
        </span>
        <Button onClick={props.reset}>Reset</Button>
      </div>
    </ErrorLayout>
  );
}

type GenericErrorProps = {
  title: string;
  message?: string;
  icon?: JSX.Element;
  retry?: () => void;
};

function GenericError(props: GenericErrorProps) {
  return (
    <div class="bg-card flex max-w-md flex-col items-center gap-5 rounded-md p-6">
      <span class="text-xl">{props.title}</span>
      <Show when={props.message}>
        {(message) => <p class="text-center">{message()}</p>}
      </Show>
      <Show when={props.icon}>{props.icon}</Show>
      <Show when={props.retry}>
        {(retry) => <Button onClick={retry}>Try again</Button>}
      </Show>
    </div>
  );
}
