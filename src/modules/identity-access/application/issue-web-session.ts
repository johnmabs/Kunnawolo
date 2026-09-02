import type { Clock } from "@/shared/domain/clock";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { WebSession } from "../domain/web-session";
import type { OpaqueTokenGenerator, OpaqueTokenHasher } from "./ports/opaque-token";
import type { WebAuthenticationRepository } from "./ports/web-authentication-repository";
import { Identifier } from "@/shared/domain/identifier";

const SESSION_LIFETIME_MILLIS = 7 * 24 * 60 * 60 * 1_000;

export type IssuedWebSession = Readonly<{ token: string; expiresAt: Date }>;

export class IssueWebSession {
  public constructor(
    private readonly repository: WebAuthenticationRepository,
    private readonly identifiers: IdentifierGenerator,
    private readonly tokens: OpaqueTokenGenerator,
    private readonly tokenHasher: OpaqueTokenHasher,
    private readonly clock: Clock,
  ) {}

  public async execute(userAccountId: string): Promise<IssuedWebSession> {
    const issuedAt = this.clock.now();
    const expiresAt = new Date(issuedAt.getTime() + SESSION_LIFETIME_MILLIS);
    const token = this.tokens.generate();
    const session = WebSession.issue({
      id: this.identifiers.next(),
      userAccountId: Identifier.fromString(userAccountId),
      tokenHash: this.tokenHasher.hash(token),
      issuedAt,
      expiresAt,
    });
    await this.repository.saveSession(session);
    return { token, expiresAt };
  }
}
