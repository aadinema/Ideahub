/**
 * server/__tests__/auth.integration.test.js
 * Backend authentication integration tests — refresh rotation, reuse detection, logout, rate limiting.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { ROLES } = require('../../shared/constants');

// Helper to generate JWT
const generateAccessToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { sub: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

describe('Authentication Integration Tests', () => {
  let testUser;
  let testUserEmail = 'authtest@example.com';

  beforeAll(async () => {
    // Create a test user
    testUser = await User.create({
      name: 'Auth Test User',
      email: testUserEmail,
      password: 'TestPassword123', // hashed by the User pre('save') hook
      employeeId: 'AUTH001',
      department: 'Engineering',
      roles: [ROLES.EMPLOYEE],
      isActive: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUserEmail });
    await RefreshToken.deleteMany({ userId: testUser._id });
  });

  describe('Login', () => {
    it('should successfully log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'TestPassword123',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'WrongPassword',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Refresh Token Rotation', () => {
    it('should rotate refresh token on each refresh request', async () => {
      // Login first
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'TestPassword123',
        });

      const oldRefreshToken = loginRes.headers['set-cookie']?.find(c => c.startsWith('refreshToken'));

      // Refresh tokens
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', oldRefreshToken)
        .expect(200);

      const newAccessToken = refreshRes.body.data.accessToken;
      const newRefreshToken = refreshRes.headers['set-cookie']?.find(c => c.startsWith('refreshToken'));

      // Verify a new session was issued. Access tokens signed within the same
      // second are byte-identical (deterministic JWT payload), so rotation is
      // asserted on the refresh token — a freshly minted random token.
      expect(newAccessToken).toBeDefined();
      expect(newRefreshToken).toBeDefined();
      expect(newRefreshToken).not.toBe(oldRefreshToken);
    });

    it('should reject reuse of old refresh token after rotation', async () => {
      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'TestPassword123',
        });

      const firstRefresh = loginRes.headers['set-cookie']?.find(c => c.startsWith('refreshToken'));

      // First refresh (should succeed)
      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', firstRefresh)
        .expect(200);

      // Try to reuse the old token (should fail)
      const reuseRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', firstRefresh)
        .expect(401);

      // Reusing a rotated token is treated as theft: reuse detection revokes
      // the whole token family.
      expect(reuseRes.body.message).toContain('Session security violation');
    });
  });

  describe('Token Expiration', () => {
    it('should reject expired access token', async () => {
      // Create an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { sub: testUser._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '0s' } // Expired immediately
      );

      // Wait a moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .get('/api/ideas/my')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.message).toContain('expired');
    });
  });

  describe('Logout', () => {
    it('should invalidate refresh token on logout', async () => {
      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'TestPassword123',
        })
        .expect(200);

      const accessToken = loginRes.body.data.accessToken;
      const refreshCookie = loginRes.headers['set-cookie']?.find(c => c.startsWith('refreshToken'));
      expect(refreshCookie).toBeDefined();

      // Logout carrying the refresh cookie — server revokes the whole family.
      // (Access tokens stay stateless until expiry by design; sessions are
      // controlled at the refresh layer.)
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshCookie)
        .expect(200);

      // The revoked refresh token must no longer mint new sessions
      const reuseRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie)
        .expect(401);

      expect(reuseRes.body.success).toBe(false);
    });
  });

  describe('Account State Changes', () => {
    it('should reject requests from deactivated user', async () => {
      // Create and login a test user (clear leftovers from interrupted runs)
      await User.deleteOne({ email: 'tempuser@test.com' });
      const tempUser = await User.create({
        name: 'Temp User',
        email: 'tempuser@test.com',
        password: 'TempPass123',
        employeeId: 'TEMP001',
        department: 'Engineering',
        roles: [ROLES.EMPLOYEE],
        isActive: true,
      });

      const token = generateAccessToken(tempUser._id);

      // Deactivate the user
      await User.updateOne({ _id: tempUser._id }, { isActive: false });

      // Try to use the token
      const res = await request(app)
        .get('/api/ideas/my')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(res.body.message).toContain('deactivated');

      // Cleanup
      await User.deleteOne({ _id: tempUser._id });
    });

    it('should reject requests after password change', async () => {
      // Create a test user (clear leftovers from interrupted runs)
      await User.deleteOne({ email: 'passchange@test.com' });
      const tempUser = await User.create({
        name: 'Pass Change User',
        email: 'passchange@test.com',
        password: 'OldPassword123',
        employeeId: 'PASS001',
        department: 'Engineering',
        roles: [ROLES.EMPLOYEE],
        isActive: true,
      });

      const token = generateAccessToken(tempUser._id);

      // Update the password and passwordChangedAt. The middleware compares at
      // second granularity (iat vs floor(passwordChangedAt)), so the change
      // must land strictly after the token's issue second — hence +1s.
      const now = new Date(Date.now() + 1000);
      await User.updateOne(
        { _id: tempUser._id },
        { password: 'NewPassword123', passwordChangedAt: now }
      );

      // Try to use the old token (created before password change)
      const res = await request(app)
        .get('/api/ideas/my')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(res.body.message).toContain('Password recently changed');

      // Cleanup
      await User.deleteOne({ _id: tempUser._id });
    });
  });

  describe('Account Lockout', () => {
    it('should lock account after 5 failed login attempts', async () => {
      await User.deleteOne({ email: 'lockout@test.com' });
      const lockTestUser = await User.create({
        name: 'Lockout Test User',
        email: 'lockout@test.com',
        password: 'SecurePass123',
        employeeId: 'LOCK001',
        department: 'Engineering',
        roles: [ROLES.EMPLOYEE],
        isActive: true,
      });

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'lockout@test.com',
            password: 'WrongPassword',
          })
          .expect(401);
      }

      // 6th attempt should be locked (423 Locked)
      const lockedRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'lockout@test.com',
          password: 'SecurePass123', // even correct password is rejected
        })
        .expect(423);

      expect(lockedRes.body.message).toContain('locked');
      expect(lockedRes.body.message).toContain('15 minutes');

      // Cleanup
      await User.deleteOne({ _id: lockTestUser._id });
    });

    it('should reset failed attempts on successful login', async () => {
      await User.deleteOne({ email: 'resetattempts@test.com' });
      const resetTestUser = await User.create({
        name: 'Reset Test User',
        email: 'resetattempts@test.com',
        password: 'ValidPass123',
        employeeId: 'RESET001',
        department: 'Engineering',
        roles: [ROLES.EMPLOYEE],
        isActive: true,
      });

      // Make 2 failed attempts
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'resetattempts@test.com', password: 'WrongPass' })
        .expect(401);

      await request(app)
        .post('/api/auth/login')
        .send({ email: 'resetattempts@test.com', password: 'WrongPass' })
        .expect(401);

      // Verify failedLoginAttempts is 2
      let user = await User.findById(resetTestUser._id);
      expect(user.failedLoginAttempts).toBe(2);

      // Successful login should reset attempts
      const successRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'resetattempts@test.com', password: 'ValidPass123' })
        .expect(200);

      expect(successRes.body.success).toBe(true);

      // Verify failedLoginAttempts is reset to 0
      user = await User.findById(resetTestUser._id);
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockUntil).toBeNull();

      // Cleanup
      await User.deleteOne({ _id: resetTestUser._id });
    });
  });

  describe('Security Headers', () => {
    it('should include CSP header in responses', async () => {
      const res = await request(app)
        .get('/api/ideas/my')
        .set('Authorization', `Bearer ${generateAccessToken(testUser._id)}`)
        .expect(200);

      const cspHeader = res.headers['content-security-policy'];
      expect(cspHeader).toBeDefined();
      expect(cspHeader).toContain('default-src');
      expect(cspHeader).toContain('script-src');
    });

    it('should include X-Content-Type-Options header', async () => {
      const res = await request(app)
        .get('/api/ideas/my')
        .set('Authorization', `Bearer ${generateAccessToken(testUser._id)}`)
        .expect(200);

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const res = await request(app)
        .get('/api/ideas/my')
        .set('Authorization', `Bearer ${generateAccessToken(testUser._id)}`)
        .expect(200);

      expect(res.headers['x-frame-options']).toBe('DENY');
    });
  });

  describe('Rate Limiting', () => {
    // NOTE: this suite intentionally exhausts the per-IP login rate limiter
    // (max 20 failed attempts / 15 min), so it runs LAST — after every test
    // that still needs a successful login through /api/auth/login.
    it('should enforce login rate limiting', async () => {
      const attempts = [];

      // Make multiple failed login attempts
      for (let i = 0; i < 25; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: testUserEmail,
              password: 'WrongPassword',
            })
        );
      }

      const responses = await Promise.all(attempts);
      const lastResponse = responses[responses.length - 1];

      // After 20 attempts, should be rate limited
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.message).toContain('Too many login attempts');
    });

    it('should allow requests within rate limit', async () => {
      const res = await request(app)
        .get('/api/ideas/my')
        .set('Authorization', `Bearer ${generateAccessToken(testUser._id)}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});

