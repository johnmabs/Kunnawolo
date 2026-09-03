import type { MembershipConsultationRepository } from "./ports/membership-consultation-repository";

export class ListMembers {
  public constructor(private readonly repository: MembershipConsultationRepository) {}
  public execute(organizationId: string) { return this.repository.list(organizationId); }
}
