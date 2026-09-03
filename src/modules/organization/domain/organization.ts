import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export type OrganizationProfile = Readonly<{ name: string; currency: string }>;

function normalizeName(name: string): string {
  const normalized = name.trim().normalize("NFC");

  if (normalized.length === 0) {
    throw new DomainError(
      "organization.invalid_name",
      "An organization name must be non-empty.",
    );
  }

  return normalized;
}

function validateCurrency(currency: string): string {
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new DomainError(
      "organization.invalid_currency",
      "A currency must be a three-letter ISO code.",
    );
  }

  return currency;
}

export class Organization {
  private constructor(
    public readonly id: Identifier,
    public readonly name: string,
    public readonly currency: string,
  ) {}

  public static create(
    id: Identifier,
    profile: OrganizationProfile,
  ): Organization {
    return new Organization(
      id,
      normalizeName(profile.name),
      validateCurrency(profile.currency),
    );
  }

  public updateProfile(profile: OrganizationProfile): Organization {
    return Organization.create(this.id, profile);
  }
}
