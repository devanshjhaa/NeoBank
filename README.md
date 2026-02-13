# NeoBank

Closed-loop INR digital wallet system. Ledger-first accounting, idempotent transactions, distributed locking, event-driven processing.

## Structure

```
NeoBank/
backend/     Spring Boot 4 + Java 21
frontend/    (coming soon)
docs/        Project report, system design
```

## Quick Start

```bash
cd backend
docker compose up -d
./mvnw spring-boot:run
```

See [backend/README.md](backend/README.md) for full setup.
See [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md) for system design.
