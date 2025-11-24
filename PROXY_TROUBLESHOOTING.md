# Vite Proxy & Fetch API - Troubleshooting Guide

## Quick Fix

The Vite proxy is configured correctly! The main issue is ensuring all servers are running.

### Start All Servers

```bash
# Option 1: Use the startup script (Recommended)
./start-dev.sh

# Option 2: Manual start (for debugging specific services)
# Terminal 1 - API Server
cd packages/api && bun run dev

# Terminal 2 - Admin Web
cd packages/web && bun run dev

# Terminal 3 - Client Web
cd packages/client-web && bun run dev
```

## How the Proxy Works

```
Frontend Request:  /api/wallets
                   ↓
Vite Proxy:        strips /api → /wallets
                   ↓
API Server:        http://localhost:3000/wallets
                   ↓
Response:          Returns to frontend
```

## Configuration Details

### 1. Vite Config
- **Admin Web (`packages/web/vite.config.ts`)**: Port 5173
- **Client Web (`packages/client-web/vite.config.ts`)**: Port 5175
- **Proxy**: Both forward `/api` → `http://localhost:3000`
- **Logging**: Console shows all proxy requests

### 2. API Server (`packages/api/src/index.ts`)
- **Port**: 3000
- **CORS**: Configured for:
  - `http://localhost:5173` (Admin)
  - `http://localhost:5174` (Staff - reserved)
  - `http://localhost:5175` (Client)

## Common Issues & Solutions

### Issue 1: "Network Error" or "Failed to fetch"

**Symptoms:**
- Console shows: `GET http://localhost:5175/api/wallets net::ERR_CONNECTION_REFUSED`
- API calls fail silently

**Solution:**
```bash
# Check if backend is running
lsof -i :3000

# If not running, start it
cd packages/api
bun run dev
```

### Issue 2: CORS Errors

**Symptoms:**
- Console shows: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
The API already has CORS configured. If you see this error:
1. Make sure API server is running
2. Check API console for CORS logs
3. Verify frontend is on correct port (5173 or 5175)

### Issue 3: 404 Not Found

**Symptoms:**
- API returns 404 for valid routes
- Console shows: `GET http://localhost:3000/api/wallets 404`

**This means the proxy is NOT working!**

**Solution:**
1. Check Vite dev server logs for proxy messages
2. Verify `VITE_API_URL` in `.env` file
3. Restart Vite dev server

## Testing the Setup

### 1. Test API Server Directly
```bash
# Should return API info
curl http://localhost:3000/
```

### 2. Test Through Vite Proxy (Browser Console)
```javascript
// Run this in browser console (http://localhost:5173 or http://localhost:5175)
fetch('/api').then(r => r.json()).then(console.log)
```

## Debug Checklist

- [ ] API server is running on port 3000
- [ ] Admin Web is running on port 5173
- [ ] Client Web is running on port 5175
- [ ] `.env` files exist in both web packages with `VITE_API_URL=http://localhost:3000`
- [ ] Browser console shows proxy logs from Vite
- [ ] Network tab shows requests to `/api/*` with status 200/401

## Environment Variables

### packages/web/.env & packages/client-web/.env
```bash
VITE_API_URL=http://localhost:3000
```

### packages/api/.env
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
PORT=3000
```

## Logs

```bash
# API Server logs
tail -f logs/api.log

# Admin Web logs  
tail -f logs/web.log

# Client Web logs
tail -f logs/client-web.log
```

## Stop All Servers
```bash
# Kill all processes
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
lsof -ti:5175 | xargs kill -9
```
