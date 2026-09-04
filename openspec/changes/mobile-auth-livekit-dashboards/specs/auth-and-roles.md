# Spec: Mobile Authentication and Role Authorization

## Requirements

### Requirement 1: Login Process
- **MUST** send username and password via `POST /auth/login`.
- **MUST** store the returned token and fetch `GET /auth/me` to get the authenticated user profile.
- **MUST** clear auth state and redirect to Login whenever a `401 Unauthorized` response is received.

### Requirement 2: Role Dashboard Routing
- **Scenario: BASIC user logs in**
  - **Given** a user with role `BASIC` logs in successfully
  - **When** the dashboard renders
  - **Then** the application MUST display the `BasicDashboard` with call request capabilities.

- **Scenario: CHAPLAIN logs in**
  - **Given** a user with role `CHAPLAIN` logs in successfully
  - **When** the dashboard renders
  - **Then** the application MUST display the `ChaplainDashboard` with the ONLINE/OFFLINE toggle and call polling.

- **Scenario: CHAPLAIN_LEADER logs in**
  - **Given** a user with role `CHAPLAIN_LEADER` logs in
  - **When** the dashboard renders
  - **Then** the application MUST display the leader dashboard with team metrics and chaplain features.

- **Scenario: SUPERUSER logs in**
  - **Given** a user with role `SUPERUSER` logs in
  - **When** the dashboard renders
  - **Then** the application MUST display the admin dashboard with user management.
