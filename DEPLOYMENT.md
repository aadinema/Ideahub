# DEPLOYMENT.md

## Environment Setup

Copy `server/.env.example` to `server/.env` and fill all required values before starting.

```bash
cp server/.env.example server/.env
# Edit server/.env with your values
```

---

## MongoDB Connection Options

### Option A — Local Docker Compose (Development)
```bash
# docker-compose.yml excerpt:
# mongo:
#   image: mongo:7
#   ports: ["27017:27017"]
#   volumes: ["mongo_data:/data/db"]
MONGODB_URI=mongodb://localhost:27017/ideahub
```

### Option B — MongoDB Atlas (Recommended for Production)
1. Create an Atlas cluster in `ap-south-1` (Mumbai) — required for India data residency (FRD §16.3).
2. Whitelist your server IP in Atlas Network Access.
3. Create a database user with readWrite on `ideahub` database.
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/ideahub?retryWrites=true&w=majority
```
**At-rest encryption**: Atlas Enterprise tiers support encryption-at-rest with Customer Managed Keys. For standard tiers, MongoDB Atlas encrypts at rest by default using AWS/Azure/GCP managed keys. Document your encryption key management in your security runbook.

### Option C — On-Premise Replica Set
```
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/ideahub?replicaSet=rs0&authSource=admin
```
Replica set is required for Change Streams and transactions if implemented in Phase 2+.

---

## Running the Application

### Development
```bash
# Terminal 1 — Backend
cd server
npm run dev        # nodemon server.js

# Terminal 2 — Frontend
cd client
npm run dev        # Vite dev server at http://localhost:5173

# Seed database (first time only)
cd server
node seed/index.js
```

### Production Build
```bash
cd client && npm run build      # builds to client/dist/
# Serve client/dist/ via nginx or express static
# Server runs as: NODE_ENV=production node server/server.js
```

---

## Security Checklist (Pre-Production)

- [ ] Replace all placeholder JWT secrets with cryptographically random 64-byte hex strings:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] `NODE_ENV=production` in production .env
- [ ] TLS 1.2+ terminated at load balancer / nginx (not in Express — standard practice)
- [ ] MongoDB: enable network access restrictions; disable direct internet access
- [ ] Set `secure: true` on cookies (done automatically when `NODE_ENV=production`)
- [ ] Review CORS `CLIENT_ORIGIN` — must match exact prod domain
- [ ] Configure SMTP with production credentials (Exchange relay or approved provider)
- [ ] Run `npm audit --production` and remediate all high/critical vulnerabilities

---

## Horizontal Scaling

The API is stateless — JWT carries session state, refresh tokens stored in MongoDB.  
Scale horizontally by:
1. Running multiple Node.js instances behind a load balancer (nginx, AWS ALB)
2. Using MongoDB Atlas connection pooling (default pool size: 5; increase as needed)
3. File storage must use S3-compatible backend (not local disk) when running multiple instances
4. **Scheduled Jobs**: In-process chron jobs (SLA checks, auto-close) must be moved to a durable distributed worker (e.g., BullMQ + Redis) to prevent duplicate execution across instances.
5. **Caching**: In-memory dashboard caches must be replaced with a distributed cache like Redis to maintain consistency across horizontally scaled pods.

---

## Data Retention

Idea data and AuditLog must be retained for **7 years** (FRD NFR Audit & Compliance).  
- AuditLog: no TTL index. Archive to cold storage (S3 Glacier / tape) after 2 years.
- Notification: TTL index auto-removes after 90 days (configurable in `Notification.js`).
- RefreshToken: TTL index auto-removes expired tokens.
- Implement a monthly MongoDB archival job for AuditLog (document in operations runbook).

---

## RTO / RPO Targets (FRD NFR)
- RTO ≤ 4 hours
- RPO ≤ 1 hour

Atlas: enable continuous cloud backup with point-in-time restore (PITR) for RPO ≤ 1 hour.  
On-prem: configure replica set with oplog retention ≥ 2 hours; schedule hourly mongodump to off-site storage.
