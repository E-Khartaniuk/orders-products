export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }

  static notFound(entity: string, id: number | string) {
    return new HttpError(404, `${entity} with id ${id} not found`);
  }
}
