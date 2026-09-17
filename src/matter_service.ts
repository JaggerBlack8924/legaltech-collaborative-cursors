import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";

export const intakeSchema = z.object({ matterId: z.string().min(1), title: z.string().min(1), signerEmail: z.string().email(), deadline: z.string().datetime() });
export type MatterIntake = z.infer<typeof intakeSchema>;

export async function openMatter(input: unknown, client: InfraiClient, accountId: string) {
  const matter = intakeSchema.parse(input);
  const channel = `matter-${matter.matterId}`;
  await client.createChannel(channel);
  await client.issueToken(`editor-${matter.matterId}`, [channel]);
  await client.publish(channel, "matter.intake.accepted", { operation_id: `intake-${matter.matterId}`, title: matter.title, signer_email: matter.signerEmail, deadline: matter.deadline }, accountId);
  const collaborators = await client.presence(channel);
  return { channel, next: "signed-document-delivery", deadline: matter.deadline, collaborators } as const;
}
