# OpsDesk Server

OpsDesk is an operations management backend API. It handles asset tracking, ticketing, user management, and department/location organization for internal operations teams.

## Core Domain Concepts

- **Assets**: Physical or logical items (devices, appliances, furniture, IT, facility) tracked by a unique code (e.g. `CAM-HIK-2143`)
- **Asset Items**: Individual instances of an asset, each with its own code, status, and location
- **Tickets**: Work orders for repair, maintenance, requests, or incidents — linked to asset items
- **Users**: Three roles — `admin`, `manager`, `user` — scoped optionally to a department
- **Departments / Locations**: Organizational units used for scoping assets and users

## Auth Model

JWT-based auth. The global `AppGuard` decodes the token and attaches `payload` to `request`. Routes are open by default; role enforcement is done via dedicated guards (`AdminGuard`, `ValidTokenGuard`) applied per controller or route.
