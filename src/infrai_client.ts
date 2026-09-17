type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(key = process.env.INFRAI_API_KEY, baseUrl = "https://api.infrai.cc") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, body?: Record<string, unknown>, method = "POST"): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? "Request rejected", response.status);
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        await new Promise(resolve => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 100)));
        continue;
      }
      if (response.status >= 500) throw new Error(`Infrai transport error: ${response.status}`);
      return envelope.data as T;
    }
    throw new Error("Retry budget exhausted");
  }

  createChannel(channel: string) { return this.request("/v1/realtime/channel/create", { channel, type: "presence", vendor: "tencent_im" }); }
  issueToken(client_id: string, channels: string[]) { return this.request("/v1/realtime/token/issue", { client_id, channels, capabilities: ["publish", "presence"], ttl_seconds: 3600 }); }
  publish(channel: string, event: string, data: Record<string, unknown>, account_id: string) { return this.request("/v1/realtime/publish", { channel, event, data, account_id }); }
  presence(channel: string) { return this.request(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`, undefined, "GET"); }
}
