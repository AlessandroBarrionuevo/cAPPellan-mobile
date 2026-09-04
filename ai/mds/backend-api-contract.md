# CapellanAPP — Backend API Contract (Frontend Agent Reference)

> **Target audience**: frontend agent building the web/mobile client.
> **Last updated**: 2026-08-01
> **Base URL**: `http://localhost:8080` (dev) / TBD (production)

---

## 1. Architecture Overview

```
┌──────────────────────┐       REST (JSON)        ┌──────────────────────┐
│   Frontend Client    │ ◄──────────────────────► │   Spring Boot 4.1    │
│   (Web / Mobile)     │                           │   Java 21 Backend    │
│                      │                           │                      │
│                      │                           │  ┌────────────────┐  │
│                      │                           │  │ CallService    │  │
│                      │                           │  │ ChaplainState  │  │
│                      │                           │  │ ReportService  │  │
│                      │                           │  └───────┬────────┘  │
│                      │                           │          │            │
│                      │                           │  ┌───────▼────────┐  │
│                      │                           │  │ LiveKit SDK    │  │
│                      │                           │  │ RoomService    │  │
│                      │                           │  │ TokenService   │  │
│                      │                           │  └───────┬────────┘  │
│                      │                           └──────────┼───────────┘
│                      │                                      │ REST API
│                      │                           ┌──────────▼───────────┐
│                      │       WebRTC (audio/video) │   LiveKit Server     │
│                      │ ◄────────────────────────► │   (Docker / VPS)     │
└──────────────────────┘                           └──────────────────────┘
```

- The **backend** is the *control plane*: creates rooms, generates tokens, manages sessions.
- The **frontend** uses the token to connect directly to **LiveKit Server** via WebRTC.
- The backend does NOT participate in media streaming.

---

## 2. Authentication

All endpoints except `POST /auth/login` and `OPTIONS` preflight require authentication.

### How it works

1. Client calls `POST /auth/login` with username + password → receives a **session token** (opaque string).
2. For every subsequent request, include the token in the `Authorization` header:

```
Authorization: <token>
```

3. The backend validates the token, computes `userId` + `userRole`, and injects them as request attributes. Controllers then enforce role-based access.

### Token behavior

- In-memory store (lost on server restart — client must re-login).
- If the user's role changes in the DB while the token is active, the token is invalidated (401 — re-login required).

---

## 3. API Endpoints

### 3.1 Auth

#### `POST /auth/login`

Authenticate and receive a session token.

**Request Body** (JSON):
```json
{
  "username": "john",
  "password": "secret"
}
```

**Response** `200 OK`:
```json
{
  "token": "a1b2c3d4-e5f6-...",
  "role": "BASIC"
}
```

**Errors**:
| Status | Body | When |
|--------|------|------|
| 400 | `{"error": "..."}` | Username/password missing |
| 401 | `{"error": "Invalid credentials"}` | Wrong credentials |
| 500 | `{"error": "Internal server error"}` | Unexpected failure |

---

### 3.2 Calls (Core Flow)

#### `POST /calls/request`

> **Role required**: `BASIC`

A BASIC user requests a call. The backend:
1. Finds the oldest ONLINE chaplain (FIFO queue).
2. Creates a LiveKit room.
3. Generates a LiveKit access token for the caller.
4. Creates a `Session` (status: `WAITING`).
5. Sets the chaplain's status to `IN_CALL`.

**Request Body**: none

**Response** `200 OK`:
```json
{
  "sessionId": 42,
  "livekitRoomName": "call-550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

The `token` field is a **LiveKit JWT** — use it to connect to the LiveKit Server (see §4).

**Errors**:
| Status | Body | When |
|--------|------|------|
| 401 | `{"error": "Missing Authorization header"}` | No token in header |
| 403 | `{"error": "Only BASIC users can request calls"}` | Wrong role |
| 404 | `{"error": "No chaplains available"}` | No ONLINE chaplain |

---

#### `GET /calls/assigned`

> **Role required**: `CHAPLAIN` or `CHAPLAIN_LEADER`

A chaplain polls for a call assigned to them. If a `WAITING` session exists for this chaplain, it transitions to `IN_PROGRESS` and returns a LiveKit token.

**Request Body**: none

**Response** `200 OK` (call assigned):
```json
{
  "sessionId": 42,
  "livekitRoomName": "call-550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** `204 No Content` (no pending calls — poll again later).

**Errors**:
| Status | Body | When |
|--------|------|------|
| 401 | `{"error": "Missing Authorization header"}` | No token |
| 403 | `{"error": "Only chaplains can poll for assigned calls"}` | Wrong role |
| 403 | `{"error": "You can only poll your own assigned calls"}` | Polling for another chaplain |

> **Frontend polling strategy**: call this endpoint every 3–5 seconds when the chaplain is ONLINE. Stop polling once a call is received (`200`), and resume when the chaplain returns to ONLINE after ending a call.

---

#### `POST /calls/{id}/end`

> **Role required**: attending chaplain or `SUPERUSER`

Ends a call session. Sets session status to `ENDED` and returns the chaplain to `ONLINE`.

**Request Body**: none

**Response** `200 OK`:
```json
{
  "id": 42,
  "livekitRoomName": "call-550e8400-...",
  "status": "ENDED",
  "userId": 10,
  "chaplainId": 5,
  "createdAt": "2026-08-01T14:30:00Z",
  "updatedAt": "2026-08-01T14:45:00Z",
  "endedAt": "2026-08-01T14:45:00Z"
}
```

**Errors**:
| Status | Body | When |
|--------|------|------|
| 403 | `{"error": "Only the attending chaplain or SUPERUSER can end calls"}` | Unauthorized |
| 409 | `{"error": "Session is already ended"}` | Already ended |

---

#### `GET /calls/{id}`

> **Role required**: participants (BASIC user or chaplain in the session) or `SUPERUSER`

Retrieves session details.

**Request Body**: none

**Response** `200 OK`:
```json
{
  "id": 42,
  "livekitRoomName": "call-550e8400-...",
  "status": "IN_PROGRESS",
  "userId": 10,
  "chaplainId": 5,
  "createdAt": "2026-08-01T14:30:00Z",
  "updatedAt": "2026-08-01T14:31:00Z",
  "endedAt": null
}
```

---

### 3.3 Chaplain Status

#### `POST /chaplains/{id}/status`

> **Role required**: `CHAPLAIN` or `CHAPLAIN_LEADER` (must match `{id}`)

Updates the chaplain's availability. The `IN_CALL` status cannot be set manually — the system manages it during call assignment.

**Request Body** (JSON):
```json
{
  "status": "ONLINE"
}
```

Accepted values: `"ONLINE"`, `"OFFLINE"`.

**Response** `200 OK`:
```json
{
  "id": 5,
  "username": "chaplain_jane",
  "role": "CHAPLAIN",
  "status": "ONLINE",
  "userId": null,
  "enteredQueueAt": "2026-08-01T14:30:00Z"
}
```

**Errors**:
| Status | Body | When |
|--------|------|------|
| 400 | `{"error": "Status is required"}` | Missing body |
| 400 | `{"error": "Cannot set status to IN_CALL directly"}` | Trying to set `IN_CALL` |
| 400 | `{"error": "Invalid status: ..."}` | Unknown status string |

> **Frontend flow**: after login, the chaplain client should call this to go ONLINE. When logging out or going off-duty, call it with `OFFLINE`.

---

### 3.4 Reports

#### `POST /calls/{id}/report`

> **Role required**: attending chaplain of the session

Submits a post-call report for an ENDED session.

**Request Body** (JSON):
```json
{
  "subject": "Spiritual guidance session",
  "category": "SPIRITUAL",
  "severity": 3,
  "summary": "User expressed concerns about..."
}
```

`category` enum: `SPIRITUAL`, `FAMILY`, `PERSONAL`, `CRISIS`, `OTHER`.
`severity`: integer (1–5, where 5 is most critical).

**Response** `201 Created`:
```json
{
  "id": 99,
  "sessionId": 42,
  "subject": "Spiritual guidance session",
  "category": "SPIRITUAL",
  "severity": 3,
  "summary": "User expressed concerns about...",
  "createdBy": 5,
  "createdAt": "2026-08-01T14:50:00Z"
}
```

---

#### `GET /calls/{id}/report`

> **Role required**: session participants or `SUPERUSER`

Retrieves a previously submitted report.

**Response** `200 OK`:
```json
{
  "id": 99,
  "sessionId": 42,
  "subject": "Spiritual guidance session",
  "category": "SPIRITUAL",
  "severity": 3,
  "summary": "User expressed concerns about...",
  "createdBy": 5,
  "createdAt": "2026-08-01T14:50:00Z"
}
```

**Errors**:
| Status | Body | When |
|--------|------|------|
| 404 | `{"error": "Report not found"}` | No report for this session |
| 403 | `{"error": "..."}` | Unauthorized to view |

---

### 3.5 User Management (SUPERUSER only)

These endpoints are for admin purposes and typically not needed by the main client. Listed here for completeness.

#### `POST /users` — create user

```json
// Request
{
  "username": "newuser",
  "password": "secret",
  "role": "CHAPLAIN",
  "userId": null
}
```

#### `GET /users?role=CHAPLAIN` — list users (optional role filter)

```json
// Response
[
  {
    "id": 1,
    "username": "admin",
    "role": "SUPERUSER",
    "status": "ONLINE",
    "userId": null,
    "enteredQueueAt": null
  }
]
```

#### `PATCH /users/{id}` — update role or leader assignment

```json
// Request
{
  "role": "CHAPLAIN_LEADER",
  "userId": null
}
```

---

## 4. LiveKit Client Integration

### 4.1 How to use the token

When you receive a `CallResponse` from `POST /calls/request` or `GET /calls/assigned`, the `token` field is a signed JWT for the **LiveKit Server** (NOT the backend).

Use this token with the **LiveKit Client SDK** to connect:

```javascript
// Example: LiveKit Client SDK for JavaScript/TypeScript
import { Room, connect } from 'livekit-client';

const room = new Room();
await room.connect(
  'ws://localhost:7880',        // LiveKit WebSocket URL (or wss:// for production)
  response.token,               // The JWT from the backend
  { autoSubscribe: true }
);
```

### 4.2 LiveKit Server connection details

The LiveKit server URL is NOT returned by the backend API. The frontend must know it via environment config:

| Environment | LiveKit URL (WebSocket) | LiveKit URL (HTTP) |
|------------|------------------------|-------------------|
| Dev (local) | `ws://localhost:7880` | `http://localhost:7880` |
| Production | `wss://<vps-ip-or-domain>:7880` | `https://<vps-ip-or-domain>:7880` |

The backend uses the HTTP URL internally (for `RoomServiceClient`), but the frontend uses the **WebSocket URL** for real-time media.

### 4.3 Token structure

The JWT generated by the backend includes:
- **identity**: the user's database ID (stringified)
- **room**: the `livekitRoomName` (e.g. `"call-550e8400-..."`)
- **grants**: `roomJoin`, `canPublish` (camera + microphone), `canSubscribe`

The frontend does not need to parse or modify the token — just pass it as-is to the LiveKit Client SDK.

---

## 5. Call Flow (End-to-End)

### 5.1 BASIC User Requests a Call

```
BASIC Client                         Backend                          Chaplain Client
     │                                  │                                    │
     │  1. POST /calls/request          │                                    │
     │ ─────────────────────────────►   │                                    │
     │                                  │  2. Find oldest ONLINE chaplain    │
     │                                  │  3. Create LiveKit room            │
     │                                  │  4. Generate LiveKit token         │
     │                                  │  5. Set chaplain → IN_CALL         │
     │                                  │                                    │
     │  6. { sessionId, roomName, token }                                   │
     │ ◄─────────────────────────────   │                                    │
     │                                  │                                    │
     │  7. Connect to LiveKit Server with token                             │
     │ ═══════════════════════════════════════════════════════════════════►  │
     │                                  │                                    │
     │                                  │    8. GET /calls/assigned (poll)   │
     │                                  │ ◄───────────────────────────────   │
     │                                  │                                    │
     │                                  │    9. { sessionId, roomName, token }
     │                                  │ ───────────────────────────────►   │
     │                                  │                                    │
     │                                  │  10. Connect to LiveKit with token │
     │                                  │ ════════════════════════════════►  │
     │                                  │                                    │
     │  ◄════ WebRTC audio/video ════════════════════════════════════════►  │
```

### 5.2 Ending a Call

```
Chaplain Client                       Backend
     │                                    │
     │  1. POST /calls/{id}/end           │
     │ ───────────────────────────────►   │
     │                                    │  2. Session → ENDED
     │                                    │  3. Chaplain → ONLINE
     │                                    │  4. Re-enters queue
     │                                    │
     │  5. { session details }            │
     │ ◄───────────────────────────────   │
     │                                    │
     │  6. Disconnect from LiveKit room   │
     │  7. POST /chaplains/{id}/status    │
     │     { "status": "ONLINE" }         │
     │ ───────────────────────────────►   │
```

---

## 6. Error Response Format

All errors follow the same JSON structure:

```json
{
  "error": "Human-readable message"
}
```

Exception → HTTP status mapping:

| Exception | HTTP Status |
|-----------|-------------|
| `TokenValidationException` | 401 Unauthorized |
| `UnauthorizedException` | 403 Forbidden |
| `NoChaplainAvailableException` | 404 Not Found |
| `SessionConflictException` | 409 Conflict |
| `IllegalArgumentException` (generic) | 400 Bad Request |
| `IllegalArgumentException` ("User not found" / "Report not found") | 404 Not Found |
| `RuntimeException` (unexpected) | 500 Internal Server Error |

---

## 7. Role Matrix

| Endpoint | BASIC | CHAPLAIN | CHAPLAIN_LEADER | SUPERUSER |
|----------|-------|----------|-----------------|-----------|
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ |
| `POST /calls/request` | ✅ | ❌ | ❌ | ❌ |
| `GET /calls/assigned` | ❌ | ✅ | ✅ | ❌ |
| `GET /calls/{id}` | ✅* | ✅* | ✅* | ✅ |
| `POST /calls/{id}/end` | ❌ | ✅* | ✅* | ✅ |
| `POST /chaplains/{id}/status` | ❌ | ✅† | ✅† | ❌ |
| `POST /calls/{id}/report` | ❌ | ✅* | ✅* | ❌ |
| `GET /calls/{id}/report` | ✅* | ✅* | ✅* | ✅ |
| `POST /users` | ❌ | ❌ | ❌ | ✅ |
| `GET /users` | ❌ | ❌ | ❌ | ✅ |
| `PATCH /users/{id}` | ❌ | ❌ | ❌ | ✅ |

- `✅*` = participant only (user must be the BASIC user or chaplain assigned to the session)
- `✅†` = self only (`{id}` must match authenticated user ID)

---

## 8. Session Status Lifecycle

```
WAITING ──► IN_PROGRESS ──► ENDED
   │                            │
   │  Call requested by BASIC   │  Chaplain ends call
   │  Chaplain assigned (FIFO)  │  (POST /calls/{id}/end)
   │                            │
   └────────────────────────────┘
```

The frontend should handle these states:
- `WAITING`: BASIC user is waiting; chaplain sees this as pollable.
- `IN_PROGRESS`: both parties connected; audio/video active.
- `ENDED`: call finished; report can be submitted.
