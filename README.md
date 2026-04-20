# Telemetry Ingestion & Alerting System

A production-ready backend microservice for high-throughput **telemetry ingestion** and **real-time rule-based alerting**. Built with Node.js, Express, TypeScript, and MongoDB following strict 3-tier architecture principles.

---

## ✅ Implementation Checklist

### Core Requirements

| # | Requirement | Status |
|---|---|---|
| 1 | `POST /api/v1/telemetry` — ingest telemetry with payload validation | ✅ Done |
| 2 | Idempotency via compound unique index `{deviceId, sourceId, timestamp}` | ✅ Done |
| 3 | Time-series schema with write-optimized MongoDB indexes | ✅ Done |
| 4 | Rule-based alert engine (`metricA > 100`, `metricB < 50`, `metricC = 0 × 3`) | ✅ Done |
| 5 | Alert lifecycle: `OPEN` → `ACKNOWLEDGED` → `RESOLVED` via `PATCH` endpoint | ✅ Done |
| 6 | Prevent duplicate `OPEN` alerts via partial unique index | ✅ Done |
| 7 | `GET /devices/:id/latest` — latest reading per device | ✅ Done |
| 8 | `GET /devices/:id/history?from=&to=` — time-range query with date validation | ✅ Done |
| 9 | `GET /alerts?status=&severity=` — filtered, paginated alerts via `$facet` aggregation | ✅ Done |
| 10 | Strict Controller → Service → Repository separation | ✅ Done |
| 11 | Centralized error handling middleware | ✅ Done |
| 12 | Environment-based configuration (`.env` + `env.ts`) | ✅ Done |
| 13 | Structured logging with **Pino** across all layers | ✅ Done |

### Bonus Features

| # | Bonus | Status |
|---|---|---|
| B1 | **Bulk insert** — `POST /api/v1/telemetry/bulk` with `insertMany ordered:false`, per-item validation, 500-item cap | ✅ Done |
| B2 | **Graceful shutdown** — `SIGTERM`/`SIGINT` drain HTTP + MongoDB, 30s force-kill safety net | ✅ Done |
| B3 | **In-memory rule engine abstraction** — pluggable `RuleEngine` class with typed `Rule` interface and chainable `register()` | ✅ Done |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Language | TypeScript |
| Database | MongoDB (Mongoose) |
| Logging | Pino (structured JSON) |
| Dev Server | ts-node-dev |

---

## 🏗 Architecture

The system enforces a **strict 3-tier separation** across every domain module:

```
Controller  →  Service  →  Repository  →  MongoDB
```

- **Controllers** — HTTP concerns only: parse request, validate inputs, return responses, delegate to `next(error)`.
- **Services** — Pure business logic: rule evaluation, alert orchestration, idempotency gating.
- **Repositories** — All Mongoose queries isolated here. Services never touch the ORM directly.

### Folder Structure

```
src/
├── app.ts                        # Express app setup, middleware registration
├── server.ts                     # Entrypoint: DB connect + server listen
├── common/
│   ├── constants/
│   │   └── enums.ts              # AlertStatus, AlertSeverity enums
│   ├── middleware/
│   │   ├── error.middleware.ts   # Centralized error handler
│   │   └── validate.middleware.ts # Request payload validation
│   └── utils/
│       └── logger.ts             # Pino structured logger
├── config/
│   └── db.ts                     # MongoDB connection + index sync
├── modules/
│   ├── telemetry/                # Ingestion domain (Controller/Service/Repo/Model/Types)
│   ├── alerts/                   # Alerts domain (Controller/Service/Repo/Model/Types)
│   └── rules/
│       └── rule.engine.ts        # Stateless + stateful rule evaluator
└── routes/
    └── index.ts                  # Central route registry
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js ≥ 18
- A MongoDB Atlas cluster (or local MongoDB)

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/telemetry?retryWrites=true&w=majority
```

### Running Locally

```bash
npm run dev
```

The server starts on `http://localhost:3000`.

---

## 📡 API Reference

### Base URL

```
http://localhost:3000/api/v1
```

---

### 1️⃣ Ingest Telemetry

Ingests a telemetry reading, evaluates alert rules, and auto-generates alerts if thresholds are breached.

**`POST /api/v1/telemetry`**

#### Request Body

```json
{
  "deviceId": "DEV-1001",
  "sourceId": "SRC-21",
  "timestamp": "2026-04-20T10:05:00Z",
  "readings": {
    "metricA": 120,
    "metricB": 60,
    "metricC": 1
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `deviceId` | string | ✅ | Unique device identifier |
| `sourceId` | string | ✅ | Source sensor identifier |
| `timestamp` | ISO 8601 string | ✅ | Event timestamp (used for idempotency) |
| `readings.metricA` | number | ❌ | Metric value A |
| `readings.metricB` | number | ❌ | Metric value B |
| `readings.metricC` | number | ❌ | Metric value C |

#### Response — `201 Created` (new telemetry stored)

```json
{
  "success": true
}
```

#### Response — `201 Created` (duplicate request, idempotent)

When the same `deviceId + sourceId + timestamp` combination is sent again, the system silently ignores it and returns:

```json
{
  "success": true,
  "message": "Duplicate telemetry ignored"
}
```

#### Response — `400 Bad Request` (validation failure)

```json
{
  "success": false,
  "message": "Invalid or missing deviceId"
}
```

---

### 2️⃣ Get Latest Telemetry for a Device

Returns the most recent telemetry reading for a given device.

**`GET /api/v1/devices/:id/latest`**

#### URL Parameters

| Parameter | Description |
|---|---|
| `id` | The `deviceId` (e.g. `DEV-1001`) |

#### Example Request

```
GET /api/v1/devices/DEV-1001/latest
```

#### Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "661e1b2fa3c1234567890abc",
    "deviceId": "DEV-1001",
    "sourceId": "SRC-21",
    "timestamp": "2026-04-20T10:05:00.000Z",
    "readings": {
      "metricA": 120,
      "metricB": 60,
      "metricC": 1
    },
    "createdAt": "2026-04-20T06:28:27.748Z",
    "updatedAt": "2026-04-20T06:28:27.748Z"
  }
}
```

#### Response — `404 Not Found`

```json
{
  "success": false,
  "message": "Not found"
}
```

---

### 3️⃣ Get Telemetry History for a Device

Returns telemetry readings for a device within a specified time range.

**`GET /api/v1/devices/:id/history?from=&to=`**

#### URL Parameters

| Parameter | Description |
|---|---|
| `id` | The `deviceId` |

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `from` | ISO 8601 string | ✅ | Start of the time window |
| `to` | ISO 8601 string | ✅ | End of the time window |

#### Example Request

```
GET /api/v1/devices/DEV-1001/history?from=2026-04-20T00:00:00Z&to=2026-04-20T23:59:59Z
```

#### Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "661e1b2fa3c1234567890abc",
      "deviceId": "DEV-1001",
      "sourceId": "SRC-21",
      "timestamp": "2026-04-20T10:05:00.000Z",
      "readings": {
        "metricA": 120,
        "metricB": 60,
        "metricC": 1
      }
    }
  ]
}
```

#### Response — `400 Bad Request` (missing or malformed dates)

```json
{
  "success": false,
  "message": "Missing 'from' or 'to' query parameters"
}
```

---

### 4️⃣ Get Alerts

Fetches alerts with optional filtering by status and severity. Supports pagination. Uses MongoDB `$facet` aggregation for concurrent data + total count retrieval.

**`GET /api/v1/alerts`**

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | string | ❌ | Filter by status: `OPEN`, `ACKNOWLEDGED`, `RESOLVED` |
| `severity` | string | ❌ | Filter by severity: `WARNING`, `CRITICAL` |
| `page` | number | ❌ | Page number (default: `1`) |
| `limit` | number | ❌ | Results per page (default: `10`) |

#### Example Request

```
GET /api/v1/alerts?status=OPEN
```

#### Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "totalCount": 1,
    "data": [
      {
        "_id": "69e5c78bf3ba9bcd86fa3d7a",
        "deviceId": "DEV-1001",
        "rule": "metricA_high",
        "severity": "WARNING",
        "status": "OPEN",
        "createdAt": "2026-04-20T06:28:27.748Z",
        "updatedAt": "2026-04-20T06:28:27.748Z",
        "__v": 0
      }
    ],
    "limit": 10,
    "skip": 0
  }
}
```

---

### 5️⃣ Update Alert Status (Lifecycle Management)

Transitions an alert through its lifecycle: `OPEN` → `ACKNOWLEDGED` → `RESOLVED`.

**`PATCH /api/v1/alerts/:id/status`**

#### URL Parameters

| Parameter | Description |
|---|---|
| `id` | The MongoDB `_id` of the alert |

#### Request Body

```json
{
  "status": "ACKNOWLEDGED"
}
```

| Value | Description |
|---|---|
| `OPEN` | Alert is active and unacknowledged |
| `ACKNOWLEDGED` | Alert has been seen and is being acted on |
| `RESOLVED` | Alert condition is no longer active |

#### Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "69e5c78bf3ba9bcd86fa3d7a",
    "deviceId": "DEV-1001",
    "rule": "metricA_high",
    "severity": "WARNING",
    "status": "ACKNOWLEDGED",
    "createdAt": "2026-04-20T06:28:27.748Z",
    "updatedAt": "2026-04-20T06:45:10.123Z"
  }
}
```

#### Response — `404 Not Found`

```json
{
  "success": false,
  "message": "Alert not found"
}
```

---

## 🚨 Rule Engine

Rules are evaluated automatically on every telemetry ingestion inside `src/modules/rules/rule.engine.ts`.

| Rule | Condition | Severity |
|---|---|---|
| `metricA_high` | `metricA > 100` | `WARNING` |
| `metricB_low` | `metricB < 50` | `CRITICAL` |
| `device_offline` | `metricC === 0` for **3 consecutive readings** | `CRITICAL` |

### Pluggable Rule Engine Abstraction *(Bonus)*

The engine is implemented as an **in-memory class** with a typed `Rule` interface, making it trivial to add or remove rules without touching ingestion logic:

```typescript
interface Rule {
  name: string;
  severity: AlertSeverity;
  evaluate: (telemetry: any, history: any[]) => boolean;
}

class RuleEngine {
  register(rule: Rule): this { ... }  // chainable — duplicate names are replaced
  evaluate(telemetry, history): INewAlert[] { ... }
}

// Adding a new rule requires zero changes to the service or controller:
ruleEngine.register({
  name: "metricA_critical",
  severity: AlertSeverity.CRITICAL,
  evaluate: (t) => t.readings?.metricA > 200,
});
```

A singleton `ruleEngine` instance is exported and shared across the codebase. Rules are registered once at module load time.

### Idempotent Alert Creation

A **Partial Unique Index** on `{ deviceId, rule, status }` (filtered to `status: OPEN`) ensures that a device can never accumulate duplicate active alerts for the same rule. Once resolved, a new `OPEN` alert can be generated on the next breach.

---

## 📊 MongoDB Indexing Strategy

### Telemetry Collection

```typescript
// Idempotency: prevents duplicate ingestion
{ deviceId: 1, sourceId: 1, timestamp: 1 }  →  unique: true

// Read optimization: getLatest() and getHistory() queries
{ deviceId: 1, timestamp: -1 }
```

### Alerts Collection

```typescript
// Prevents duplicate OPEN alerts per device per rule
{ deviceId: 1, rule: 1, status: 1 }  →  unique: true, partialFilterExpression: { status: "OPEN" }

// Read optimization: GET /alerts?status=&severity= queries
{ status: 1, severity: 1, createdAt: -1 }
```

---

## 🚀 Bonus Features

### 1. Bulk Insert Optimization

A dedicated endpoint accepts up to **500 telemetry readings in a single request**, using `insertMany` with `ordered: false` for maximum write throughput. A duplicate key error on one document never aborts the rest of the batch.

**`POST /api/v1/telemetry/bulk`**

#### Request Body

```json
[
  {
    "deviceId": "DEV-2001",
    "sourceId": "SRC-01",
    "timestamp": "2026-04-20T08:00:00Z",
    "readings": { "metricA": 120, "metricB": 60, "metricC": 0 }
  },
  {
    "deviceId": "DEV-2001",
    "sourceId": "SRC-01",
    "timestamp": "2026-04-20T09:00:00Z",
    "readings": { "metricA": 90, "metricB": 60, "metricC": 0 }
  }
]
```

#### Response — `201 Created`

```json
{
  "success": true,
  "inserted": 2,
  "duplicatesSkipped": 0,
  "alertsGenerated": 0
}
```

#### Behaviour

| Scenario | Result |
|---|---|
| All new documents | `inserted = N`, `duplicatesSkipped = 0` |
| All duplicates | `inserted = 0`, `duplicatesSkipped = N` |
| Mixed batch | Only new docs inserted, duplicates counted silently |
| Empty array | `400 Bad Request` |
| Array > 500 items | `400 Bad Request — Bulk limit exceeded` |
| Item with missing field | `400 Bad Request — Item[i]: invalid or missing <field>` |

After insert, the rule engine runs **per unique deviceId** in the batch (not per document), minimising DB round-trips.

---

### 2. Graceful Shutdown

The server handles `SIGTERM` (Kubernetes/Docker) and `SIGINT` (Ctrl+C) with a clean drain sequence:

```
1. server.close()         → stops accepting new HTTP connections
2. mongoose.close()       → flushes pending writes, closes DB pool
3. process.exit(0)        → clean exit
4. setTimeout 30s         → force-kill safety net if drain hangs
```

Unhandled promise rejections are also caught and logged before triggering shutdown:

```json
{ "signal": "SIGINT", "msg": "Shutdown signal received — draining connections..." }
{ "msg": "MongoDB connection closed gracefully" }
{ "msg": "Shutdown complete. Goodbye 👋" }
```

---

### 3. In-Memory Rule Engine Abstraction

See the [Rule Engine section](#-rule-engine) above for the full class design.

---

## 📸 Postman Screenshots

**POST /api/v1/telemetry — New ingestion (201 Created)**

The first request stores the telemetry and evaluates alert rules.

![POST telemetry - new ingestion](./postman-results-screenshot/Screenshot%202026-04-20%20115842.png)

---

**POST /api/v1/telemetry — Duplicate request (Idempotent 201)**

Re-sending the same payload is handled gracefully without creating a duplicate document.

![POST telemetry - duplicate](./postman-results-screenshot/Screenshot%202026-04-20%20115931.png)

---

**GET /api/v1/alerts?status=OPEN — Alert listing with filter (200 OK)**

Alerts auto-generated during ingestion are retrievable with status and severity filters via aggregation pipeline.

![GET alerts - filtered](./postman-results-screenshot/Screenshot%202026-04-20%20120117.png)
