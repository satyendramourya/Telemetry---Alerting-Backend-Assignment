# Telemetry Ingestion & Alerting System

A production-ready backend microservice for high-throughput **telemetry ingestion** and **real-time rule-based alerting**. Built with Node.js, Express, TypeScript, and MongoDB following strict 3-tier architecture principles.

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
