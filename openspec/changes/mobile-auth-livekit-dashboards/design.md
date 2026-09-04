# Design: Mobile Architecture & Screen Flow

## 1. Sequence Diagram: Call Flow

```mermaid
sequenceDiagram
    autonumber
    actor Basic as Basic User (Mobile)
    actor Chaplain as Chaplain (Mobile/Web)
    participant Backend as Spring Boot API
    participant LiveKit as LiveKit Server

    Chaplain->>Backend: POST /chaplains/{id}/status {status: "ONLINE"}
    loop Every 4s
        Chaplain->>Backend: GET /calls/assigned
    end

    Basic->>Backend: POST /calls/request
    Backend-->>Basic: 200 OK {sessionId, livekitRoomName, token}
    Note over Basic: Transitions to WAITING / CALL_ROOM

    Chaplain->>Backend: GET /calls/assigned
    Backend-->>Chaplain: 200 OK {sessionId, livekitRoomName, token}
    Note over Chaplain: Transitions to IN_CALL / CALL_ROOM

    par Connect to Media
        Basic->>LiveKit: Connect(wsUrl, token)
        Chaplain->>LiveKit: Connect(wsUrl, token)
    end

    Note over Basic,Chaplain: Live 1:1 Audio/Video Call

    Chaplain->>Backend: POST /calls/{id}/end
    Backend-->>Chaplain: 200 OK (Ended)
    Chaplain->>LiveKit: Disconnect()
    Basic->>LiveKit: Disconnect()

    Note over Basic: Shows Thank You screen
    Note over Chaplain: Shows Report Form (POST /calls/{id}/report)
```

## 2. State Management Architecture
A lightweight, high-performance in-memory store is used for state synchronization:
- `authStore`: User identity (`userId`, `username`, `role`), opaque session token, login/logout actions.
- `callStore`: Active session metadata (`sessionId`, `livekitRoomName`, `token`), call status (`IDLE`, `REQUESTING`, `WAITING`, `IN_PROGRESS`, `ENDED`), error handling (including friendly 404 chaplain unavailable state).
- `chaplainStore`: Chaplain duty status (`ONLINE`, `OFFLINE`, `IN_CALL`), assigned call polling state.
