import { createServer } from "node:http";
import { openMatter } from "./matter_service.js";
import { InfraiClient, InfraiError } from "./infrai_client.js";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/matters") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(chunk as Buffer);
    const result = await openMatter(JSON.parse(Buffer.concat(chunks).toString("utf8")), new InfraiClient(), process.env.INFRAI_ACCOUNT_ID ?? "legal-demo");
    res.writeHead(201, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof InfraiError ? Math.min(Math.max(error.status, 400), 499) : 400;
    res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid request" }));
  }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("Matter service listening on port 3000"));
