import { useNotificationsContext } from "@/context/NotificationContext";
import { Media } from "./library";
import { NotificationProps } from "@/components/Notification";

export type ErrorType =
  | "database"
  | "server"
  | "notfound"
  | "unavailable"
  | "parseparams"
  | "unknownprovider";

export class BaseError extends Error {
  errorType: ErrorType;
  constructor(type: ErrorType, message?: string) {
    super(message);
    this.errorType = type;
  }
}

export class DatabaseError extends BaseError {
  constructor(message?: string) {
    super("database", message);
  }
}

export class InternalServerError extends BaseError {
  constructor(message?: string) {
    super("server", message);
  }
}

export class NotFoundError extends BaseError {
  constructor(message?: string) {
    super("notfound", message);
  }
}

export class UnavailableError extends BaseError {
  constructor(message?: string) {
    super("unavailable", message);
  }
}

export class UnknownProviderError extends BaseError {
  constructor(message?: string) {
    super("unknownprovider", message);
  }
}

export class ParseParamsError extends BaseError {
  constructor(message?: string) {
    super("parseparams", message);
  }
}

type FetchResponse<T> =
  | {
      data?: never;
      error: { message: string };
      response: Response;
    }
  | {
      data: T;
      error?: never;
      response: Response;
    };

export function throwResponseErrors<T>(
  response: FetchResponse<T>,
): NonNullable<T> | never {
  if (response.data !== undefined && response.error == undefined) {
    return response.data!;
  }
  let kind = response.response.status;
  let msg = response.error!.message;
  if (kind == 404) {
    throw new NotFoundError(msg);
  }
  if (kind == 400) {
    throw new InternalServerError(msg);
  }
  if (kind == 500) {
    throw new InternalServerError(msg);
  }
  throw new InternalServerError("unknown error");
}

/**
 * Format should look like `fetch shows`
 * so it will get resolved to 'Failed to `fetch shows` (error message)'
 * or message
 */
export function notifyResponseErrors<T>(
  addNotification: ReturnType<
    typeof useNotificationsContext
  >[1]["addNotification"],
  /**
   * Format should look like `fetched shows`
   * so it will get resolved to Failed to message
   */
  message: string,
  content?: Media,
): (r: FetchResponse<T>) => FetchResponse<T> {
  return (response) => {
    if (response.error != undefined) {
      let props = {
        message: `Failed to ${message} (${response.error.message})`,
        contentUrl: content?.url(),
        subTitle: content?.friendlyTitle(),
        poster: content?.poster,
      };
      addNotification(props);
    }
    return response;
  };
}
