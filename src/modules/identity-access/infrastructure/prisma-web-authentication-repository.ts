import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { Identifier } from "@/shared/domain/identifier";
import type { PasswordHash } from "../application/ports/password-hasher";
import type { WebAuthenticationRepository } from "../application/ports/web-authentication-repository";
import { UserAccount } from "../domain/user-account";
import { WebSession } from "../domain/web-session";

export class PrismaWebAuthenticationRepository implements WebAuthenticationRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAccountWithCredentialByEmail(email: string) {
    const row = await this.prisma.userAccount.findUnique({ where: { email }, include: { passwordCredential: true } });
    if (row?.passwordCredential === null || row === null) return null;
    return {
      account: UserAccount.create(Identifier.fromString(row.id), row.email, row.displayName),
      credential: { algorithm: row.passwordCredential.algorithm, salt: row.passwordCredential.salt, hash: row.passwordCredential.hash },
    };
  }

  public async findAccountById(userAccountId: string) {
    const row = await this.prisma.userAccount.findUnique({ where: { id: userAccountId } });
    return row === null ? null : UserAccount.create(Identifier.fromString(row.id), row.email, row.displayName);
  }

  public async createAccount(account: UserAccount, credential: PasswordHash): Promise<void> {
    await this.prisma.userAccount.create({
      data: {
        id: account.id.value,
        email: account.email,
        displayName: account.displayName,
        passwordCredential: { create: credential },
      },
    });
  }

  public async saveSession(session: WebSession): Promise<void> {
    await this.prisma.webSession.upsert({
      where: { id: session.id.value },
      create: {
        id: session.id.value,
        userAccountId: session.userAccountId.value,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        lastSeenAt: session.lastSeenAt,
      },
      update: { revokedAt: session.revokedAt, lastSeenAt: session.lastSeenAt },
    });
  }

  public async findSessionByTokenHash(tokenHash: string) {
    const row = await this.prisma.webSession.findUnique({ where: { tokenHash } });
    return row === null ? null : WebSession.restore({
      id: Identifier.fromString(row.id),
      userAccountId: Identifier.fromString(row.userAccountId),
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      lastSeenAt: row.lastSeenAt,
    });
  }
}
