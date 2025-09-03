# Refugee / Guest Management System

This document describes the database schema, data formats, search behavior, and HTTP APIs as they actually work in this codebase.

> **Key principles**
>
> * **Dates** are stored and exchanged as `YYYY-MM-DD` strings.
> * **Status values are not stored** in base tables. They are **derived in SQL views** (`view_*`).
> * All *list* endpoints accept `page`, `limit`, and optional `keyword`, which is applied to model-defined *searchable* fields.

---

## Database Schema (MySQL)

### Tables

#### `users`

* `id` (INT, PK, auto increment)
* `name` (VARCHAR) – username or display name
* `token` (VARCHAR) – authentication token
* `role_index` (INT) – role indicator (e.g. 1 = admin, 2 = caseworker)

#### `accommodations`

* `id` (INT, PK)
* `address` (VARCHAR(255), NOT NULL)
* `postcode` (VARCHAR(20), NOT NULL)
* `host_id` (FK → hosts.id)
* `archived` (TINYINT(1), default 0)
* `note` (TEXT, nullable)

#### `guests`

* `id` (INT, PK)
* `full_name` (VARCHAR(255), NOT NULL)
* `date_of_birth` (DATE, NOT NULL)
* `archived` (TINYINT(1), default 0)
* `note` (TEXT, nullable)

#### `hosts`

* `id` (INT, PK)
* `full_name` (VARCHAR(255), NOT NULL)
* `archived` (TINYINT(1), default 0)
* `note` (TEXT, nullable)

#### `placements`

* `id` (INT, PK)
* `guest_id` (FK → guests.id)
* `host_id` (FK → hosts.id)
* `accommodation_id` (FK → accommodations.id)
* `start_date` (DATE, NOT NULL)
* `end_date` (DATE, nullable)
* `archived` (TINYINT(1), default 0)
* `note` (TEXT, nullable)
* **Constraints**:

  * `end_date` must be ≥ `start_date` or NULL.
  * **Triggers**: reject overlapping active intervals for the same guest or accommodation.

#### `operation_log`

* `id` (BIGINT, PK)
* `operation_time` (DATETIME, default now)
* `operation_type` (ENUM: CREATE, UPDATE, DELETE, STATUS\_CHANGE, ARCHIVE)
* `table_name` (ENUM: guests, hosts, placements, accommodations)
* `record_id` (INT)
* `operator_id` (INT)
* `operator_name` (VARCHAR(100))
* `changes` (JSON) – field-level diffs
* `uk_formatted_date` (VIRTUAL) – formatted `dd/mm/yyyy hh:mm`

---

### Views (derived status)

* **`view_guests`** → adds `status`: `placed` if guest has an active placement today; otherwise `unplaced`.
* **`view_accommodations`** → adds `status`: `unavailable` if in active placement today; otherwise `available`. Also includes `host_name`.
* **`view_placements`** → adds joined guest/host/accommodation names and `status`:

  * `upcoming` = start date in future
  * `active` = no end date or end date ≥ today
  * `completed` = ended before today

---

## Data Formats

* **Dates**: `YYYY-MM-DD`
* **Dashboard month labels**: `YYYY-MM`

---

## Search & Pagination

All list endpoints support:

* `page`, `limit`, `keyword`
* `keyword` is matched against each model’s `searchable` fields (`LIKE %keyword%`)

### Searchable fields by model

* **Guest** → `full_name`
* **Accommodation** → `address`, `postcode`, `host`
* **Placement** → `guest_name`, `host_name`, `accommodation_address`, `accommodation_postcode`
* **Log** → `operation_type`, `operator_name`, `operation_type`, `changes`

---

## API Patterns

### CRUD endpoints

* `/{entity}/list` – list with paging and keyword search
* `/{entity}/pick` – get by ID
* `/{entity}/create` – insert record
* `/{entity}/update` – update by ID
* `/{entity}/delete` – soft delete by ID

### Dashboard endpoints

* `/guest-dashboard` → `{ ok, total, placed_count, unplaced_count }`
* `/accommodation-dashboard` → `{ ok, total, available_count, unavailable_count }`
* `/placement-dashboard` → `{ ok, items: [{ month: "YYYY-MM", count: number }] }`

---

## Entity Create/Update requirements

* **Guest** → full\_name, date\_of\_birth (YYYY-MM-DD), note optional
* **Host** → full\_name, note optional
* **Accommodation** → address, postcode, host\_id, note optional
* **Placement** → guest\_id, host\_id, accommodation\_id, start\_date (YYYY-MM-DD); end\_date optional; note optional

---

## Logging

All writes (create, update, delete, archive, status changes) are recorded into `operation_log`.
The Logs UI provides list + keyword search + detail JSON view.

---
