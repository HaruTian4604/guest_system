# GCIMS — Gloucestershire County Immigration Management System

> **One-line summary:** A secure, full-stack web application that modernises refugee resettlement operations for Gloucestershire County Council by replacing error-prone spreadsheets with a GDPR-aware, auditable, user-centred platform.

---

## 1) Project Overview & Problem Statement
**Context.** Under the *Homes for Ukraine* scheme, local authorities must manage sensitive, fast-moving data about **Guests**, **Hosts**, **Accommodations**, and time-bound **Placements**. The initial spreadsheet-based workflow was quick to start but led to fragmentation, manual reconciliations, and compliance risks.

**Problems we solve.**

* Eliminate spreadsheet drift and duplication with a **single source of truth**
* Reduce data entry errors via **guided forms** and **server-side validation**
* Provide **clear relational links** (Guest ↔ Host ↔ Accommodation ↔ Placement)
* Ensure **auditability** (who changed what, when, and why) to support governance and GDPR
* Surface **operational visibility** (dashboards, statuses, near-term expiries)

**What GCIMS is.** A lightweight full-stack system (Node.js + TypeScript + MySQL + Bootstrap) delivering CRUD for core entities, role-guarded access, audit logs, and planning views—designed with frontline feedback and public-sector constraints in mind.

**Value in plain terms.**

* **For staff:** faster, fewer mistakes, everything in one place
* **For managers:** transparency, analytics hooks, and complete audit trails
* **For guests & hosts:** safer data handling and more timely support

> **TODO (hero screenshot):** `image/project_screenshots/landing_or_dashboard.png`

---

## 2) Key Features & Screenshots

* **Role-based access (token-gated)**

  * Lightweight header token; endpoints enforce “no token → no access”.
  * *TODO (login / role view):* `image/project_screenshots/login_role_views.png`

* **Core entity management (CRUD)**

  * Guests, Hosts, Accommodations, Placements with consistent list/detail/inline-edit flows.
  * *TODO (list + detail modal):* `image/project_screenshots/guests_list.png`
  * *TODO (edit):* `image/project_screenshots/guest_edit_modal.png`

* **Relational linkage**

  * From a Host see their Accommodations and historical Placements; from a Placement follow through to linked records.
  * *TODO (relation view):* `image/project_screenshots/host_with_placements.png`

* **Dashboards & summaries**

  * Overview cards and simple charts (e.g., current *placed/unplaced* guests; *available/unavailable* accommodations; monthly placement counts).
  * *TODO (dashboard):* `image/project_screenshots/dashboard.png`

* **Notes everywhere**

  * Optional free-text notes on all primary entities (Guest/Host/Accommodation/Placement).
  * *TODO (notes):* `image/project_screenshots/notes_field.png`

* **Audit log**

  * Every create/update/archive is captured with operator id/name, timestamp, and field-level changes.
  * *TODO (audit):* `image/project_screenshots/audit_log.png`

---

## 3) Technology Stack
Badges (example):

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript\&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql\&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.x-7952B3?logo=bootstrap\&logoColor=white)
![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384)

* **Frontend:** Bootstrap 5, HTML5, CSS, vanilla JS (+ Chart.js for simple charts)
* **Backend:** Node.js + TypeScript (minimal REST API; no SPA framework required)
* **Database:** MySQL 8 (tables, FKs, **views** for derived statuses, **triggers** for date overlap rules)
* **Auth:** Lightweight token via HTTP header (e.g., `X-Auth-Token`)
* **Dev:** npm scripts, ESLint/Prettier (recommended), Git

---

## 4) Installation & Local Development

### Prerequisites

* Node.js **18+**
* MySQL **8+**
* Git

### Clone & install

```bash
git clone https://github.com/<your-username>/GCIMS.git
cd GCIMS
npm install
```

### Configure environment

Create a `.env` in the project root (example values below):

```dotenv
# Server
PORT=8080

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=refugee_system
DB_USER=root
DB_PASSWORD=your_password

# Auth
AUTH_HEADER_NAME=X-Auth-Token
# Optional: any seed/admin token strategy you use for local testing
```

> If your code reads config differently, align names accordingly.

### Initialise the database

1. Create the database:

```sql
CREATE DATABASE refugee_system CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

2. Import schema (tables, views, triggers, sample indexes):

```bash
mysql -u <user> -p refugee_system < refugee_system_structure.sql
```

### Run the server

```bash
npm start
# or during development (if available):
npm run dev
```

By default the API listens on `http://localhost:8080/` (configurable via `PORT`).

### Access the app

* **Web UI**: open the static pages served by your dev setup (e.g., `index.html`, `guest.html`) pointing requests at `http://localhost:8080/api/...`.
* **API**: e.g., `GET http://localhost:8080/api/guest/list?keyword=...` (remember to include the token header).

---

## 5) Project Architecture

> **TODO (system architecture diagram):** `image/diagram/architecture.png`

**High-level design.** A classic three-layer web app:

* **Frontend (Bootstrap + JS):** renders lists, forms, and charts; calls REST endpoints with a token header.
* **Backend (Node.js + TypeScript):** validates inputs, enforces auth/roles, executes SQL (DAO/repository style), writes audit logs, returns JSON.
* **Database (MySQL):** normalised schema with FKs; **views** expose business-friendly read models; **triggers** enforce placement non-overlap.

**Design principles.**

* Keep critical **business rules** close to data (constraints, triggers).
* Prefer **views** for derived attributes (e.g., guest status: placed/unplaced; accommodation status: available/unavailable).
* **Soft delete/archiving** via `archived` flags to preserve history and auditability.
* Audit everything that matters: **who/what/when** plus **field-level diff**.

> **TODO (request lifecycle / sequence diagram):** `image/diagram/request_lifecycle_delete_guest.png`
> **TODO (data flow diagram):** `image/diagram/data_flow.png`

---

## 6) Data Model (ER & rules)

**Core tables:**

* `guests(id, full_name, date_of_birth, archived, note)`
* `hosts(id, full_name, archived, note)`
* `accommodations(id, address, postcode, host_id, archived, note)`
* `placements(id, guest_id, host_id, accommodation_id, start_date, end_date, archived, note)`
* `operation_log(id, operation_time, operation_type, table_name, record_id, operator_id, operator_name, changes, uk_formatted_date[VIRTUAL])`

**Views (derived read models):**

* `view_guests` → adds `status = placed|unplaced` based on active placement window
* `view_accommodations` → adds `status = available|unavailable` and resolves `host_name`
* `view_placements` → resolves linked names/addresses and adds status `upcoming|active|completed`

**Business rules (DB-enforced):**

* `placements` trigger(s) reject **overlapping date intervals** for the **same guest** or **same accommodation**
* `CHECK` constraints ensure `end_date >= start_date` (or null)

> **TODO (ER diagram):** `image/diagram/db_er.png`

---

## 7) API Overview (selected)

> All `/api/*` endpoints require a token header, e.g. `X-Auth-Token: <token>` (name configurable via `AUTH_HEADER_NAME`).

**Guests**

* `GET  /api/guest/list?keyword=&page=&limit=` — paginated list, optional search
* `GET  /api/guest/detail?id=:id` — single record
* `POST /api/guest/create` — create (JSON body)
* `POST /api/guest/update` — update (JSON body)
* `GET  /api/guest/delete?id=:id` — *soft* delete → sets `archived=1`

**Hosts / Accommodations / Placements** follow the same pattern (`/host/*`, `/accommodation/*`, `/placement/*`).

**Dashboards**

* `/api/guest-dashboard` — counts by placed/unplaced
* `/api/accommodation-dashboard` — counts by available/unavailable
* `/api/placement-dashboard` — monthly counts across a horizon

> **TODO (endpoint matrix table image or markdown):** `image/diagram/api_matrix.png`

---

## 8) Authentication, Authorisation & Audit

* **Auth transport:** frontend sends a **token in a header** (default `X-Auth-Token`) with every API call.
* **Auth check:** backend middleware/guard rejects missing/invalid tokens with `403`.
* **Roles:** if your deployment distinguishes roles, the router/controller layer can enforce role checks per endpoint (e.g., only admins can view audit logs or manage users).
* **Audit:** every mutating action creates an entry in `operation_log` with operator id/name, timestamp, operation type, target table/id, and a JSON diff of field changes.

> **TODO (RBAC diagram):** `image/diagram/rbac.png`
> **TODO (audit sample screenshot):** `image/project_screenshots/audit_log.png`

---

## 9) Compliance & Data Protectio

* **Data minimisation & purpose limitation:** only fields necessary for placement workflows are stored; notes are optional.
* **Special category data:** the system is designed to help controllers meet obligations (e.g., lawful basis such as *public task*); actual legal compliance depends on local policy and operating procedures.
* **Access control & logging:** token gating, role checks (where configured), and full audit trails support governance and subject-access workflows.

> **TODO (privacy/data-rights matrix graphic):** `image/diagram/privacy_matrix.png`

---

## 10) Roadmap

* **Notes 2.0:** structured notes table (author, timestamps) + cross-entity aggregation view on placement detail
* **Reminders & alerts:** 30-day end-date alerts (email/UI), clickable dashboard drill-downs
* **Analytics:** richer exports and optional BI integration (e.g., Power BI)
* **Quality & Ops:** CI, basic test harness, seed scripts, and containerised dev runtime (Docker)

---

## 11) Known Limitations

* **Delete is soft-delete** via `archived` flag (by design). If you need hard deletes, add explicit admin-only endpoints.
* **Token model is lightweight.** For third-party integrations or SSO, consider upgrading to JWT/OIDC, HTTPS-only cookies, and refresh-token rotation.
* **Reminder subsystem is MVP.** Current dashboard surfaces future months but does not send proactive notifications.

---

## 12) Contributing

Issues and PRs are welcome. Please include:

* a short problem statement and expected behaviour,
* repro steps or sample payloads,
* screenshots where UI is involved.

---

## 13) Project Media

* `image/project_screenshots/landing_or_dashboard.png`

* `image/project_screenshots/guests_list.png`

* `image/project_screenshots/guest_edit_modal.png`

* `image/project_screenshots/host_with_placements.png`

* `image/project_screenshots/notes_field.png`

* `image/project_screenshots/audit_log.png`

* `image/diagram/architecture.png`

* `image/diagram/request_lifecycle_delete_guest.png`

* `image/diagram/data_flow.png`

* `image/diagram/db_er.png`

* `image/diagram/api_matrix.png`

* `image/diagram/rbac.png`

* `image/diagram/privacy_matrix.png`

---


### Appendix: Quick API call example

```bash
# List guests (replace TOKEN)
curl -H "X-Auth-Token: TOKEN" \
     "http://localhost:8080/api/guest/list?page=1&limit=20&keyword="

# Soft-delete a guest
curl -H "X-Auth-Token: TOKEN" \
     "http://localhost:8080/api/guest/delete?id=42"
```
