# Karmayogi CMS — iGOT Content Management System

A centralized Content Management System built for the [iGOT Karmayogi](https://igotkarmayogi.gov.in) platform by MeitY. Enables State Project Managers (SPVs) to dynamically update banners, nudge messages, themes, and media content across multiple government portals — without any code deployments.

**Live Frontend:** [igot-cms.netlify.app](https://igot-cms.netlify.app)

---

## The Problem

Every content change on the iGOT platform (a banner update, a nudge message, a theme tweak) required a full code deployment and engineering involvement. This created a bottleneck where SPVs were dependent on the technical team for even minor content updates.

**This CMS decouples content from code.** SPVs manage everything through a UI. Portals pick up changes via a public API — no deployment needed.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  WHO USES THE SYSTEM                        │
│                                                             │
│   SPV Admin (CMS UI)           iGOT Portals (Consumers)    │
│   React + MUI                  Learner / MDO / SPV         │
└────────────┬────────────────────────────┬───────────────────┘
             │ JWT (admin APIs)            │ No auth (public)
             ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Express.js Backend :3001                  │
│                                                              │
│  Admin API (JWT protected)     Public Delivery API           │
│  POST /auth/login              GET /api/v1/portals/:id/banners│
│  /website/*                    GET /api/v1/portals/:id/nudges │
│  /portals/*  (CRUD)            GET /api/v1/portals/:id/theme  │
│  /web_gcp/*                    GET /api/v1/portals/:id/pages/ │
│  /web_media_gcp/*              GET /api/v1/portals/:id/media  │
│  /theme_manager_Store_gcp/*                                  │
└──────────┬───────────────────────────┬───────────────────────┘
           │                           │
           ▼                           ▼
    ┌─────────────┐            ┌──────────────────┐
    │   MongoDB   │            │  Google Cloud    │
    │             │            │  Storage (GCS)   │
    │  User       │            │                  │
    │  Website    │            │  media_content/  │
    │  Portal     │            │  theme_manager_  │
    │  Banner     │            │    Store/        │
    │  NudgeMsg   │            │  website_text_   │
    │  Theme      │            │    content/      │
    │  Page       │            └──────────────────┘
    └─────────────┘
```

### Key Design Decision: Two Separate API Layers

- **Admin API** — authenticated (JWT), used by the CMS React UI for managing content
- **Public Delivery API** (`/api/v1/`) — unauthenticated, read-only, used by iGOT portals to fetch their content at runtime

This separation means portals can be completely static frontends that just call the delivery API on load — they never need to know about the CMS internals.

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-portal support** | Each portal (Learner, MDO, SPV) has its own content namespace via `portalId` |
| **Banner management** | Create/update banners with scheduling (start/end date), display ordering, and per-portal targeting |
| **Nudge messages** | Manage notification messages with type, audience targeting, and scheduling |
| **Media manager** | Upload images, videos, PDFs to Google Cloud Storage with folder organization |
| **Text content** | Store and edit multilingual page content (22 languages) as JSON in GCS |
| **Theme manager** | Upload theme files, switch active themes with history tracking |
| **RBAC** | Three roles: `super admin` → `admin` → `editor` with granular endpoint permissions |
| **Content scheduling** | Banners and nudges support `startDate`/`endDate` — expired content is automatically excluded |

---

## Data Model

```
Website ──── Portal (many)
               ├── Banner (many)       [scheduled, per-portal]
               └── NudgeMessage (many) [scheduled, per-portal]
         ├── Theme (one)              [currentTheme + history]
         └── Page (many)             [multilingual JSON in GCS]

User                                  [super admin / admin / editor]
```

### GCS Bucket Structure (per website)

```
{bucketName}/
├── media_content/
│   ├── banners/          ← uploaded banner images
│   └── videos/           ← uploaded video files
├── website_text_content/
│   └── home/
│       └── home.json     ← multilingual content JSON
└── theme_manager_Store/
    ├── current_theme/    ← what portals always consume
    ├── theme-dark/       ← saved theme snapshots
    └── theme-light/
```

---

## API Reference

### Authentication

```
POST /auth/login
Body: { email, password }
Response: { success: true, data: { token } }
```

All admin endpoints require: `Authorization: Bearer <token>`

### Public Content Delivery API (no auth)

These endpoints are called by iGOT portals at runtime:

```
GET /api/v1/portals                           # list active portals
GET /api/v1/portals/:portalId/banners         # active + scheduled banners
GET /api/v1/portals/:portalId/nudges          # active nudge messages
GET /api/v1/portals/:portalId/theme           # current theme files + URLs
GET /api/v1/portals/:portalId/pages/:pageId   # multilingual page content
GET /api/v1/portals/:portalId/media           # all media assets with URLs
```

**Content scheduling logic** — banners and nudges are only returned when:
- `isActive: true`, AND
- Current date is within `startDate`–`endDate` window (if set)

**Example response** — `GET /api/v1/portals/learner/banners`:
```json
{
  "success": true,
  "data": [
    {
      "title": "Independence Day Course",
      "imageUrl": "https://storage.googleapis.com/igot-learner-bucket/media_content/banners/independence.jpg",
      "linkUrl": "/courses/independence-day",
      "displayOrder": 1
    }
  ]
}
```

### Portal Management (admin only)

```
POST   /portals              # create portal
GET    /portals              # list all portals
PUT    /portals/:id          # update portal
DELETE /portals/:id          # delete portal + cascade banners/nudges

POST   /portals/banners      # create banner
GET    /portals/banners?portalId=learner
PUT    /portals/banners/:id
DELETE /portals/banners/:id

POST   /portals/nudges       # create nudge message
GET    /portals/nudges?portalId=learner
PUT    /portals/nudges/:id
DELETE /portals/nudges/:id
```

### Website & Content Management

```
POST/GET/PUT/DELETE  /website/:id
GET/POST/DELETE      /web_gcp/content/:bucket/:pageId     # text content
POST/GET/DELETE      /web_media_gcp/media/:bucket         # media files
POST                 /theme_manager_Store_gcp/setTheme/:bucket/:folder
```

### RBAC Summary

| Endpoint group | super admin | admin | editor |
|---------------|-------------|-------|--------|
| User management | full | editors only | — |
| Websites | full | full | read |
| Portals/Banners/Nudges | full | full | read |
| Media upload | ✓ | ✓ | ✓ |
| Theme switch | ✓ | ✓ | — |
| Delete anything | ✓ | ✓ | — |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| File Storage | Google Cloud Storage |
| Authentication | JWT (jsonwebtoken + bcrypt) |
| Validation | express-validator |
| Rate Limiting | express-rate-limit |
| Email | Nodemailer (Gmail SMTP) |
| Frontend | React 18, Vite, Material-UI |
| Deployment | Netlify (frontend) |

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud Storage bucket + service account key
- Gmail account for email notifications

### Backend

```bash
cd Backend
npm install

# Copy and fill in environment variables
cp .env_example .env
```

**Required environment variables** (`.env`):

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/iGOT_CMS
JWT_SECRET=your-secret-key-minimum-32-characters-long
SENDERS_EMAIL=your@gmail.com
SENDERS_PASSWORD=your-gmail-app-password
CORS_ORIGINS=http://localhost:5173,https://your-frontend.netlify.app
GCS_KEY_FILE=./key.json
MAX_UPLOAD_SIZE_MB=10
LOG_LEVEL=info
PORT=3001
```

Place your Google Cloud service account key file at `./key.json` (in the `Backend/` directory). **Never commit this file.**

```bash
npm run dev    # starts with nodemon on port 3001
```

### Frontend

```bash
cd Frontend
npm install

# Set backend URL
echo "VITE_BACKEND_URL=http://localhost:3001" > .env

npm run dev    # starts on port 5173
```

### First Run — Create Super Admin

```bash
curl -X POST http://localhost:3001/auth/addSuperAdmin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","phone":"9999999999","password":"securepass123"}'
```

---

## Security

- JWT secret loaded from environment variable (never hardcoded)
- Rate limiting: 100 req/15min globally, 20 req/15min on auth endpoints
- Input validation on all endpoints via `express-validator`
- File uploads restricted to allowed MIME types with 10MB size limit
- CORS restricted to whitelisted origins
- Centralized error handler — raw errors never exposed to clients
- Passwords hashed with bcrypt (10 salt rounds)
- Live DB lookup on every authenticated request to verify user is still active

---

## Project Structure

```
CMS-iGOT-Karmyogi/
├── Backend/
│   └── src/
│       ├── app.js                        # Express entry, middleware wiring
│       ├── config/database.js            # MongoDB connection
│       ├── middleware/
│       │   ├── authMiddleware.js         # JWT verification + RBAC
│       │   ├── errorHandler.js           # Centralized error handler + AppError
│       │   ├── rateLimiter.js            # Rate limiting config
│       │   ├── uploadConfig.js           # Multer: size + MIME validation
│       │   └── validators.js             # express-validator chains
│       ├── models/                       # Mongoose schemas
│       │   ├── User.js / Website.js / Portal.js
│       │   ├── Banner.js / NudgeMessage.js
│       │   ├── Theme.js / Page.js
│       ├── routes/
│       │   ├── authRoutes.js             # /auth/*
│       │   ├── userManagementRoutes.js   # /user/*
│       │   ├── WebsiteRoutes.js          # /website/*
│       │   ├── portalManagementRoutes.js # /portals/* (admin)
│       │   ├── contentDeliveryRoutes.js  # /api/v1/* (public)
│       │   ├── TextContentManagerGCP.js  # /web_gcp/*
│       │   ├── MediaContentManagerGCP.js # /web_media_gcp/*
│       │   └── ThemeManagerGCP.js        # /theme_manager_Store_gcp/*
│       └── utils/logger.js               # Structured JSON logger
└── Frontend/
    └── src/
        ├── pages/                        # Route-level page components
        ├── sections/                     # Feature UI: ContentUpdater, ThemeManager, etc.
        ├── routes/hooks/use-auth.js      # JWT guard + redirect
        └── utils/api.js                  # Axios instance with auth interceptor
```
