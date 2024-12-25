import { Button } from "@/ui/button";
import {
  NotFoundError,
  ParseParamsError,
  InternalServerError,
} from "@/utils/errors";
import { MEDIA_SERVER_URL } from "@/utils/serverApi";
import { FiSearch, FiSmile, FiWifiOff } from "solid-icons/fi";
import { ErrorBoundary, JSX, ParentProps, Show } from "solid-js";

export default function GlobalErrorBoundary(props: ParentProps) {
  return (
    <ErrorBoundary fallback={ErrorDisplay}>{props.children}</ErrorBoundary>
  );
}

function ErrorLayout(props: ParentProps) {
  return (
    <div class="flex h-full w-full items-center justify-center">
      {props.children}
    </div>
  );
}

type ErrorProps = {
  onReset: () => void;
};

function ServerUnavailable() {
  return (
    <div class="flex max-w-md flex-col items-center gap-5 rounded-md bg-black p-6">
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

function ErrorDisplay(err: Error, reset: () => void) {
  console.log({
    name: err.name,
    message: err.message,
    cause: err.cause,
    stack: err.stack,
  });

  if (err instanceof TypeError && err.message == "Failed to fetch") {
    return (
      <ErrorLayout>
        <ServerUnavailable />
      </ErrorLayout>
    );
  }

  if (err instanceof ParseParamsError) {
    return (
      <ErrorLayout>
        <GenericError title="Url params are incorrect" />
      </ErrorLayout>
    );
  }

  if (err instanceof NotFoundError) {
    return (
      <ErrorLayout>
        <GenericError
          icon={<FiSearch size={40} />}
          message={err.message}
          title="Requested resource is not found"
        />
      </ErrorLayout>
    );
  }

  if (err instanceof InternalServerError) {
    return (
      <ErrorLayout>
        <GenericError
          title="Internal server error"
          message={err.message}
          icon={<FiSmile size={40} />}
        />
      </ErrorLayout>
    );
  }

  console.error(err);

  return (
    <ErrorLayout>
      <div class="flex flex-col">
        <span>Unhandled error boundary</span>
        <span>Error: {err.message}</span>
        <Button onClick={reset} class="btn">
          Reset
        </Button>
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
    <div class="flex max-w-md flex-col items-center gap-5 rounded-md bg-black p-6">
      <span class="text-xl">{props.title}</span>
      <Show when={props.message}>
        {(message) => <p class="text-center">{message()}</p>}
      </Show>
      <Show when={props.icon}>{props.icon}</Show>
      <Show when={props.retry}>
        {(retry) => (
          <Button class="btn" onClick={retry}>
            Try again
          </Button>
        )}
      </Show>
    </div>
  );
}
