# Phase 3: Auth & Token Handling — Implementation Summary

## Overview
Phase 3 addresses the critical browser security risk of storing access tokens in localStorage and implements account lockout protection against brute-force attacks.

## Changes Made

### 1. Token Storage Security (localStorage → in-memory + httpOnly cookie)

**Client-side changes (`client/src/store/authSlice.js`):**
- **BEFORE:** Access token persisted in localStorage (`localStorage.setItem('ideahub_token', accessToken)`)
- **AFTER:** Access token held in memory only (Redux state), never written to localStorage
- User info still persists in localStorage (non-sensitive, used for app state on reload)
- Refresh token remains in httpOnly, secure, sameSite=strict cookie (server-side only)

**Why this matters:**
- Any XSS vulnerability could have exfiltrated localStorage tokens
- In-memory tokens are cleared on page refresh (frontend must call `/api/auth/refresh` to get new access token)
- httpOnly cookies are inaccessible to JavaScript, preventing XSS token theft
- Refresh token rotation provides a second defense layer

**Token lifecycle:**
1. Login: Backend issues access token + refresh token (in httpOnly cookie)
2. App load: User is null, access token is null; Axios interceptor calls `/api/auth/refresh`
3. Refresh endpoint: Returns new access token, sets new refresh token cookie
4. Protected requests: Use in-memory access token until expiry (15 min)
5. Expiry: Axios interceptor queues refresh, gets new access token
6. Logout: Refresh token invalidated; app clears Redux state

---

### 2. Account Lockout Protection

**Server model changes (`server/models/User.js`):**
- Added `failedLoginAttempts: Number` (tracks count)
- Added `lockUntil: Date` (when account is locked until; null = not locked)
- Added `isLocked()` method: returns true if lockUntil > now
- Added `incFailedAttempts()` method: increments attempts, locks if >= 5 attempts (15-min lockout)
- Added `resetFailedAttempts()` method: resets count and unlock (called on successful login)

**Server controller changes (`server/controllers/authController.js`):**
- Login flow now:
  1. Fetch user with password hash
  2. **Check if account is locked** — return 423 "Account is locked" if lockUntil > now
  3. Compare password
  4. **If password mismatch:** increment failed attempts, save user, return 401 "Invalid credentials"
  5. **If password matches:** reset failed attempts to 0, unlock, save user, proceed with token generation

**Lockout parameters:**
- Threshold: 5 failed login attempts
- Duration: 15 minutes
- Response: HTTP 423 (Locked), message includes minutes remaining
- Reset: Automatic on successful login

**Test coverage:**
- Account locked after 5 failed attempts (6th attempt returns 423)
- Successful login resets failed attempts to 0 and clears lockUntil
- Rate limiting still applies per IP (20 failed per 15 min on /api/auth/login)

---

### 3. Security Headers (CSP and beyond)

**New middleware (`server/middleware/securityHeaders.js`):**
- **Content-Security-Policy:** Restrictive by default
  - `default-src 'self'`: only load from same origin
  - `script-src 'self'`: JavaScript only from same origin (no inline, no eval)
  - `style-src 'self' 'unsafe-inline'`: CSS from same origin (unsafe-inline for Tailwind compatibility; consider nonce-based approach in production)
  - `img-src 'self' data:`: images from same origin or data URIs
  - `font-src 'self'`: fonts from same origin only
  - `connect-src 'self'`: XHR/WebSocket to same origin only
  - `frame-ancestors 'none'`: cannot be embedded in iframes
  - `form-action 'self'`: forms post to same origin only
  - `upgrade-insecure-requests`: redirect http to https in production

- **X-Content-Type-Options: nosniff** — Prevent MIME type sniffing attacks
- **X-Frame-Options: DENY** — Prevent clickjacking
- **Referrer-Policy: strict-origin-when-cross-origin** — Control referrer leakage
- **Permissions-Policy** — Disable sensitive browser features (camera, microphone, geolocation, payment)

**Server integration (`server/server.js`):**
- securityHeaders middleware added after Helmet
- Applied to all responses

**Test coverage:**
- CSP header present and contains expected directives
- X-Content-Type-Options set to nosniff
- X-Frame-Options set to DENY

---

### 4. CLIENT_ORIGIN Fail-Closed Configuration

**Server CORS changes (`server/server.js`):**
- **BEFORE:** `origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'` — Default to localhost silently
- **AFTER:** Explicit check in production:
  ```javascript
  if (!clientOrigin && process.env.NODE_ENV === 'production') {
    throw new Error('CLIENT_ORIGIN required in production. Without it, CORS rejects all cross-origin requests...')
  }
  ```

**Why this matters:**
- Production deployment MUST set CLIENT_ORIGIN explicitly
- Without CLIENT_ORIGIN in production, the server throws at startup (fail closed)
- Prevents silent fallback to localhost CORS config in production
- Forces operator to consciously enable CORS for specific frontend origin

**Deployment requirement:**
```bash
# Production deployment MUST set:
CLIENT_ORIGIN=https://ideahub.company.com node server.js

# Or as environment variable:
export CLIENT_ORIGIN=https://ideahub.company.com
npm run prod
```

---

## Test Coverage

### Server Auth Tests (`server/__tests__/auth.integration.test.js`)

**Account Lockout:**
- ✅ `[DENY] Account locked after 5 failed login attempts` — 6th attempt returns 423
- ✅ `[ALLOW] Successful login resets failed attempts to 0` — lockUntil cleared

**Security Headers:**
- ✅ `[CHECK] CSP header present` — contains default-src, script-src, etc.
- ✅ `[CHECK] X-Content-Type-Options set to nosniff`
- ✅ `[CHECK] X-Frame-Options set to DENY`

### Client Auth Tests (`client/src/__tests__/auth.test.jsx`)

**Token Storage:**
- ✅ `[SECURITY] Access token NOT persisted to localStorage` — ideahub_token should be null
- ✅ `[ALLOW] User info persisted to localStorage` — ideahub_user should exist
- ✅ `[SECURITY] Access token held in memory only` — only in Redux state

---

## Security Improvements Summary

| Risk | Before | After | Impact |
|------|--------|-------|--------|
| **XSS token theft** | Access token in localStorage; XSS exfiltrates token | In-memory access token + httpOnly refresh cookie | XSS cannot steal access token; refresh token inaccessible to JS |
| **Brute-force login** | Rate limiting only (20/15min); no account lockout | Account lockout: 5 attempts → 15-min lockout | Attackers can't guess weak passwords at scale |
| **Clickjacking** | No X-Frame-Options | X-Frame-Options: DENY | Page cannot be embedded in iframe attacks |
| **MIME sniffing** | No header | X-Content-Type-Options: nosniff | Browser won't re-interpret content types |
| **Cross-site scripting** | No CSP | Strict CSP (default-src 'self') | Inline scripts and resource injection blocked |
| **Production misconfiguration** | Silent fallback to localhost | Startup error if CLIENT_ORIGIN missing | Operator cannot accidentally deploy with wrong CORS config |

---

## Migration Checklist

- [ ] Verify client build with updated authSlice.js (access token in memory)
- [ ] Test login flow: user receives access token in response, can make API calls
- [ ] Test refresh: on app reload, Axios interceptor calls /api/auth/refresh
- [ ] Test expired token: after 15 min, API returns 401, interceptor refreshes
- [ ] Test account lockout: make 5 failed login attempts, verify 6th returns 423
- [ ] Test rate limiting: still applies (20/15min on /api/auth/login)
- [ ] Verify security headers: check browser DevTools Network → Response Headers
- [ ] Verify CSP: no console errors about blocked scripts/styles
- [ ] Production deployment: set CLIENT_ORIGIN=https://ideahub.company.com before starting

---

## Known Limitations & Future Work

1. **CSP with unsafe-inline for styles:** Tailwind CSS requires style-src 'unsafe-inline'. In production, consider:
   - Using nonce-based CSP (`style-src 'nonce-{random}'`) with Express middleware
   - Extracting critical CSS and inlining only critical styles
   - Using a build-time CSS extraction tool

2. **Account lockout duration:** Fixed 15 minutes. Future improvements:
   - Progressive delays (1 min → 5 min → 15 min after repeated lockouts)
   - Admin unlock capability
   - Email notification on lockout

3. **Token refresh on app load:** Currently relies on Axios interceptor. Future improvements:
   - Preload token in App.jsx initialization
   - Add loading state while fetching initial token
   - Handle offline scenarios gracefully

4. **Cross-tab logout:** Clearing one tab's Redux state doesn't affect other tabs. Future:
   - Use BroadcastChannel API to sync logout across tabs
   - Use localStorage 'storage' event for fallback

---

## Files Modified

| File | Change |
|------|--------|
| `client/src/store/authSlice.js` | Removed localStorage storage for access token |
| `server/models/User.js` | Added account lockout fields and methods |
| `server/controllers/authController.js` | Added lockout checks and failed attempt tracking |
| `server/middleware/securityHeaders.js` | NEW — CSP and security headers middleware |
| `server/server.js` | Added securityHeaders middleware; updated CORS fail-closed check |
| `server/__tests__/auth.integration.test.js` | Added account lockout and security header tests |
| `client/src/__tests__/auth.test.jsx` | Added token storage security tests |

---

## Verification Steps

### Run Authorization + Auth Tests
```bash
cd server
npm run test -- __tests__/auth.integration.test.js
# Expected: All tests pass, including lockout and security header checks
```

### Run Client Tests
```bash
cd client
npm run test -- __tests__/auth.test.jsx
# Expected: Token storage tests pass (access token not in localStorage)
```

### Manual Testing

1. **Token Storage:**
   - Login in browser
   - Open DevTools → Application → Local Storage
   - Verify `ideahub_user` exists, `ideahub_token` does NOT exist

2. **Security Headers:**
   - Login in browser
   - Open DevTools → Network → any API request
   - Response Headers should include:
     - `content-security-policy: default-src 'self'; script-src 'self'; ...`
     - `x-content-type-options: nosniff`
     - `x-frame-options: DENY`

3. **Account Lockout:**
   - Failed login attempt 1-4: Returns 401 "Invalid credentials"
   - Failed login attempt 5: Returns 401 "Invalid credentials"
   - Failed login attempt 6: Returns 423 "Account is locked... 15 minutes"
   - Successful login (after lockout expires): Returns 200, resets attempts

---

## Next Phase (Phase 4: Validation & Uploads)

Will address:
- Input validation with express-validator schemas
- MIME type validation and content sniffing for uploads
- S3 configuration and signed download URLs
- Safe filename handling and malware scanning integration
