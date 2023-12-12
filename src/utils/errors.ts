export type ErrorType = "database" | "server" | "notfound" | "unknown";

export default class BaseError extends Error {
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

export class UnknownError extends BaseError {
  constructor(message?: string) {
    super("unknown", message);
  }
}
