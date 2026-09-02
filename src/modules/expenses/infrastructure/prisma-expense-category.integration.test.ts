import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CreateExpenseCategory } from "../application/create-expense-category";
import { UpdateExpenseCategory } from "../application/update-expense-category";
import { PrismaExpenseCategoryRepository } from "./prisma-expense-category-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for expense category integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "expense-category-org";
const otherOrganizationId = "expense-category-other-org";
const categoryId = "expense-category-id";
let sequence = 0;
beforeAll(async () => { await prisma.organization.createMany({ data: [{ id: organizationId, name: "Dépenses Ɛ", currency: "XOF" }, { id: otherOrganizationId, name: "Autre", currency: "XOF" }], skipDuplicates: true }); });
afterAll(async () => { await prisma.expenseCategory.deleteMany({ where: { organizationId: { in: [organizationId, otherOrganizationId] } } }); await prisma.organizationAudit.deleteMany({ where: { organizationId: { in: [organizationId, otherOrganizationId] } } }); await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } }); await prisma.$disconnect(); });
describe("PrismaExpenseCategoryRepository", () => { it("persists a unique Unicode category within its organization", async () => { const repository = new PrismaExpenseCategoryRepository(prisma); const create = new CreateExpenseCategory(repository, { next: () => Identifier.fromString(sequence++ === 0 ? categoryId : `expense-category-${sequence}`) }); await create.execute({ organizationId, name: "  Transport Ɛ  ", actorId: "actor" }); await expect(new UpdateExpenseCategory(repository).execute({ organizationId, categoryId, name: "Transport Ɛ", isActive: false, actorId: "actor-2" })).resolves.toMatchObject({ isActive: false }); await expect(create.execute({ organizationId, name: "Transport Ɛ", actorId: "actor" })).rejects.toMatchObject({ code: "expenses.duplicate_category_name" }); await expect(repository.findById(otherOrganizationId, categoryId)).resolves.toBeNull(); await expect(prisma.organizationAudit.count({ where: { organizationId } })).resolves.toBe(2); }); });
