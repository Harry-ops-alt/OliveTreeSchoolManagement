# Milestone 1 – Foundations

## Repository Overview
- **Monorepo layout**: `apps/` (Next.js frontend, NestJS backend), `packages/` (config, UI, types), `docs/`, root tooling.
- **Package manager**: pnpm (`pnpm-workspace.yaml`, `pnpm-lock.yaml`).
- **Task runner**: Turborepo (`turbo.json`).

```
.
├── apps/
│   ├── next/   # Next.js App Router frontend (SSR/ISR ready)
│   └── api/    # NestJS service scaffold
├── packages/
│   ├── config/ # Shared ESLint, TSConfig, Tailwind presets
│   ├── types/  # Shared domain types
│   └── ui/     # Shared component primitives
├── docs/
│   └── milestone-1.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Installed Tooling
- **Frontend**: Next.js 14 App Router, TailwindCSS, TypeScript, ESLint (`next/core-web-vitals`).
- **Backend**: NestJS 11 scaffold with relaxed ESLint (temporary until domain wiring).
- **Shared packages**:
  - `@olive/config`: ESLint presets, TS configs, Tailwind preset (exports for Next + Nest).
  - `@olive/types`: Base IDs, roles, timestamp interface.
  - `@olive/ui`: `Button` primitive + `cn` helper.
- **Utilities**: Turborepo tasks (`build`, `lint`, `test`, `dev`, `clean`).

## Commands
```bash
pnpm install          # install workspace deps
pnpm dev              # run dev tasks via turbo (configure per app)
pnpm lint             # lint frontend + backend
pnpm test             # placeholder (no tests yet)
pnpm build            # builds all apps/packages
pnpm dev:next         # run Next.js dev server
pnpm dev:api          # run NestJS dev server
pnpm storybook:ui     # launch shared UI Storybook
```

## Lint Status (29 Sep 2025)
- `pnpm lint` passes for both Next.js and NestJS after relaxing strict unsafe TypeScript checks (`apps/api/eslint.config.mjs`).
- Re-enable strict rules once API services use typed database clients.

## Stage 0 – Monorepo & Tooling Baseline Enhancements (29 Sep 2025)
- **Convenience scripts**: added `pnpm dev:next`, `pnpm dev:api`, and `pnpm storybook:ui` in root `package.json`.
- **Storybook scaffold**: `packages/ui/.storybook/` configured with React/Vite, accessibility, styling, and interactions addons.
- **Design tokens**: shared brand primitives captured in `packages/config/tokens.json` and consumed by Tailwind preset.
- **UI package tooling**: installed Storybook/Tailwind/PostCSS dependencies inside `@olive/ui` for component documentation.

## Stage 1 – Auth Foundations (30 Sep 2025)
- **Seed data**: `apps/api/prisma/seed.ts` seeds initial organization plus super-admin and admissions users. `package.json` exposes `db:seed` via `tsx`.
- **Backend auth module**: `apps/api/src/auth/` provides `AuthModule`, `AuthService`, `AuthController` with `/auth/login` and `/auth/me` endpoints, `JwtStrategy`, guards, and shared decorators.
- **RBAC utilities**: Role metadata decorator (`roles.decorator.ts`) and `RolesGuard` enforce hierarchy defined in `apps/api/src/auth/roles.constants.ts`. `UsersService` exposes `toSessionUser()` for consistent session payloads.
- **Config updates**: `apps/api/tsconfig.json` uses Node16 module resolution; auth imports use `.js` extensions for compatibility.
- **Login UI**: `apps/next/src/app/(auth)/login/page.tsx` consumes server `login()` action, renders errors, and relies on middleware to protect `/app` routes.

### Validation Checklist
- Run `pnpm --filter api run prisma:migrate` and `pnpm --filter api run db:seed` with Postgres running locally (`DATABASE_URL` in `apps/api/.env`).
- Start services via `pnpm dev:api` and `pnpm dev:next`.
- Visit `http://localhost:3000/login` and sign in with seeded credentials (`admin@olive.school` / `AdminPass123!`).
- Confirm `/app` routes are gated and `/login` redirects when already authenticated.

## Next Steps
- **Types**: Flesh out shared domain models (org, users, branches, admissions pipeline).
- **UI**: Expand component library (`Input`, `Select`, navigation shell, theming tokens).
- **Config**: Reintroduce stricter ESLint rules in `apps/api/` once DTO/services typed.
- **CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`) now runs `pnpm --filter next build`, `node apps/next/scripts/smoke-auth.js`, and Playwright E2E; extend to lint/package builds next.
- **Docs**: Add architectural decision records, environment setup guide, and contribution workflow.
```
