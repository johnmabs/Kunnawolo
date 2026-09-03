import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class Shop {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly code: string,
    public readonly name: string,
    public readonly isActive: boolean,
  ) {}

  public static create(
    id: Identifier,
    organizationId: Identifier,
    code: string,
    name: string,
  ): Shop {
    const normalizedName = name.trim().normalize("NFC");
    const normalizedCode = code.trim().normalize("NFC");
    if (normalizedName.length === 0 || normalizedCode.length === 0) {
      throw new DomainError(
        "shop.invalid_details",
        "A shop name and code must be non-empty.",
      );
    }
    return new Shop(id, organizationId, normalizedCode, normalizedName, true);
  }

  public deactivate(): Shop {
    return new Shop(this.id, this.organizationId, this.code, this.name, false);
  }
}
