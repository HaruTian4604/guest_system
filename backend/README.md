# Refugee Management System API Doc

## Data Models

### `Accommodation`

```ts
{
  id: number               // unique identifier (PK)
  address: string          // full street address
  postcode: string         // UK postcode (e.g. "SW1A 1AA")
  host_id: number          // reference to primary_host (FK)
  status: string           // accommodation status - must be one of: ['available', 'unavailable']
}
```

### `PrimaryHost`

```ts
{
  id: number               // unique identifier (PK)
  full_name: string        // host's full legal name
}
```

### `Guest`

```ts
{
  id: number               // unique identifier (PK)
  full_name: string        // guest's full legal name
  date_of_birth: string    // birth date in DD-MM-YYYY format (e.g. "15-05-1985")
  status: string           // guest status - must be one of: ['placed', 'unplaced']
}
```

### `Placement`

```ts
{
  id: number               // unique identifier (PK)
  guest_id: number         // reference to guest (FK)
  host_id: number          // reference to primary_host (FK)
  accommodation_id: number // reference to accommodation (FK)
  start_date: string       // placement start date in DD-MM-YYYY format
  end_date: string         // placement end date in DD-MM-YYYY format (nullable if ongoing)
}
```

## URL Structure Convention

All API endpoints follow the structure:

```
/api/{model}/{action}
```

For example, to create a new accommodation record, the full API URL would be:

```
https://xxx.com/api/accommodation/create
```

## Accommodation Management API

| Endpoint               | Parameters                                                                 | Description                                      | Example                                                                 |
| ---------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `accommodation/create` | `address: string`, `postcode: string`, `host_id: number`, `status: string` | Create new accommodation                        | `{ "address": "10 Downing St", "postcode": "SW1A 2AA", "host_id": 1, "status": "available" }` |
| `accommodation/delete` | `id: number`                                                               | Delete accommodation by ID                      | `{ "id": 1 }`                                                           |
| `accommodation/update` | `id: number`, `Accommodation?`                                             | Update accommodation details                    | `{ "id": 1, "status": "unavailable" }`                                 |
| `accommodation/list`   | `page?: number`                                                            | List accommodations (pagination)                | `{ "page": 1 }`                                                         |
| `accommodation/pick`   | `id: number`                                                               | Get accommodation details by ID                 | `{ "id": 1 }`                                                           |
| `accommodation/search` | `postcode?: string`, `status?: string`                                     | Search by postcode or status                    | `{ "postcode": "SW1A", "status": "available" }`                         |

## Primary Host Management API

| Endpoint          | Parameters                     | Description                      | Example                                      |
| ----------------- | ------------------------------ | -------------------------------- | -------------------------------------------- |
| `host/create`     | `full_name: string`            | Create new primary host          | `{ "full_name": "John Smith" }`              |
| `host/delete`     | `id: number`                   | Delete host by ID                | `{ "id": 1 }`                                |
| `host/update`     | `id: number`, `PrimaryHost?`   | Update host details              | `{ "id": 1, "full_name": "Jonathan Smith" }` |
| `host/list`       | `page?: number`                | List hosts (pagination)          | `{ "page": 1 }`                              |
| `host/pick`       | `id: number`                   | Get host details by ID           | `{ "id": 1 }`                                |
| `host/search`     | `full_name?: string`           | Search hosts by name             | `{ "full_name": "Smith" }`                   |

## Guest Management API

| Endpoint        | Parameters                                                                 | Description                      | Example                                                                 |
| --------------- | -------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `guest/create`  | `full_name: string`, `date_of_birth: string`, `status: string`             | Create new guest                 | `{ "full_name": "Ahmed Khan", "date_of_birth": "12-08-1990", "status": "unplaced" }` |
| `guest/delete`  | `id: number`                                                               | Delete guest by ID               | `{ "id": 1 }`                                                           |
| `guest/update`  | `id: number`, `Guest?`                                                     | Update guest details             | `{ "id": 1, "status": "placed" }`                                       |
| `guest/list`    | `page?: number`                                                            | List guests (pagination)         | `{ "page": 1 }`                                                         |
| `guest/pick`    | `id: number`                                                               | Get guest details by ID          | `{ "id": 1 }`                                                           |
| `guest/search`  | `full_name?: string`, `status?: string`                                    | Search guests by name or status  | `{ "full_name": "Khan", "status": "unplaced" }`                         |

## Placement Management API

| Endpoint          | Parameters                                                                             | Description                      | Example                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `placement/create`| `guest_id: number`, `host_id: number`, `accommodation_id: number`, `start_date: string` | Create new placement             | `{ "guest_id": 1, "host_id": 1, "accommodation_id": 1, "start_date": "01-06-2023" }` |
| `placement/delete`| `id: number`                                                                           | Delete placement by ID           | `{ "id": 1 }`                                                           |
| `placement/update`| `id: number`, `Placement?`                                                             | Update placement details         | `{ "id": 1, "end_date": "30-06-2023" }`                                |
| `placement/list`  | `page?: number`                                                                        | List placements (pagination)     | `{ "page": 1 }`                                                         |
| `placement/pick`  | `id: number`                                                                           | Get placement details by ID      | `{ "id": 1 }`                                                           |
| `placement/search`| `guest_id?: number`, `accommodation_id?: number`, `status?: string`                    | Search placements               | `{ "guest_id": 1, "status": "active" }`                                 |

## Notes on Data Formats:
- All dates must be in DD-MM-YYYY format (e.g. "15-05-1985")
- UK postcodes must follow standard format (e.g. "SW1A 1AA", "M1 1AE", "EH12 9SY")
- Status fields have specific allowed values:
  - Accommodation: ['available', 'unavailable']
  - Guest: ['placed', 'unplaced']
- Names should be stored as full legal names (first name + surname)
