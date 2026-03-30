# Uber Mini Clone 🚗

Full-stack Uber-like ride booking app with rider/driver flows, real-time matching (50km radius), maps, OTP security.

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local `mongod` or MongoDB Atlas)
- Copy `backend/.env.example` → `backend/.env` & update vars

### 2. Backend Setup
```bash
cd backend
npm install
# Copy .env.example → .env, set MONGO_URI & JWT_SECRET
npm start
```
Server runs on http://localhost:5000

### 3. Frontend Dev
```bash
npm install
npm run dev
```
App at http://localhost:5173

### 4. Test Flows
1. **Rider**: Signup/Login → Home → Book ride (uses current loc/addresses)
2. **Driver**: Signup (driver role + DL#) → /driver → Toggle \"Go online\" (shares loc) → Accept incoming → OTP verify → Route
3. **Matching**: Auto-assigns nearest available driver within 50km
4. **Maps**: Leaflet + OSRM routes, current geo prioritized

## Troubleshooting 500 Errors
```
1. Start MongoDB: `mongod` (or set MONGO_URI=... in backend/.env)
2. Backend: cd backend && npm start (check console for DB connect)
3. Frontend connects automatically to localhost:5000
4. Test API: http://localhost:5000/api/auth/health
```

## Features Implemented ✅
- Rider booking (50km max, vehicle types, live fares)
- Driver dashboard (availability toggle, live GPS, accept/OTP/route)
- Real-time polling (pending rides, driver loc)
- Secure auth (JWT, bcrypt)
- Maps: Geolocation, nominatim geocoding, OSRM shortest routes
- Responsive UI (Tailwind, Framer Motion wheel/car anims)

## Tech Stack
```
Frontend: React 18 + Vite + Tailwind + Leaflet + Framer Motion
Backend: Node/Express + MongoDB + JWT
Utils: OSRM routing, haversine distance
```

