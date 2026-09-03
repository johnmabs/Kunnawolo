import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class ApiKeyToken {
  private constructor(
    public readonly keyId: Identifier,
    public readonly secret: string,
  ) {}

  public static parse(value: string): ApiKeyToken {
    const [id, secret, ...rest] = value.trim().split(".");
    if (
      id === undefined ||
      secret === undefined ||
      rest.length !== 0 ||
      secret.length < 32
    )
      throw new DomainError(
        "security.invalid_api_key",
        "The API key is invalid.",
      );
    return new ApiKeyToken(Identifier.fromString(id), secret);
  }
}
