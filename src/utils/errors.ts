import { Schemas } from "./serverApi";

export type ErrorType =
  | "database"
  | "server"
  | "notfound"
  | "unavailable"
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

export class ServerError extends BaseError {
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

export function throwAppError(appError: Schemas["AppError"]): never {
  let kind = appError.kind;
  let msg = appError.message;
  if (kind == "NotFound") {
    throw new NotFoundError(msg);
  }
  if (kind == "Duplicate") {
    throw new ServerError(msg);
  }
  if (kind == "BadRequest") {
    throw new ServerError(msg);
  }
  if (kind == "InternalError") {
    throw new ServerError(msg);
  }
  throw new ServerError("unknown error");
}
