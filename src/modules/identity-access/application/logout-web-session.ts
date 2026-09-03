import type { Clock } from "@/shared/domain/clock";
import type { OpaqueTokenHasher } from "./ports/opaque-token";
import type { WebAuthenticationRepository } from "./ports/web-authentication-repository";

export class LogoutWebSession {
  public constructor(
    private readonly repository: WebAuthenticationRepository,
    private readonly tokenHasher: OpaqueTokenHasher,
    private readonly clock: Clock,
  ) {}
  public async execute(token: string): Promise<void> {
    if (token.length === 0) return;
    const session = await this.repository.findSessionByTokenHash(
      this.tokenHasher.hash(token),
    );
    if (session !== null)
      await this.repository.saveSession(session.revoke(this.clock.now()));
  }
}
