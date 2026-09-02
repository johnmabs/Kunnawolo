import { describe, expect, it } from "vitest";
import type { WorkspacePreference } from "../domain/workspace-preference";
import type { WorkspacePreferenceAuthorization } from "./ports/workspace-preference-authorization";
import type { WorkspacePreferenceRepository } from "./ports/workspace-preference-repository";
import type { WorkspaceIdempotencyRepository } from "./ports/workspace-idempotency-repository";
import { SaveWorkspacePreferenceIdempotently } from "./save-workspace-preference-idempotently";

class Preferences implements WorkspacePreferenceRepository, WorkspaceIdempotencyRepository {
  public preference: WorkspacePreference | null = null;
  public records = new Map<string, readonly [string, WorkspacePreference]>();
  public async find() { return this.preference; }
  public async save() {}
  public async saveIdempotently(preference: WorkspacePreference, key: string, fingerprint: string) { const replay = this.records.get(key); if (replay !== undefined) { if (replay[0] !== fingerprint) throw Object.assign(new Error(), { code: "workspace.idempotency_conflict" }); return replay[1]; } this.preference = preference; this.records.set(key, [fingerprint, preference]); return preference; }
}
class Authorization implements WorkspacePreferenceAuthorization { public async authorize() {} }

describe("SaveWorkspacePreferenceIdempotently", () => {
  it("returns the first scoped preference on a retry and rejects a conflicting payload", async () => {
    const preferences = new Preferences();
    const save = new SaveWorkspacePreferenceIdempotently(preferences, preferences, new Authorization());
    const first = await save.execute({ organizationId: "org", actorId: "actor", shopId: "inactive-shop", idempotencyKey: "préférence-ɛ" });
    await expect(save.execute({ organizationId: "org", actorId: "actor", shopId: "inactive-shop", idempotencyKey: "préférence-ɛ" })).resolves.toBe(first);
    await expect(save.execute({ organizationId: "org", actorId: "actor", shopId: "other-shop", idempotencyKey: "préférence-ɛ" })).rejects.toMatchObject({ code: "workspace.idempotency_conflict" });
  });
});
