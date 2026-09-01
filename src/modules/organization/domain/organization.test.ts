import { describe, expect, it } from "vitest";

import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

import { Organization } from "./organization";

describe("Organization", () => {
  it("normalizes and preserves Unicode organization names", () => {
    const organization = Organization.create(Identifier.fromString("org-1"), {
      name: "  Kɔ̀rɔfɛ  ",
      currency: "XOF",
    });

    expect(organization.name).toBe("Kɔ̀rɔfɛ".normalize("NFC"));
    expect(organization.id.value).toBe("org-1");
  });

  it("rejects an empty name and an invalid currency", () => {
    expect(() => Organization.create(Identifier.fromString("org-1"), { name: " ", currency: "XOF" })).toThrow(DomainError);
    expect(() => Organization.create(Identifier.fromString("org-1"), { name: "Kunnawolo", currency: "xof" })).toThrow(DomainError);
  });
});
