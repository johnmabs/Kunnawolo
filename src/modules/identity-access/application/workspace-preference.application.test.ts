import { describe, expect, it } from "vitest";
import type { WorkspacePreferenceAuthorization } from "./ports/workspace-preference-authorization";
import type { WorkspacePreferenceRepository } from "./ports/workspace-preference-repository";
import type { WorkspacePreference } from "../domain/workspace-preference";
import { SaveWorkspacePreference } from "./save-workspace-preference";
import { GetWorkspacePreference } from "./get-workspace-preference";

class Preferences implements WorkspacePreferenceRepository {
  public value: WorkspacePreference | null = null;
  public async find() {
    return this.value;
  }
  public async save(preference: WorkspacePreference) {
    this.value = preference;
  }
}
class Authorization implements WorkspacePreferenceAuthorization {
  public calls: Array<readonly [string, string, string | null]> = [];
  public async authorize(
    organizationId: string,
    actorId: string,
    shopId: string | null,
  ) {
    this.calls.push([organizationId, actorId, shopId]);
  }
}

describe("workspace preferences", () => {
  it("saves and reads an isolated historical-shop preference", async () => {
    const preferences = new Preferences();
    const authorization = new Authorization();
    const save = new SaveWorkspacePreference(preferences, authorization);
    await expect(
      save.execute({
        organizationId: "org",
        actorId: "actor",
        shopId: "inactive-shop",
        isCompact: true,
      }),
    ).resolves.toMatchObject({
      shopId: { value: "inactive-shop" },
      isCompact: true,
    });
    await expect(
      new GetWorkspacePreference(preferences, authorization).execute({
        organizationId: "org",
        actorId: "actor",
      }),
    ).resolves.toMatchObject({ shopId: { value: "inactive-shop" } });
    expect(authorization.calls).toEqual([
      ["org", "actor", "inactive-shop"],
      ["org", "actor", "inactive-shop"],
    ]);
  });
});
