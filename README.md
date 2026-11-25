<div align="center">

# 🛍️ Afiya Shope — E-Commerce Platform

**A modern, full-stack e-commerce monorepo built with Next.js & Laravel.**  
Customer storefront · Admin dashboard · REST API backend

[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Design System](#-design-system)
- [Development Roadmap](#-development-roadmap)
- [License](#-license)

---

## 🏗️ Architecture

```
┌─────────────────────────┐     ┌──────────────────────────┐
│   user-frontend          │     │   admin-frontend          │
│   Next.js  :3000         │     │   Next.js  :3001          │
└──────────┬──────────────┘     └────────────┬─────────────┘
           │  REST /api/v1                   │  REST /api/v1
           └──────────────┬──────────────────┘
                          ▼
              ┌───────────────────────┐
              │  backend (Laravel)    │
              │  :8000                │
              └──────────┬────────────┘
                         ▼
              ┌───────────────────────┐
              │  PostgreSQL           │
              │  v2005_data           │
              └───────────────────────┘
```

---

## 📁 Project Structure

```
afiyashope/
├── user-frontend/      # Public customer storefront (Next.js)
├── admin-frontend/     # Admin dashboard (Next.js)
└── backend/            # Laravel REST API
    ├── Dockerfile      # FrankenPHP production image
    ├── railway.toml    # Railway deployment config
    └── docker/
        ├── entrypoint.sh   # Migrate + serve on $PORT
        └── Caddyfile       # Laravel front controller
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **User Frontend** | Next.js · React · TypeScript · Tailwind CSS · Zustand · React Hook Form · Zod · Lucide |
| **Admin Frontend** | Next.js · React · TypeScript · Tailwind CSS · Zustand · React Hook Form · Zod · Lucide |
| **Backend API** | Laravel 13 · Sanctum · PostgreSQL |
| **Media Storage** | Cloudinary (product images) |
| **Production DB** | Neon (serverless PostgreSQL) |
| **Deployment** | Railway (backend) · Vercel (frontends) |

---

## ✅ Prerequisites

Ensure the following are installed before getting started:

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| PHP | 8.4+ |
| Composer | 2+ |
| PostgreSQL | 14+ |

> **PHP Extensions required:** `pdo_pgsql`, `pgsql`

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/KhatVanna/afiyashope.git
cd afiyashope
```

### 2. Create the Database

Open `psql` or pgAdmin and run:

```sql
CREATE DATABASE v2005_data;
```

### 3. Backend Setup

```bash
cd backend
copy .env.example .env
# Edit .env — set DB_USERNAME and DB_PASSWORD to match your PostgreSQL credentials
php artisan key:generate
php artisan migrate
php artisan serve
```

✅ API health check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Site Settings API

The admin-managed storefront content is stored in the `site_settings` groups
`branding`, `contact`, `footer`, and `seo`, with hero content stored separately
in `site_banners`. Run the new migration on the intended local or deployment
database, then run `php artisan db:seed --class=SiteSettingsSeeder` to insert
defaults without replacing saved settings.

Public, read-only endpoints are `GET /api/v1/site-settings` and
`GET /api/v1/banners`. The latter returns only active banners inside their
schedule window. Both endpoints cache for 60 seconds and admin saves clear the
cache.

Admin endpoints require a Sanctum-authenticated `admin` or `super-admin`:

- `GET|PUT /api/v1/admin/site-settings/{group}` for each settings group.
- `GET|POST /api/v1/admin/banners`, `PUT|DELETE /api/v1/admin/banners/{id}`,
  and `POST /api/v1/admin/banners/reorder`.
- `POST /api/v1/admin/media/site-settings` accepts a file and `kind`; images
  are limited to 5 MB and videos to 15 MB. It uses the configured Cloudinary
  service, and does not remove previously uploaded assets.

### 4. User Frontend

```bash
cd user-frontend
copy .env.example .env.local
npm install
npm run dev
```

✅ App: [http://localhost:3000](http://localhost:3000)

### 5. Admin Frontend

```bash
cd admin-frontend
copy .env.example .env.local
npm install
npm run dev
```

✅ App: [http://localhost:3001](http://localhost:3001)

### 6. Root Helper Scripts

Run all services from the repository root:

```bash
npm run dev:user    # Start user storefront
npm run dev:admin   # Start admin dashboard
npm run dev:api     # Start Laravel backend
```

---

## 🔐 Environment Variables

> ⚠️ **Never commit real secrets to Git.** Use `.env.example` files as templates only.

### Frontend (user-frontend & admin-frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Backend — Local (`.env`)

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=v2005_data
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_SSLMODE=prefer

CLOUDINARY_CLOUD_NAME=v2005
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=v2005/products
```

### Backend — Production / Neon (`.env.production`)

```env
DB_CONNECTION=pgsql
DB_URL=postgresql://neondb_owner:PASSWORD@HOST/neondb?sslmode=require
# Migration-only direct connection; keep the pooled URL in DB_URL for runtime.
DB_DIRECT_URL=
DB_SSLMODE=require
OWNER_EMAIL=
OWNER_PASSWORD=

CLOUDINARY_CLOUD_NAME=v2005
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=v2005/products
```

After the first deploy, run migrations using the direct connection:
`php artisan migrate --database=pgsql_direct --force`.
Keep `DB_URL` set to the pooled connection for the running application and
provide `DB_DIRECT_URL` only for migration operations.

---

## ☁️ Deployment

### Backend → Railway (Docker)

The `backend/` directory is fully configured for Railway deployment via Docker.

| File | Purpose |
|---|---|
| `Dockerfile` | FrankenPHP (PHP 8.4) concurrent server image |
| `railway.toml` | Health check endpoint `/up` |
| `docker/entrypoint.sh` | Runs `migrate --force` then serves on `$PORT` |
| `docker/Caddyfile` | Laravel public front controller |

**Step-by-step deployment:**

1. Push this repository to GitHub.
2. Go to [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → select `afiyashope`.
3. Under Service settings, set **Root Directory** to `backend` (Railway auto-detects the `Dockerfile`).
4. Add a public domain under **Settings → Networking**.
5. Set the following environment variables in the **Variables** tab:

```env
APP_NAME="Afiya Shope"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:GENERATE_WITH_php_artisan_key_generate_--show
APP_URL=https://YOUR-SERVICE.up.railway.app
LOG_CHANNEL=stderr

DB_CONNECTION=pgsql
DB_URL=postgresql://neondb_owner:PASSWORD@ep-...neon.tech/neondb?sslmode=require
# Optional when DB_URL is direct; required if DB_URL uses a pooler.
DB_DIRECT_URL=YOUR_NEON_DIRECT_CONNECTION_STRING
DB_HOST=ep-your-host.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=neondb_owner
DB_PASSWORD=YOUR_NEON_PASSWORD
DB_SSLMODE=require
DB_PERSISTENT=true
DB_CONNECT_TIMEOUT=10

CLOUDINARY_CLOUD_NAME=v2005
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=v2005/products

FRONTEND_USER_URL=https://your-storefront.vercel.app
FRONTEND_ADMIN_URL=https://your-admin.vercel.app
SANCTUM_STATEFUL_DOMAINS=your-storefront.vercel.app,your-admin.vercel.app

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

> **💡 Tip:** Choose the Railway region closest to your Neon region to minimize latency. This project uses `ap-southeast-1` (Singapore). Cross-region connections can add ~2s per database call on cold queries.

6. **Redeploy.** The entrypoint runs migrations with `DB_DIRECT_URL` and refuses to serve if they fail.
7. Verify health endpoints:
   - `https://YOUR-SERVICE.up.railway.app/up`
   - `https://YOUR-SERVICE.up.railway.app/api/v1/health`

**Generate `APP_KEY` locally:**

```bash
cd backend && php artisan key:generate --show
```

### Vercel frontends

Create separate Vercel projects for the two frontends:

| Project | Root Directory |
|---|---|
| Customer storefront | `user-frontend` |
| Admin dashboard | `admin-frontend` |

For the `user-frontend` Vercel project, configure these environment variable
names:

- `LARAVEL_API_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`

`LARAVEL_API_ORIGIN` is the backend origin used by server-side route handlers;
those handlers append `/api/...`. `NEXT_PUBLIC_API_URL` is the API base used by
the browser client and includes `/api/v1`. `NEXT_PUBLIC_SITE_URL` supplies the
storefront metadata base URL.

The storefront requests public products from `GET /api/v1/catalog/products`.
`catalog-api.ts` calls the Laravel API origin directly, using
`LARAVEL_API_ORIGIN` first and `NEXT_PUBLIC_API_URL` as a fallback. The Next.js
route `/api/proxy/v1/catalog/products` also forwards to that public catalog
endpoint, but the product listing does not call the proxy route. Laravel's
`GET /api/v1/products` is not the public catalog endpoint.

Vercel supplies `NODE_ENV` automatically. Set the backend's
`FRONTEND_USER_URL`, `FRONTEND_ADMIN_URL`, and
`SANCTUM_STATEFUL_DOMAINS` to the two deployed frontend domains. Redeploy after
changing project roots or environment variables. Never use `localhost:8000` as
the production API origin.

### Demo product images

The Cloudinary image importer only uploads files; it does not create database
products or image rows. After reviewing the mapping and confirming the selected
database, inspect the product plan with:

```bash
php artisan products:sync-demo --dry-run
```

For a verified local database, run `php artisan products:sync-demo` and confirm
the prompt. The command refuses non-local databases unless `--allow-remote` is
provided, and still asks for confirmation. Demo prices are stored as USD 10.98,
which displays approximately 45,000 KHR using the storefront's current exchange
rate.

Before removing demo records, inspect the scope with
`php artisan products:remove-demo --dry-run`. The removal command asks for
confirmation and deletes the Cloudinary assets as well as demo database rows.
For Neon, create a database backup or branch in the Neon console first. Set the
pooled connection in `DB_URL`, the direct connection in `DB_DIRECT_URL`, and
the private owner credentials in `OWNER_EMAIL` and `OWNER_PASSWORD`. Then run
these commands in order:

```bash
php artisan migrate --database=pgsql_direct --force
php artisan app:seed-owner-settings --allow-remote
php artisan products:sync-demo --allow-remote
```

The owner-settings command seeds the required roles/permissions, one owner,
and two store settings; it does not seed products or demo users. Both seed
commands ask for confirmation. Do not run these commands until the Neon backup
is complete, the target connection has been verified, and you have explicitly
approved the production writes.

---

## 🎨 Design System

Afiya Shope uses a consistent design token system with full **light / dark mode** support.

| Token | Light | Dark |
|---|---|---|
| Background | `#F5FBFF` | `#071225` |
| Card | `#FFFFFF` | `#0E1E38` |
| Text | `#0B1B3A` | `#EAF7FD` |
| Primary (cyan) | `#0077B6` | `#20B6E8` |
| Accent (magenta) | `#C21868` | `#F04491` |
| Navy | `#071A4A` | `#C8EFFF` |

---

## 🗺️ Development Roadmap

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Project initialization & monorepo scaffold | ✅ Complete |
| **Phase 2** | Database & Laravel foundation | 🔲 Planned |
| **Phase 3** | Authentication (Sanctum) | 🔲 Planned |
| **Phase 4** | Product system | 🔲 Planned |
| **Phase 5** | User frontend — catalog & cart | 🔲 Planned |
| **Phase 6** | Checkout & orders | 🔲 Planned |
| **Phase 7** | Admin frontend | 🔲 Planned |
| **Phase 8** | Advanced features | 🔲 Planned |
| **Phase 9** | UI/UX polish | 🔲 Planned |
| **Phase 10** | Testing & deployment | 🔲 Planned |

**Phase 1 Completed:**
- ✅ Monorepo scaffold (`user-frontend`, `admin-frontend`, `backend`)
- ✅ Tailwind design tokens (light/dark)
- ✅ Environment variable templates
- ✅ Laravel Sanctum installed
- ✅ Versioned API (`/api/v1/health`)
- ✅ CORS configured for both frontends
- ✅ PostgreSQL connection targeting `v2005_data`

---

## 📄 License

This is a **private project** — all rights reserved.  
© 2026 Afiya Shope. Unauthorized use, reproduction, or distribution is prohibited.
