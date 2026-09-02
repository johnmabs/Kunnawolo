import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { RegisterOperationalRelease } from "../application/register-operational-release";
import { PrismaOperationalReleaseRepository } from "./prisma-operational-release-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for operational-release integration tests.");
const prisma = createPrismaClient(databaseUrl);

afterAll(async () => { await prisma.operationalRelease.deleteMany({ where: { reference: "REL-INT-ɛ" } }); await prisma.$disconnect(); });

describe("Prisma operational releases", () => {
  it("persists a Unicode release reference idempotently without tenant data", async () => {
    const repository = new PrismaOperationalReleaseRepository(prisma);
    const release = new RegisterOperationalRelease(repository, { next: () => Identifier.fromString("release-integration") }, { now: () => new Date("2026-09-02T12:00:00.000Z") });
    await expect(release.execute({ version: "1.0.0", reference: "REL-INT-ɛ", artifactSha: "c".repeat(64), actorId: "operator" })).resolves.toMatchObject({ reference: "REL-INT-ɛ" });
    await expect(release.execute({ version: "1.0.0", reference: "REL-INT-ɛ", artifactSha: "c".repeat(64), actorId: "operator" })).resolves.toMatchObject({ id: { value: "release-integration" } });
  });
});
