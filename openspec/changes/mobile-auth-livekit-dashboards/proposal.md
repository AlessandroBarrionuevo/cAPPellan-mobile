# Proposal: Mobile Authentication, Role Dashboards & LiveKit Call Integration

## Why
The mobile application currently has static visual screens without real backend interaction. We need to:
1. Allow users to log in (`POST /auth/login`) and authenticate their role.
2. Route users to their dedicated dashboard based on role (`BASIC`, `CHAPLAIN`, `CHAPLAIN_LEADER`, `SUPERUSER`).
3. Connect the "Talk to a Chaplain Now" button in `HomeScreen` / `BasicDashboard` to the backend (`POST /calls/request`).
4. Implement the chaplain flow: Online/Offline status switch, polling `/calls/assigned`, attending calls, and post-call reports.
5. Provide the LiveKit WebRTC call room view.

## What Changes
- Add API client and stores (`src/lib/api/client.ts`, `src/lib/api/endpoints.ts`, `src/lib/stores/auth.ts`, `src/lib/stores/call.ts`, `src/lib/stores/chaplain.ts`).
- Add Login screen (`src/screens/LoginScreen.tsx`).
- Add role-based dashboards:
  - `BasicDashboard.tsx` (Call requesting, Waiting Room, Thank you)
  - `ChaplainDashboard.tsx` (Availability toggle, incoming call listener, post-call reporting)
  - `LeaderDashboard.tsx` (Team status overview + chaplain capabilities)
  - `SuperuserDashboard.tsx` (User management & platform stats)
  - `CallRoomScreen.tsx` (LiveKit video/audio conference shell with controls)
- Update `App.tsx` and `HomeScreen.tsx` to handle authentication lifecycle and unified layout.

## Rollback Plan
All changes reside in `src/` modules and can be cleanly rolled back or modified without disrupting Expo configurations.
