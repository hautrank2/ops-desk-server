# Tech Stack

## Runtime & Language
- Node.js with TypeScript (strict mode)
- NestJS v11 (framework)

## Database
- MongoDB via Mongoose (`@nestjs/mongoose`)
- Schemas defined with `@Schema` / `@Prop` decorators in `src/schemas/`
- Always use `{ timestamps: true }` on schemas
- Use `Types.ObjectId` for references, `ref` pointing to the schema class name

## Key Libraries
- `@nestjs/jwt` — JWT auth (global module, 1-day expiry)
- `@nestjs/config` — env config via `configuration.ts`
- `@nestjs/swagger` — API docs at `/docs`, swagger JSON saved to `locals/swagger.json` on startup
- `class-validator` + `class-transformer` — DTO validation (global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`)
- `cloudinary` — file/image uploads via `UploadService`
- `rxjs` — services return `Observable` streams (use `from`, `switchMap`, `forkJoin`, `map`, `throwError`)
- `bcrypt` — password hashing
- `pnpm` — package manager

## Common Commands

```bash
# Install dependencies
pnpm install

# Development (watch mode, port 3003)
pnpm dev

# Production build
pnpm build

# Run production
pnpm start:prod

# Lint & format
pnpm lint
pnpm format

# Tests
pnpm test           # unit tests
pnpm test:e2e       # e2e tests
pnpm test:cov       # coverage
```

## Environment Variables
Required in `.env`:
- `DATABASE_URL` — MongoDB connection string
- `JWT_SECRET`
- `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `PORT` (optional, defaults to 3000)
