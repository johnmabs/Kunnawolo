import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { Identifier } from "@/shared/domain/identifier";

import type { OrganizationRepository } from "../application/ports/organization-repository";
import { Organization } from "../domain/organization";

export class PrismaOrganizationRepository implements OrganizationRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async save(organization: Organization): Promise<void> {
    await this.prisma.organization.upsert({
      where: { id: organization.id.value },
      create: {
        id: organization.id.value,
        name: organization.name,
        currency: organization.currency,
      },
      update: { name: organization.name, currency: organization.currency },
    });
  }

  public async findById(id: string): Promise<Organization | null> {
    const record = await this.prisma.organization.findUnique({ where: { id } });
    return record === null
      ? null
      : Organization.create(Identifier.fromString(record.id), {
          name: record.name,
          currency: record.currency,
        });
  }
}
