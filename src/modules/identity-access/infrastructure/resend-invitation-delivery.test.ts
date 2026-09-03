import { describe, expect, it } from "vitest";
import type {
  CreateEmailOptions,
  CreateEmailRequestOptions,
  CreateEmailResponse,
} from "resend";
import { ResendInvitationDelivery } from "./resend-invitation-delivery";

describe("ResendInvitationDelivery", () => {
  const input = {
    email: "invite@example.com",
    displayName: "Jean <script>",
    organizationName: "ASTU & Cie",
    acceptanceUrl: "https://sales.example/invitations/token?a=1&b=2",
    expiresAt: new Date("2026-09-05T08:00:00.000Z"),
    idempotencyKey: "membership-invitation/invitation-id",
  };

  it("sends an escaped invitation with an idempotency key", async () => {
    let message!: CreateEmailOptions;
    let options!: CreateEmailRequestOptions;
    const send = async (
      sentMessage: CreateEmailOptions,
      sentOptions: CreateEmailRequestOptions,
    ): Promise<CreateEmailResponse> => {
      message = sentMessage;
      options = sentOptions;
      return { data: { id: "email-id" }, error: null, headers: null };
    };
    await new ResendInvitationDelivery(
      "re_test",
      "Astu Sales <invitations@example.com>",
      "support@example.com",
      send,
    ).send(input);
    expect(message).toMatchObject({
      to: ["invite@example.com"],
      replyTo: "support@example.com",
    });
    expect(message.html).toContain("Jean &lt;script&gt;");
    expect(message.html).not.toContain("Jean <script>");
    expect(options).toEqual({ idempotencyKey: input.idempotencyKey });
  });

  it("turns a provider failure into an application-safe error", async () => {
    const send = async (): Promise<CreateEmailResponse> => ({
      data: null,
      error: {
        name: "validation_error",
        message: "provider details",
        statusCode: 422,
      },
      headers: null,
    });
    await expect(
      new ResendInvitationDelivery(
        "re_test",
        "Astu Sales <invitations@example.com>",
        null,
        send,
      ).send(input),
    ).rejects.toMatchObject({ code: "iam.invitation_delivery_failed" });
  });
});
