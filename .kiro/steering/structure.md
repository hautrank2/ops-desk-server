# Project Structure

```
src/
├── main.ts                  # Bootstrap, global prefix /api, Swagger setup
├── app.module.ts            # Root module — registers all feature modules
├── app.guard.ts             # Global JWT decoder (attaches payload to request, never blocks)
├── config/
│   ├── configuration.ts     # Typed env config factory
│   ├── http-exception.filter.ts
│   └── validation.pipe.ts
├── constants/               # Shared constants
├── guards/
│   ├── admin.guard.ts       # Blocks non-admin on mutating methods
│   └── valid-token.guard.ts # Blocks unauthenticated requests
├── schemas/                 # Mongoose schema definitions (one file per collection)
├── services/
│   └── upload.service.ts    # Cloudinary upload/remove (returns Observable)
├── types/                   # Shared TypeScript types (auth, query, response)
├── utils/                   # Pure utility functions
└── modules/                 # Feature modules (see below)
```

## Feature Module Layout

Each module under `src/modules/{feature}/` follows this structure:

```
{feature}/
├── {feature}.module.ts      # Imports schemas, declares controller/service
├── {feature}.controller.ts  # Route handlers, Swagger decorators
├── {feature}.service.ts     # Business logic, returns Observables
├── dto/
│   ├── create-{feature}.dto.ts
│   ├── update-{feature}.dto.ts
│   └── {feature}-query.dto.ts   # Extends QueryCommon (pagination + include)
└── entities/                # Optional — typed response shapes
```

## Current Modules
- `auth` — sign in, token issuance
- `user` — user CRUD
- `asset` — asset CRUD + image management + item creation
- `asset-item` — individual asset item management
- `department` — department CRUD
- `location` — location CRUD
- `ticket` — ticket CRUD

## Key Conventions

- All routes are prefixed with `/api` (set globally in `main.ts`)
- Query DTOs extend `QueryCommon` from `src/types/query.ts` for pagination (`page`, `pageSize`) and `include` (populate relations)
- Services use RxJS `Observable` — avoid `async/await` in service methods; use `from()` to wrap promises
- `createdBy` / `updatedBy` fields are `Types.ObjectId` refs to `User`, set from `request.payload.userId`
- Soft delete pattern: set `active: false` rather than removing documents
- String filters use `$regex` with `$options: 'i'` for case-insensitive partial matching
- Pagination response shape: `{ total, totalPage, page, pageSize, items }` (type `TableResponse<T>`)
- Swagger: use `@ApiProperty` / `@ApiPropertyOptional` on all DTO fields; multipart endpoints need `@ApiConsumes('multipart/form-data')` + `@ApiBody`
