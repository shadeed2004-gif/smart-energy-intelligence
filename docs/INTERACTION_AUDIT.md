# Interaction Audit & State Machine Verification
**Project:** Smart Energy Intelligence Platform  
**Target:** User Interaction Integrity, Edge Cases, Safety Interlocks & Error Recovery

---

## 1. Scope of Interaction Audit
This audit verifies all state transitions, user-driven events, edge-case failure modes, and hardware control interactions across the platform.

---

## 2. Interactive Workflows & Verification

### 2.1 Device Actuation & Safety Interlocks
- **Action:** User toggles a switch on the dashboard or appliance detail view.
- **Interlock Rule:** If device has `is_safety_critical = true` (e.g., Refrigerator, Medical Equipment, Edge Gateway), direct shutoff requests are rejected by both frontend validation and backend FastAPI dependencies.
- **Status:** **Verified**. Attempting to turn off protected devices raises an explicit warning dialog and API error response without disrupting telemetry.

### 2.2 Anomaly Triage Lifecycle
- **Action:** Anomaly detected by baseline model -> Open state -> User clicks "Acknowledge" -> "Acknowledged" state -> User clicks "Resolve" -> "Resolved" state.
- **Audit Result:** **Verified**. The state progression immediately updates local UI chips and persists to SQLite database without requiring a full page refresh.

### 2.3 Automation Rule Construction
- **Action:** Create new rule via `AutomationPage` builder modal.
- **Validation:** Enforces non-empty name, target entity ID selection, and valid cron expression before enabling submission.
- **Audit Result:** **Verified**. Form inputs update dynamically, summarize the active trigger and target, and close cleanly upon creation.

### 2.4 Data Export Flow
- **Action:** Export telemetry as CSV from `AnalyticsPage`.
- **Handling:** Client dispatches query with active start and end date range, receives file stream blob, and triggers browser download without exposing raw backend filesystem paths.
- **Audit Result:** **Verified**.

### 2.5 Authentication Lifecycle
- **Login / Logout:** JWT tokens saved in `localStorage`, resolved per request through Axios interceptor.
- **Expired Token Handling:** Interceptor gracefully redirects to `/signin` upon receiving HTTP 401 Unauthorized from backend.
- **Audit Result:** **Verified**.
