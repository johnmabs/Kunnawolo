import { describe, expect, it } from "vitest";
import type {
  AccessManagementRepository,
  AccessMember,
} from "./ports/access-management-repository";
import { UpdateMemberAccess } from "./update-member-access";

class Access implements AccessManagementRepository {
  public members = new Map<string, AccessMember>();
  public saved: AccessMember | null = null;
  public async findMember(_organizationId: string, userAccountId: string) {
    return this.members.get(userAccountId) ?? null;
  }
  public async findActiveShopIds() {
    return ["shop-a", "shop-b"];
  }
  public async updateAtomically(
    input: Parameters<AccessManagementRepository["updateAtomically"]>[0],
  ) {
    this.saved = input.member;
  }
}
const member = (
  userAccountId: string,
  role: AccessMember["role"],
  status: AccessMember["status"] = "ACTIVE",
): AccessMember => ({
  id: `membership-${userAccountId}`,
  organizationId: "org",
  userAccountId,
  role,
  status,
  shopIds: [],
});

describe("UpdateMemberAccess", () => {
  it("lets an owner assign a manager to active organization shops", async () => {
    const repository = new Access();
    repository.members.set("owner", member("owner", "OWNER"));
    repository.members.set("manager", member("manager", "CASHIER"));
    await new UpdateMemberAccess(repository).execute({
      organizationId: "org",
      actorId: "owner",
      userAccountId: "manager",
      role: "MANAGER",
      shopIds: ["shop-a", "shop-a"],
    });
    expect(repository.saved).toMatchObject({
      role: "MANAGER",
      shopIds: ["shop-a"],
    });
  });
  it("rejects access management by a non-owner", async () => {
    const repository = new Access();
    repository.members.set("cashier", member("cashier", "CASHIER"));
    await expect(
      new UpdateMemberAccess(repository).execute({
        organizationId: "org",
        actorId: "cashier",
        userAccountId: "cashier",
        role: "CASHIER",
        shopIds: ["shop-a"],
      }),
    ).rejects.toMatchObject({ code: "iam.access_management_forbidden" });
  });
  it("requires an active non-owner to have a shop", async () => {
    const repository = new Access();
    repository.members.set("owner", member("owner", "OWNER"));
    repository.members.set("cashier", member("cashier", "CASHIER"));
    await expect(
      new UpdateMemberAccess(repository).execute({
        organizationId: "org",
        actorId: "owner",
        userAccountId: "cashier",
        role: "CASHIER",
        shopIds: [],
      }),
    ).rejects.toMatchObject({ code: "iam.shop_assignment_required" });
  });
  it("rejects shops outside the organization", async () => {
    const repository = new Access();
    repository.members.set("owner", member("owner", "OWNER"));
    repository.members.set("cashier", member("cashier", "CASHIER"));
    await expect(
      new UpdateMemberAccess(repository).execute({
        organizationId: "org",
        actorId: "owner",
        userAccountId: "cashier",
        role: "CASHIER",
        shopIds: ["other"],
      }),
    ).rejects.toMatchObject({ code: "iam.invalid_shop_assignment" });
  });
});
