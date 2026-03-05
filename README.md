# RTLS Pilot Monitor

A **Real-Time Location System (RTLS)** monitoring dashboard for a hospital ICU pilot deployment. Built with React, TypeScript, Leaflet, and Tailwind CSS. The app visualizes live device positions on a floorplan map, manages an inventory of anchors and tags, tracks alerts, and provides analytics dashboards — all behind a role-based login system.

---

## Table of Contents

1. [What the App Does](#what-the-app-does)
2. [Pages & Features](#pages--features)
3. [Architecture Overview](#architecture-overview)
4. [User Roles & Authentication](#user-roles--authentication)
5. [Live Data: S3 Bucket Integration](#live-data-s3-bucket-integration)
6. [Environment Variables](#environment-variables)
7. [Running Locally](#running-locally)
8. [Deployment (GitHub Pages)](#deployment-github-pages)
9. [Project Structure](#project-structure)
10. [What's Mock vs. What's Real](#whats-mock-vs-whats-real)

---

## What the App Does

This dashboard monitors a hospital RTLS pilot that uses **UWB**, **BLE**, and **Wi-Fi RTT** anchor/tag hardware to track patients and assets in real time. The frontend is a static single-page app (SPA) that:

- Polls a JSON endpoint (backed by S3) every **2.5 seconds** for live device coordinates
- Renders device positions on an interactive **Leaflet** floorplan map
- Manages an inventory of **20 anchors** and **40 tags** (mock data, replaceable with real API)
- Tracks and triages **alerts** (geofence breach, low battery, anchor offline, etc.)
- Provides **historical playback** controls (time range selection, speed: 0.5x–1.5x)
- Shows **accuracy metrics** (RMSE, CEP50, CEP95) and **system health** (latency, packet loss, uptime)
- Enforces **role-based access** (admin, nurse, backend) with a 3-minute inactivity timeout

---

## Pages & Features

### 1. Login (`/login`)
- Username/password form with mock authentication
- Demo accounts shown on the login page
- Sessions persist in `localStorage` with a **3-minute inactivity auto-logout**

### 2. Overview (`/`)
- Summary cards: online anchors, active tags, open alerts, system latency
- Technology breakdown: UWB / BLE / Wi-Fi RTT anchor/tag counts and average RMSE
- Recent alerts list (top 5)

### 3. Live Map (`/map`)
- **Leaflet** map with `CRS.Simple` (no geographic tiles — uses a floorplan grid)
- Anchors rendered as colored circles (green = online, red = offline, yellow = degraded)
- Device tags rendered as dots, positions fetched from S3 every 2.5s
- **Zoom controls** (+/−) with zoom range 0–5
- Layer toggles: show/hide anchors, devices, geofences
- Geofence polygons drawn on the map (ICU Main Zone, Restricted Area)
- Stats overlay: online anchor count, device count, zone count, last update timestamp
- Click any marker to see details in a side drawer

### 4. Inventory (`/inventory`)
- **Anchors tab**: table of all anchors with ID, label, technology, status, firmware, last seen
- **Tags tab**: table of all tags with battery bar (color-coded: green > 50%, yellow > 20%, red ≤ 20%)
- **Network tab** (admin only): polls `/devices/network` every 5s for IP/MAC device info
- CSV export for each tab
- Global search results deep-link into this page with row highlighting

### 5. Alerts (`/alerts`)
- Filterable by severity (critical/warning/info), status (open/acked/resolved), and type
- One-click Acknowledge and Resolve actions
- Badge counts for open and critical alerts

### 6. Playback (`/playback`)
- Date/time range selector (start + end)
- Timeline scrubber slider
- Play/Pause, Skip ±10 min controls
- **Speed control**: 0.5x, 0.75x, 1x, 1.25x, 1.5x
- Map preview placeholder (ready for historical data integration)
- Mock event timeline showing geofence breaches, battery alerts, location updates

### 7. Dashboards (`/dashboards`)
- Accuracy metrics per technology (UWB, BLE, Wi-Fi RTT): RMSE, CEP50, CEP95
- System health cards: ingest latency, packet loss, uptime, average battery life
- Performance bars per network

### 8. Admin (`/admin`)
- **Floorplans tab**: upload SVG, view existing floorplans, anchor layout editor placeholder
- **Roles & Access tab** (admin only): lists all roles and their descriptions
- **API Keys tab** (admin + backend): manage API keys for external integrations
- **System tab**: configuration toggles (WebSocket reconnect, data retention, alert notifications, security/compliance settings)

### Global Search (⌘K)
- Searches across pages, anchors, tags, and alerts
- Keyboard navigation (arrow keys + Enter)
- Deep-links to Inventory with tab switching and row highlighting

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                         │
│                                                              │
│  React + TypeScript + Vite + Tailwind CSS                    │
│  ├── Zustand store (useRTLSStore)                            │
│  ├── Leaflet map (CRS.Simple, no tiles)                      │
│  ├── Role-based auth (LoginContext + AuthContext)             │
│  └── Polling fetch() every 2.5s                              │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTP GET (fetch, no-cache)
                           ▼
              ┌────────────────────────┐
              │   VITE_API_BASE_URL    │
              │   /ingest endpoint     │
              │                        │
              │  Returns JSON:         │
              │  {                     │
              │    "timestamp": "...", │
              │    "devices": [        │
              │      {                 │
              │        "id": "T-001",  │
              │        "x": 12.5,      │
              │        "y": 8.3,       │
              │        "room": "ICU-A" │
              │      }, ...            │
              │    ]                   │
              │  }                     │
              └──────────┬─────────────┘
                         │
                         ▼
              ┌────────────────────────┐
              │  S3 Bucket (or any     │
              │  static JSON host)     │
              │                        │
              │  A Lambda / script     │
              │  writes positions.json │
              │  to S3, CloudFront     │
              │  serves it publicly    │
              └────────────────────────┘
```

---

## User Roles & Authentication

Authentication is **mock-based** (hardcoded accounts in `LoginContext.tsx`). Replace the `login()` function with a real API call for production.

| Username   | Password      | Role      | Access                                                     |
|------------|---------------|-----------|-------------------------------------------------------------|
| `admin`    | `admin123`    | admin     | Full access to everything, including Network tab and RBAC   |
| `nurse`    | `nurse123`    | nurse     | Overview, Live Map, Inventory (anchors + tags), Alerts, Playback, Dashboards |
| `backend`  | `backend123`  | backend   | Overview, Live Map, Inventory, Alerts, Playback, Dashboards, Admin (API keys + system) |

### Role restrictions:
- **Network tab** in Inventory → admin only
- **Roles & Access tab** in Admin → admin only
- **API Keys tab** in Admin → admin + backend
- **3-minute inactivity timeout** → auto-logout (configurable in `LoginContext.tsx` via `INACTIVITY_TIMEOUT`)

---

## Live Data: S3 Bucket Integration

The **Live Map** page fetches device positions from a JSON endpoint. Here's exactly what you need to set up:

### Step 1: Create the S3 Bucket

1. Go to **AWS Console → S3 → Create bucket**
2. Name it something like `rtls-positions` (any name works)
3. **Uncheck** "Block all public access" (or use CloudFront for controlled access)
4. Create the bucket

### Step 2: Upload the JSON File

Your backend system (Lambda, cron job, or RTLS engine) needs to write a JSON file to S3 with this exact format:

```json
{
  "timestamp": "2026-03-05T14:30:00.000Z",
  "devices": [
    {
      "id": "T-001",
      "x": 12.5,
      "y": 8.3,
      "room": "ICU-A"
    },
    {
      "id": "T-002",
      "x": 25.1,
      "y": 14.7,
      "room": "ICU-B"
    }
  ]
}
```

**Field descriptions:**
| Field       | Type    | Required | Description                                         |
|-------------|---------|----------|-----------------------------------------------------|
| `timestamp` | string  | Yes      | ISO 8601 timestamp of when positions were recorded   |
| `devices`   | array   | Yes      | Array of device position objects                     |
| `devices[].id` | string | Yes   | Unique device/tag identifier (e.g. `"T-001"`)       |
| `devices[].x`  | number | Yes   | X coordinate in **meters** on the floorplan          |
| `devices[].y`  | number | Yes   | Y coordinate in **meters** on the floorplan          |
| `devices[].room`| string | No   | Optional room/zone name (shown in tooltip on map)    |

**Coordinate system:** The floorplan is 40m wide × 20m tall. `(0,0)` is the bottom-left corner. So `x` ranges from 0–40 and `y` ranges from 0–20.

### Step 3: Make the File Accessible via HTTP

**Option A: S3 Static Website Hosting**
1. Enable static website hosting on the bucket
2. Set the index document (doesn't matter, we're fetching a specific file)
3. Add a bucket policy to allow public reads:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::rtls-positions/*"
    }
  ]
}
```
4. Your endpoint will be: `http://rtls-positions.s3-website-us-east-1.amazonaws.com`

**Option B: CloudFront (Recommended)**
1. Create a CloudFront distribution pointing to the S3 bucket
2. Set caching TTL to a very low value (e.g. 1–2 seconds) or disable caching
3. Enable CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
```
4. Your endpoint will be: `https://d1234abcdef.cloudfront.net`

### Step 4: Set Up CORS on S3

Add this CORS configuration to your S3 bucket (under Permissions → CORS):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

### Step 5: Configure the Environment Variable

Set the `VITE_API_BASE_URL` environment variable to your endpoint URL (without trailing slash, without the `/ingest` path):

```bash
# In your .env file (for local development):
VITE_API_BASE_URL=https://d1234abcdef.cloudfront.net

# OR for GitHub Actions (add as a repository secret):
# Settings → Secrets → Actions → New repository secret
# Name: VITE_API_BASE_URL
# Value: https://d1234abcdef.cloudfront.net
```

The app will then fetch from: `https://d1234abcdef.cloudfront.net/ingest`

So your S3 JSON file needs to be accessible at the `/ingest` path. Either:
- Name the file `ingest` (no extension) in S3, OR
- Use an API Gateway / Lambda function at the `/ingest` path that reads from S3

### Step 6: Network Devices Endpoint (Admin Only)

If you want the admin-only **Network** tab to work, set up a `/devices/network` endpoint that returns:

```json
{
  "devices": [
    {
      "id": "NET-001",
      "label": "Switch-ICU-1",
      "ip": "192.168.1.10",
      "mac": "AA:BB:CC:DD:EE:01",
      "status": "online",
      "lastSeen": "2026-03-05T14:30:00.000Z"
    }
  ]
}
```

This endpoint is polled every **5 seconds** when an admin views the Network tab.

---

## Environment Variables

| Variable               | Required | Description                                           |
|------------------------|----------|-------------------------------------------------------|
| `VITE_API_BASE_URL`    | No*      | Base URL for the data API (S3/CloudFront/API Gateway). If not set, live data won't load and the map will show "S3 fetch failed" |
| `VITE_SUPABASE_URL`    | Auto     | Set automatically by Lovable Cloud                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto | Set automatically by Lovable Cloud             |

*Without `VITE_API_BASE_URL`, the app still works but shows mock data only on the map and "API URL not configured" on the Network tab.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:8080/capstone-realtime-localization/
```

The app runs at the `/capstone-realtime-localization/` base path (configured in `vite.config.ts`).

---

## Deployment (GitHub Pages)

The project includes a GitHub Actions workflow (`.github/workflows/static.yml`) for automatic deployment to GitHub Pages.

1. Push to the `main` branch
2. GitHub Actions builds the Vite project and deploys the `dist/` folder to GitHub Pages
3. Set any required secrets (like `VITE_API_BASE_URL`) in **Settings → Secrets → Actions**

The published site will be at: `https://<username>.github.io/capstone-realtime-localization/`

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          # Sidebar + top bar + role-based nav
│   │   └── GlobalSearch.tsx       # ⌘K search across assets/pages
│   ├── ui/                        # shadcn/ui components (button, card, etc.)
│   └── StatusBadge.tsx            # Reusable online/offline/degraded badge
├── contexts/
│   ├── LoginContext.tsx           # Authentication, session, inactivity timeout
│   └── AuthContext.tsx            # Role-based access (hasRole, RequireRole)
├── data/
│   └── mockData.ts               # 20 anchors, 40 tags, alerts, geofences, tracks
├── hooks/
│   └── use-mobile.tsx             # Mobile breakpoint hook
├── pages/
│   ├── Login.tsx                  # Login form with demo accounts
│   ├── Overview.tsx               # System summary dashboard
│   ├── LiveMap.tsx                # Leaflet map with S3 polling
│   ├── Inventory.tsx              # Anchor/Tag/Network tables with CSV export
│   ├── Alerts.tsx                 # Alert triage with filters
│   ├── Playback.tsx               # Historical replay controls
│   ├── Dashboards.tsx             # Accuracy & health metrics
│   ├── Admin.tsx                  # Floorplans, RBAC, API keys, system config
│   └── NotFound.tsx               # 404 page
├── store/
│   └── useRTLSStore.ts            # Zustand store for all RTLS state
├── types/
│   └── rtls.ts                    # TypeScript interfaces (Anchor, Tag, Alert, etc.)
├── App.tsx                        # Route definitions
├── main.tsx                       # Entry point
└── index.css                      # Tailwind + custom theme tokens
```

---

## What's Mock vs. What's Real

| Feature                    | Current State                        | To Make Real                                    |
|----------------------------|--------------------------------------|-------------------------------------------------|
| **Login/Auth**             | Mock accounts in LoginContext        | Replace `login()` with API call                 |
| **Anchor positions**       | Mock data in `mockData.ts`           | Fetch from your RTLS backend API                |
| **Tag positions (Live Map)** | ✅ Real — fetches from S3 endpoint  | Set `VITE_API_BASE_URL` env var                 |
| **Network devices**        | Fetches from API (empty if no API)   | Set `VITE_API_BASE_URL` + provide `/devices/network` |
| **Alerts**                 | Mock data in `mockData.ts`           | Connect to real alerting backend                |
| **Playback**               | UI only (no real data loading)       | Implement historical data fetching              |
| **Dashboard metrics**      | Hardcoded values                     | Connect to metrics API                          |
| **Floorplan upload**       | UI placeholder                       | Implement file upload + S3 storage              |
| **Geofences**              | Mock polygons in `mockData.ts`       | Connect to geofence management API              |

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (build tool, base path: `/capstone-realtime-localization/`)
- **Tailwind CSS** + **shadcn/ui** (component library)
- **Leaflet** + **react-leaflet** (floorplan map, no geographic tiles)
- **Zustand** (global state management)
- **React Router v6** (client-side routing)
- **Recharts** (charting, available but not heavily used yet)
- **Lucide React** (icons)
