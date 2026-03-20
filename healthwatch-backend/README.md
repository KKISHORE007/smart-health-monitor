# HealthWatch — Database & Vercel Deployment Guide

## Architecture Overview

```
Frontend (React/JSX)          Backend (Vercel Serverless)      Database
─────────────────────         ──────────────────────────────   ─────────────────
HealthWatch-Complete.jsx  →   /api/auth/login.js            →  PostgreSQL
                              /api/auth/signup.js               (Vercel Postgres
                              /api/hospitals/index.js            or Neon)
                              /api/symptoms/index.js
                              /api/alerts/index.js
                              /api/portals/index.js
                              /api/users/profile.js
                              /api/admin/ministers/index.js
                              /api/admin/ministers/[id].js
                              /api/cases/resolve.js
```

---

## Database Schema (PostgreSQL via Prisma)

### Tables

| Table | Purpose |
|-------|---------|
| `SuperAdmin` | Single system-level admin account |
| `HealthMinister` | One per state — manages hospitals and portal |
| `StatePortal` | Lock/unlock patient signup per state |
| `Hospital` | Hospitals added by ministers |
| `User` | Patients, doctors, helpers |
| `SymptomReport` | Patient-submitted symptom entries |
| `OutbreakAlert` | Auto-generated when 3+ patients share disease in a district |
| `OutbreakAlertEntry` | Links symptom reports to an alert (junction table) |
| `ResolvedCase` | Doctor marks a patient case as resolved |
| `AuditLog` | Optional — tracks all major actions |

### Key Relationships

```
HealthMinister  →  StatePortal     (1:1)
HealthMinister  →  Hospital        (1:many)
Hospital        →  User            (1:many)
Hospital        →  SymptomReport   (1:many)
Hospital        →  OutbreakAlert   (1:many)
User            →  SymptomReport   (1:many, patients)
SymptomReport   →  OutbreakAlertEntry  (many:many via OutbreakAlert)
```

---

## Step-by-Step Deployment on Vercel

### Prerequisites
- Node.js 18+
- A [Vercel account](https://vercel.com) (free tier works)
- A [GitHub account](https://github.com)
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`

---

### Step 1 — Push code to GitHub

```bash
cd healthwatch-backend
git init
git add .
git commit -m "Initial HealthWatch backend"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/healthwatch-api.git
git push -u origin main
```

---

### Step 2 — Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** → select your `healthwatch-api` repo
3. Set **Framework Preset** to `Other`
4. Click **Deploy** (it will fail initially — that's expected, no DB yet)

---

### Step 3 — Add Vercel Postgres Database

1. In your Vercel project, go to **Storage** tab
2. Click **Create Database** → choose **Postgres**
3. Name it `healthwatch-db`, select your region (closest to India: **Singapore** or **Mumbai**)
4. Click **Create & Continue**
5. Vercel will automatically inject these env vars into your project:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_URL`
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`

---

### Step 4 — Add Environment Variables

In your Vercel project → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Run `openssl rand -base64 64` and paste the output |
| `NODE_ENV` | `production` |

The Postgres variables are already injected from Step 3.

---

### Step 5 — Run Prisma Migrations

Connect your local environment to Vercel's database:

```bash
# Pull the env vars from Vercel to your local machine
vercel env pull .env.local

# Rename to .env (Prisma reads .env by default)
mv .env.local .env

# Push the schema to the database (creates all tables)
npx prisma db push

# Seed the database with Super Admin + Health Ministers
node prisma/seed.js
```

Expected output:
```
✅ Super Admin created
  ✅ Tamil Nadu — Ma. Subramanian
  ✅ Maharashtra — Tanaji Sawant
  ... (all 23 ministers)
✅ Seed complete!
```

---

### Step 6 — Redeploy

```bash
vercel --prod
```

Or push a new commit to GitHub — Vercel auto-deploys on every push to `main`.

---

### Step 7 — Connect Frontend to Backend

In your `HealthWatch-Complete.jsx`, replace the in-memory `appState` calls with API calls.

Add a base URL constant at the top:

```js
const API_BASE = "https://your-project.vercel.app"; // your Vercel URL
```

Example — replacing the login handler:

```js
// BEFORE (in-memory)
const handleHMLogin = (hm) => { setCurrentHM(hm); setScreen("hm"); };

// AFTER (real API)
const handleHMLogin = async ({ id, password }) => {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "minister", id, password }),
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error);
  localStorage.setItem("hw_token", data.token);
  setCurrentHM(data.minister);
  setScreen("hm");
};
```

---

## API Reference

### Auth
| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/api/auth/login` | `{ role, id/email, password }` | None |
| POST | `/api/auth/signup` | `{ name, email, password, role, state, district, hospitalId }` | None |

### Hospitals
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/hospitals?state=Tamil Nadu` | None |
| POST | `/api/hospitals` | Minister/SuperAdmin |
| PATCH | `/api/hospitals/:id` | Minister/SuperAdmin |
| DELETE | `/api/hospitals/:id` | Minister/SuperAdmin |

### Symptoms
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/symptoms` | Any logged-in user |
| POST | `/api/symptoms` | Patient |

### Alerts
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/alerts` | Doctor/Helper/Minister |

### Portals
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/portals` | None |
| PATCH | `/api/portals` | Minister/SuperAdmin |

### User Profile
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/users/profile` | Any logged-in user |
| PATCH | `/api/users/profile` | Any logged-in user |

### Admin — Ministers
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/admin/ministers` | SuperAdmin |
| POST | `/api/admin/ministers` | SuperAdmin |
| PATCH | `/api/admin/ministers/:id` | SuperAdmin |
| DELETE | `/api/admin/ministers/:id` | SuperAdmin |

### Cases
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/cases/resolve` | Doctor/Helper |

---

## Default Credentials (CHANGE BEFORE GOING LIVE)

| Role | ID / Email | Password |
|------|-----------|----------|
| Super Admin | `superadmin` | `superadmin@2024` |
| Tamil Nadu Minister | `HM-TN-001` | `tn@health2024` |
| Maharashtra Minister | `HM-MH-001` | `mh@health2024` |
| Karnataka Minister | `HM-KA-001` | `ka@health2024` |
| Kerala Minister | `HM-KL-001` | `kl@health2024` |
| *(all other states follow the same pattern)* | | |

---

## Vercel Free Tier Limits

| Resource | Free Limit | Notes |
|----------|------------|-------|
| Serverless function invocations | 100,000 / month | Plenty for development |
| Postgres storage | 256 MB | Enough for thousands of records |
| Postgres row reads | 500,000 / month | Sufficient for testing |
| Bandwidth | 100 GB / month | More than enough |

For production scale, upgrade to Vercel Pro ($20/month).

---

## Security Checklist Before Going Live

- [ ] Change all default passwords (Super Admin + all Ministers)
- [ ] Set a strong `JWT_SECRET` (64+ random characters)
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Add rate limiting to `/api/auth/login` (use `upstash/ratelimit`)
- [ ] Store patient photos in Vercel Blob instead of base64 in DB
- [ ] Add CORS headers restricting to your frontend domain
- [ ] Enable Prisma Accelerate for connection pooling at scale
- [ ] Set up Vercel monitoring alerts for errors

---

## Project File Structure

```
healthwatch-backend/
├── api/
│   ├── auth/
│   │   ├── login.js
│   │   └── signup.js
│   ├── hospitals/
│   │   ├── index.js
│   │   └── [id].js
│   ├── symptoms/
│   │   └── index.js
│   ├── alerts/
│   │   └── index.js
│   ├── portals/
│   │   └── index.js
│   ├── users/
│   │   └── profile.js
│   ├── cases/
│   │   └── resolve.js
│   └── admin/
│       └── ministers/
│           ├── index.js
│           └── [id].js
├── prisma/
│   ├── schema.prisma       ← Full DB schema
│   └── seed.js             ← Seeds all ministers
├── src/
│   ├── lib/
│   │   ├── prisma.js           ← DB client singleton
│   │   └── diseaseDetection.js ← Disease logic (server-side)
│   └── middleware/
│       └── auth.js             ← JWT helpers
├── .env.example
├── .gitignore
├── package.json
├── vercel.json
└── README.md               ← This file
```
