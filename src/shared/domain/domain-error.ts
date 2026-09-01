export class DomainError extends Error {
  public readonly name = "DomainError";

  public constructor(
    public readonly code: string,
    message: string,
    public readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
  }
}
