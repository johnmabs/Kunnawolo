import { AuthorizationPolicy, type AuthorizationContext } from "../domain/authorization-policy";

export class AuthorizeAction {
  public constructor(private readonly policy: AuthorizationPolicy) {}
  public execute(context: AuthorizationContext): void {
    this.policy.authorize(context);
  }
}
