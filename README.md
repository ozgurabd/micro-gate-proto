# Enterprise API Gateway

MicroGate is a high-performance, lightweight API Gateway built with Deno (TypeScript) and Go.

It acts as the central entry point for microservices, providing industrial-grade features like

Load Balancing, Circuit Breaking, and Distributed Tracing with minimal overhead.

## 🛠 Features

- L7 Load Balancing: Smart round-robin distribution across multiple service instances.
- Resilience (Circuit Breaker): Automated service isolation using a State Machine (Closed, Open, Half-Open) to prevent cascading failures.
- Observability:
- Distributed Tracing: Every request is tagged with a unique `X-Correlation-ID`.
- Real-time Metrics: Built-in dashboard for monitoring traffic, cache hits, and service health.
- Security: JWT validation with identity propagation via `X-User-ID` headers.
- Caching: High-speed response caching using Deno KV.
- Hot-Reload: Update your service registry (`routes.json`) without restarting the Gateway.

## 📂 Project Structure

```text
.
├── gateway/                # Deno Edge Gateway
│   ├── main.ts             # Gateway Core Logic
│   ├── main_test.ts        # Automated Unit Tests
│   ├── routes.json         # Service Registry (Dynamic)
│   └── Dockerfile          # Optimized Deno Image
├── services/               # Microservices (Go)
│   ├── payment/            # Payment Service Logic
│   └── product/            # Product Catalog Logic
├── .github/workflows/      # CI/CD Pipelines
└── docker-compose.yml      # Infrastructure Orchestration

```

## 🚀 Getting Started

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Deno Runtime](https://deno.com/) (For local testing)

### Execution

1. Clone & Enter:

```bash
git clone https://github.com/your-username/micro-gate.git
cd micro-gate

```

2. Spin up the Infrastructure:

```bash
docker-compose up --build

```

3. Access Points:

- Gateway: `http://localhost:3000`
- Health Dashboard: `http://localhost:3000/internal/status`

## ➕ Onboarding a New Service

To add a new microservice to the ecosystem:

1. Develop: Create your service and ensure it exposes a `/health` endpoint.
2. Containerize: Add a `Dockerfile` to your service folder.
3. Register: Update `gateway/routes.json`:

```json
{
  "name": "new-service",
  "prefix": "/api/v1/new",
  "targets": ["http://new-service-host:8080"],
  "auth_required": true
}
```

4. Orchestrate: Add the service to `docker-compose.yml` under the same network.

## 🧪 Testing & Quality Assurance

### Unit Testing

The Gateway logic is covered by isolated unit tests. To run them locally:

```bash
cd gateway
deno test --allow-net --allow-read main_test.ts

```

### Manual Verification

- Load Balancing: Repeatedly call `curl http://localhost:3000/api/payments` to see traffic rotate between instances.
- Circuit Breaker: Stop a service (`docker stop service_name`) and monitor the `/internal/status` to see the state transition to `OPEN`.

## 📈 Enterprise Scaling Roadmap

For production environments at scale, consider the following upgrades:

1. Global Cache: Migrate Deno KV to a Redis Cluster.
2. Monitoring: Export metrics to Prometheus and visualize with Grafana.
3. Security: Implement Mutual TLS (mTLS) between the Gateway and Microservices.
4. Deployment: Utilize Kubernetes (K8s) for auto-scaling based on the metrics provided by the Gateway.

## 🤖 CI/CD Integration

This project includes a GitHub Action workflow that:

1. Lints the TypeScript code.
2. Runs all unit tests.
3. Builds Docker images to ensure deployment readiness.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
