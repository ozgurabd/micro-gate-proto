import { verify } from "https://deno.land/x/djwt/mod.ts";

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

interface ServiceInstance {
  url: string;
  isAlive: boolean;
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
}

interface ServiceGroup {
  name: string;
  prefix: string;
  auth_required: boolean;
  cache_enabled?: boolean;
  cache_ttl?: number;
  instances: ServiceInstance[];
  currentIndex: number;
}

// Global State
let serviceGroups: ServiceGroup[] = [];
const metrics = {
  totalRequests: 0,
  cacheHits: 0,
  errors: 0,
  startTime: Date.now(),
};
const kv = await Deno.openKv();
const JWT_SECRET_KEY = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("secret-key"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["verify"],
);

// Registry & Health Check
async function loadRegistry() {
  const data = await Deno.readTextFile("./routes.json");
  const json = JSON.parse(data);
  serviceGroups = json.services.map((s: any) => ({
    ...s,
    instances: s.targets.map((url: string) => ({
      url,
      isAlive: true,
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
    })),
    currentIndex: 0,
  }));
}

setInterval(async () => {
  for (const group of serviceGroups) {
    for (const inst of group.instances) {
      try {
        const res = await fetch(`${inst.url}/health`, {
          signal: AbortSignal.timeout(2000),
        });
        inst.isAlive = res.ok;
      } catch {
        inst.isAlive = false;
      }
    }
  }
}, 10000);

await loadRegistry();

Deno.serve({ port: 3000 }, async (req, info) => {
  const url = new URL(req.url);
  const correlationId =
    req.headers.get("x-correlation-id") || crypto.randomUUID();

  // Metrics & Internal Endpoints
  if (url.pathname === "/internal/status") {
    return new Response(
      JSON.stringify({ metrics, services: serviceGroups }, null, 2),
    );
  }

  metrics.totalRequests++;
  const group = serviceGroups.find((g) => url.pathname.startsWith(g.prefix));
  if (!group) return new Response("Not Found", { status: 404 });

  // Load Balancing (Round Robin)
  const healthy = group.instances.filter(
    (i) => i.isAlive && i.state !== CircuitState.OPEN,
  );
  if (healthy.length === 0)
    return new Response("Service Unavailable", { status: 503 });

  group.currentIndex = (group.currentIndex + 1) % healthy.length;
  const instance = healthy[group.currentIndex];

  // Proxy Logic
  try {
    const proxyHeaders = new Headers(req.headers);
    proxyHeaders.set("x-correlation-id", correlationId);

    const targetUrl = `${instance.url}${url.pathname.replace(group.prefix, "")}${url.search}`;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: proxyHeaders,
      body: req.body,
    });

    instance.failureCount = 0;
    instance.state = CircuitState.CLOSED;
    return response;
  } catch (err) {
    metrics.errors++;
    instance.failureCount++;
    if (instance.failureCount > 3) instance.state = CircuitState.OPEN;
    return new Response("Gateway Error", { status: 502 });
  }
});
