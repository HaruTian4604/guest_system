# Refugee / Guest Management System

## Database Schema (MySQL)

### Tables

#### `users`

* `id` – primary key, auto increment
* `name` – username or display name
* `token` – auth token for API calls
* `role_index` – user role (1 = admin, 2 = caseworker, …)

#### `accommodations`

* `id` – primary key
* `address` – full street address
* `postcode` – UK postcode
* `host_id` – foreign key → `hosts.id`
* `archived` – soft delete flag (0 = active, 1 = archived)
* `note` – free text notes (optional)

#### `guests`

* `id` – primary key
* `full_name` – guest’s legal name
* `date_of_birth` – birth date (date)
* `archived` – soft delete flag
* `note` – free text notes (optional)

#### `hosts`

* `id` – primary key
* `full_name` – host’s legal name
* `archived` – soft delete flag
* `note` – free text notes (optional)

#### `placements`

* `id` – primary key
* `guest_id` – foreign key → `guests.id`
* `host_id` – foreign key → `hosts.id`
* `accommodation_id` – foreign key → `accommodations.id`
* `start_date` – placement start date
* `end_date` – placement end date (nullable if ongoing)
* `archived` – soft delete flag
* `note` – free text notes (optional)
* **Constraints**:

  * End date must be after or equal to start date (or null).
  * **Triggers**: no overlapping placements for the same guest or accommodation.

#### `operation_log`

* `id` – primary key
* `operation_time` – timestamp (default current)
* `operation_type` – one of: CREATE, UPDATE, DELETE, STATUS\_CHANGE, ARCHIVE
* `table_name` – one of: guests, hosts, placements, accommodations
* `record_id` – affected record ID
* `operator_id` – ID of the user who made the change
* `operator_name` – name of the operator
* `changes` – JSON with field-level details
* `uk_formatted_date` – virtual field (dd/mm/yyyy hh\:mm)

### Views

* **view\_accommodations** – joins host info, computes status (available / unavailable).
* **view\_guests** – computes status (placed / unplaced).
* **view\_placements** – joins guest, host, accommodation, computes status (upcoming / active / completed).

---

## Data Models (App Layer)

### `User`

```ts
{
  id: number,
  name: string,
  token: string,
  roleIndex: number  // 1 = admin, 2 = caseworker ...
}
```

### `Accommodation`

```ts
{
  id: number,
  address: string,
  postcode: string,
  host_id: number,
  status: 'available' | 'unavailable',
  note?: string
}
```

### `Host`

```ts
{
  id: number,
  full_name: string,
  note?: string
}
```

### `Guest`

```ts
{
  id: number,
  full_name: string,
  date_of_birth: string,   // format: DD-MM-YYYY
  status: 'placed' | 'unplaced',
  note?: string
}
```

### `Placement`

```ts
{
  id: number,
  guest_id: number,
  host_id: number,
  accommodation_id: number,
  start_date: string,   // DD-MM-YYYY
  end_date?: string,    // DD-MM-YYYY or null
  note?: string
}
```

---

## API Endpoints

### User Management API

| Endpoint      | Parameters                                           | Description      | Example                                                 |
| ------------- | ---------------------------------------------------- | ---------------- | ------------------------------------------------------- |
| `user/list`   |                                                      | List all users   |                                                         |
| `user/pick`   | `id: number`                                         | Get user by ID   | `{ "id": 1 }`                                           |
| `user/create` | `name: string`, `token: string`, `roleIndex: number` | Create new user  | `{ "name": "admin", "token": "12345", "roleIndex": 1 }` |
| `user/update` | `id: number`, `User?`                                | Update user info | `{ "id": 1, "roleIndex": 2 }`                           |
| `user/delete` | `id: number`                                         | Delete user      | `{ "id": 1 }`                                           |

### Accommodation Management API

| Endpoint               | Parameters                                 | Description                |
| ---------------------- | ------------------------------------------ | -------------------------- |
| `accommodation/create` | `address`, `postcode`, `host_id`, `status` | Create new accommodation   |
| `accommodation/delete` | `id`                                       | Delete accommodation by ID |
| `accommodation/update` | `id`, `Accommodation?`                     | Update accommodation       |
| `accommodation/list`   | `page?`                                    | List accommodations        |
| `accommodation/pick`   | `id`                                       | Get accommodation details  |
| `accommodation/search` | `postcode?`, `status?`                     | Search by postcode/status  |

### Host Management API

| Endpoint      | Parameters    | Description          |
| ------------- | ------------- | -------------------- |
| `host/create` | `full_name`   | Create new host      |
| `host/delete` | `id`          | Delete host by ID    |
| `host/update` | `id`, `Host?` | Update host info     |
| `host/list`   | `page?`       | List hosts           |
| `host/pick`   | `id`          | Get host details     |
| `host/search` | `full_name?`  | Search hosts by name |

### Guest Management API

| Endpoint       | Parameters                             | Description        |
| -------------- | -------------------------------------- | ------------------ |
| `guest/create` | `full_name`, `date_of_birth`, `status` | Create new guest   |
| `guest/delete` | `id`                                   | Delete guest by ID |
| `guest/update` | `id`, `Guest?`                         | Update guest       |
| `guest/list`   | `page?`                                | List guests        |
| `guest/pick`   | `id`                                   | Get guest details  |
| `guest/search` | `full_name?`, `status?`                | Search guests      |

### Placement Management API

| Endpoint           | Parameters                                              | Description          |
| ------------------ | ------------------------------------------------------- | -------------------- |
| `placement/create` | `guest_id`, `host_id`, `accommodation_id`, `start_date` | Create new placement |
| `placement/delete` | `id`                                                    | Delete placement     |
| `placement/update` | `id`, `Placement?`                                      | Update placement     |
| `placement/list`   | `page?`                                                 | List placements      |
| `placement/pick`   | `id`                                                    | Get placement info   |
| `placement/search` | `guest_id?`, `accommodation_id?`, `status?`             | Search placements    |

---

## Notes

* **Date format**: `YYYY-MM-DD`
* **Postcodes**: UK standard format
* **Status values**:

  * Accommodation: `available | unavailable`
  * Guest: `placed | unplaced`
  * Placement (view): `upcoming | active | completed`
* **User roles**: 1 = Admin, 2 = Caseworker (more can be added)

---
