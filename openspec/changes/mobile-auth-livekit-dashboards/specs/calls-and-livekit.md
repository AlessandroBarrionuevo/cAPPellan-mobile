# Spec: Calls and LiveKit Integration

## Requirements

### Requirement 1: Call Requesting (Basic User)
- **MUST** send `POST /calls/request` when tapping "Talk to a Chaplain Now".
- **MUST** display a graceful, non-technical notification when receiving `404` ("No chaplains available").
- **MUST** transition to waiting state and then to `CallRoomScreen` when a session is assigned.

### Requirement 2: Call Answering (Chaplain)
- **MUST** poll `GET /calls/assigned` every 4 seconds while status is `ONLINE`.
- **MUST** transition status to `IN_CALL` and open `CallRoomScreen` immediately upon receiving `200 OK`.
- **MUST** offer "End Call" (`POST /calls/{id}/end`) and then transition to `ReportFormScreen`.

### Requirement 3: LiveKit Call Room
- **MUST** support audio and video toggle controls.
- **MUST** show clear avatar placeholders when camera is disabled.
- **MUST** handle disconnect gracefully.
