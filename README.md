# Transportation Management System POC

This is a small Transportation Management System (TMS) proof‑of‑concept showing:

- A **Node.js + GraphQL backend** with role‑based access control.
- A **React UI** (via CDN) with a modern dashboard‑style presentation.
- Shipments in **grid view** and **tile view**, with a rich detail panel.

> Focus is on **presentation**, **clean structure**, and **scalability basics** (pagination, sorting, auth, and lightweight performance considerations).

---

## 1. Running the project

### Prerequisites

- Node.js 18+ installed.

### Install dependencies

From the project root (`test task` folder):

```bash
npm install
```

### Start backend + frontend

```bash
npm start
```

Then open `http://localhost:4000` in your browser.

- UI is served as static files from the `frontend` folder.
- GraphQL API is available at `http://localhost:4000/graphql`.

### Deploy for free

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step guides to deploy the backend and frontend for free on **Render**, **Vercel**, **Netlify**, or **Railway**. The frontend uses the `VITE_GRAPHQL_URL` environment variable to point at your deployed API.

---

## 2. How to use the backend

### Start the backend

From the project root (`test task` folder):

```bash
npm install
npm start
```

The server runs at **http://localhost:4000**. The GraphQL API is at **http://localhost:4000/graphql**.

### Call the API

**Option A – Browser (Apollo Sandbox / GraphQL Playground)**  
Open **http://localhost:4000/graphql** in your browser. Apollo Server serves a built-in GraphQL IDE where you can run queries and mutations.

**Option B – cURL**

```bash
# Login (get a token)
curl -X POST http://localhost:4000/graphql ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"mutation { login(username: \\\"admin\\\", password: \\\"admin123\\\") { token username role } }\"}"

# List shipments (no auth needed for read)
curl -X POST http://localhost:4000/graphql ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"query { shipments(page: 1, pageSize: 5) { items { id reference shipperName carrierName status } totalCount } }\"}"

# With auth (replace YOUR_TOKEN with the token from login)
curl -X POST http://localhost:4000/graphql ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"query\":\"mutation { toggleFlagShipment(id: \\\"1\\\") { id isFlagged } }\"}"
```

On macOS/Linux use `\` instead of `^` for line continuation, and `\"` for escaped quotes in the JSON.

### Test users

| Username  | Password    | Role     |
|-----------|-------------|----------|
| `admin`   | `admin123`  | ADMIN    |
| `employee`| `employee123` | EMPLOYEE |

Use **login** first; then send the returned **token** in the `Authorization: Bearer <token>` header for mutations (add, update, delete, toggleFlag). Queries like `shipments` and `shipment(id)` work without auth.

### Example operations

- **Login:** `mutation { login(username: "admin", password: "admin123") { token username role } }`
- **List shipments:** `query { shipments(page: 1, pageSize: 10, sortBy: pickupDate, sortOrder: DESC) { items { id reference shipperName carrierName status rate } totalCount totalPages } }`
- **Single shipment:** `query { shipment(id: "1") { id reference shipperName carrierName pickupLocation { city state } deliveryLocation { city state } status rate trackingEvents { status timestamp } } }`
- **Current user:** `query { me { id username role } }` (requires `Authorization: Bearer <token>`)
- **Toggle flag:** `mutation { toggleFlagShipment(id: "1") { id isFlagged } }` (requires auth)

---

## 3. Backend (GraphQL API)

Backend entrypoint: `backend/server.js`

Key files:

- `backend/server.js` – Express + Apollo Server, CORS, static frontend hosting.
- `backend/src/schema.js` – GraphQL schema definition.
- `backend/src/resolvers.js` – Query & mutation resolvers with filtering, sorting, pagination.
- `backend/src/data.js` – In‑memory dummy shipment & user data.
- `backend/src/auth.js` – JWT helpers and role checks.

### Data model

`Shipment` includes:

- `id`, `reference`
- `shipperName`, `carrierName`
- `pickupLocation`, `deliveryLocation` (city/state/country)
- `pickupDate`, `deliveryDate`, `status`
- `trackingEvents` (timeline of tracking events)
- `rate`, `currency`, `serviceLevel`
- `isFlagged`

Dummy data: 30 shipments with varying shipper/carrier/status/flag values, plus tracking events.

### GraphQL schema (high level)

**Queries**

- `shipments(filter, sortBy, sortOrder, page, pageSize): ShipmentPage`
  - Optional filters: status, shipper, carrier, flagged, locations, etc.
  - Sorting on pickup/delivery date, shipper, carrier, or rate.
  - Pagination (`page`, `pageSize`) with total counts.
- `shipment(id: ID!): Shipment`
- `me: User` – current user from JWT.

**Mutations**

- `login(username, password): User` – returns user with JWT token.
- `addShipment(input: ShipmentInput!): Shipment!` – **ADMIN only**.
- `updateShipment(id, input: ShipmentUpdateInput!): Shipment!` – **ADMIN or EMPLOYEE**.
- `deleteShipment(id: ID!): Boolean!` – **ADMIN only**.
- `toggleFlagShipment(id: ID!): Shipment!` – **ADMIN or EMPLOYEE**.

### Authentication & authorization

- Simple in‑memory users (demo only) defined in `backend/src/data.js`:
  - `admin` / `admin123` → role `ADMIN`
  - `employee` / `employee123` → role `EMPLOYEE`
- `login` issues a signed JWT containing `id`, `username`, `role`.
- `server.js` reads `Authorization: Bearer <token>` and attaches `user` to GraphQL context.
- `requireRole` helper in `auth.js` enforces role‑based access per resolver.

**Role rules**

- `ADMIN`:
  - Can add, update, delete, flag shipments.
- `EMPLOYEE`:
  - Can update and flag shipments.
  - Cannot delete or add shipments.

### Pagination, sorting & performance considerations

- `shipments` query:
  - **Filters and sorting performed server‑side** before pagination to avoid overfetching.
  - `applyFilters`, `applySorting`, and `applyPagination` helpers keep logic modular and reusable.
- `shipmentsById` `Map` provides **O(1) lookup** for individual shipments.
- Pagination (`page` + `pageSize`) ensures the client only renders a slice of data at a time.
- GraphQL naturally allows clients to request **only the fields they need**, which is how the UI avoids over‑requesting data.

For a production environment you would replace the in‑memory data with a database plus:

- Data‑loader patterns for batching.
- Caching on hot read paths.
- Monitoring of query complexity and depth.

---

## 4. Frontend (React UI)

The frontend is intentionally kept build‑tool‑free for easy review:

- `frontend/index.html` – root HTML + React/Babel CDN includes.
- `frontend/styles.css` – modern dashboard‑style layout and theming.
- `frontend/ui.js` – React components and GraphQL client helper.

### Major UI elements

- **Horizontal top menu**
  - Items: `Dashboard`, `Shipments`, `Network`, `Insights`.
  - Shows active state; can be extended easily.

- **Hamburger / sidebar menu**
  - Left sidebar includes:
    - `Overview`
    - `Shipments` with a one‑level **sub‑menu** (`All shipments`, `Flagged`, `Exceptions`).
    - `Analytics`
  - Hamburger button collapses/expands the sidebar.

- **Main content – grid & tile views**
  - **View toggle** (segmented control) between:
    - **Grid view**: 10+ columns (ref, shipper, carrier, pickup, delivery, dates, status, rate, service).
    - **Tile view**: compact cards with key data only.
  - **Detail panel**:
    - Clicking a row or tile shows the full shipment details (side panel style).
    - Includes badges, core fields, and a tracking timeline.
    - Back button navigates back from the expanded view to the list context.

- **Tile actions**
  - Each tile has a “⋯” action button opening a small menu:
    - `View details`
    - `Flag / Unflag`
    - `Delete` (visible only to `ADMIN`).

- **Filters & sorting**
  - Shipper and carrier text filters.
  - Status dropdown.
  - “Flagged only” toggle.
  - Sort by pickup/delivery date, shipper, carrier, or rate with ascending/descending selection.

- **Auth UI**
  - Simple top‑bar login selector:
    - “Login as… Admin / Employee”
  - Uses the `login` GraphQL mutation, stores JWT in `localStorage`, and automatically attaches it in subsequent GraphQL calls.
  - Shows a user pill with role badge and sign‑out.

### GraphQL integration

- Lightweight `gqlRequest` helper performs POSTs to `/graphql`.
- Custom hooks:
  - `useAuth()` – handles login, logout, and `me` query to validate token.
  - `useShipments()` – manages shipment list state, filters, pagination, and mutations (flag/delete).

---

## 5. How this matches the requirements

- **GraphQL backend**
  - Full schema for shipments, list and single‑item queries, pagination, sorting, and mutations.
- **Role‑based auth**
  - JWT‑based; resolver‑level `ADMIN` vs `EMPLOYEE` restrictions.
- **Pagination & sorting**
  - Implemented in `shipments` query and consumed by the React UI.
- **Performance considerations**
  - Server‑side pagination/sorting, `Map` index for by‑ID lookups, field‑level selection from the client.
- **UI / UX**
  - Modern dashboard design with:
    - Horizontal menu, hamburger sidebar, grid & tile layouts.
    - Tile‑level action menus and a dedicated details panel.

You can extend this POC by swapping the in‑memory data store for a database and wiring the same schema/resolvers to a persistent model (Node.js or Spring Boot based GraphQL service), while reusing the React UI as‑is.

