# Tasks: Mobile Implementation

## Phase 1: Core Networking & State
- [x] 1.1 Create API endpoints config (`src/lib/api/endpoints.ts`)
- [x] 1.2 Create lightweight HTTP request client (`src/lib/api/client.ts`)
- [x] 1.3 Create reactive Auth Store (`src/lib/stores/auth.ts`)
- [x] 1.4 Create Call Store (`src/lib/stores/call.ts`)
- [x] 1.5 Create Chaplain Store (`src/lib/stores/chaplain.ts`)

## Phase 2: UI & Screen Implementation
- [x] 2.1 Build `LoginScreen.tsx` with elegant styling and role handling
- [x] 2.2 Build `BasicDashboard.tsx` with call trigger, waiting state, and thank you view
- [x] 2.3 Build `ChaplainDashboard.tsx` with Online/Offline toggle, live polling, and Report modal
- [x] 2.4 Build `LeaderDashboard.tsx` with team metrics and chaplain view
- [x] 2.5 Build `SuperuserDashboard.tsx` with user list and creation modal
- [x] 2.6 Build `CallRoomScreen.tsx` with LiveKit WebRTC media shell & controls

## Phase 3: Integration & App Navigation
- [x] 3.1 Update `App.tsx` with unified session provider and role router
- [x] 3.2 Update `HomeScreen.tsx` to link to backend call request flow
