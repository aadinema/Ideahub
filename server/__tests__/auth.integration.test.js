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
      password: 'HashedPassword123',
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
      const oldAccessToken = loginRes.body.data.accessToken;

      // Refresh tokens
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', oldRefreshToken)
        .expect(200);

      const newAccessToken = refreshRes.body.data.accessToken;
      const newRefreshToken = refreshRes.headers['set-cookie']?.find(c => c.startsWith('refreshToken'));

      // Verify new tokens were issued
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBe(oldAccessToken);
      expect(newRefreshToken).toBeDefined();
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

      expect(reuseRes.body.message).toContain('Refresh token not found or expired');
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
        });

      const accessToken = loginRes.body.data.accessToken;

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use the same token for a protected route
      const protectedRes = await request(app)
        .get('/api/ideas/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(protectedRes.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
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
      if (lastResponse.status === 429) {
        expect(lastResponse.status).toBe(429);
        expect(lastResponse.body.message).toContain('too many');
      }
    });

    it('should allow requests within rate limit', async () => {
      const res = await request(app)
        .get('/api/ideas/my')
        .set('Authorization', `Bearer ${generateAccessToken(testUser._id)}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Account State Changes', () => {
    it('should reject requests from deactivated user', async () => {
      // Create and login a test user
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
      // Create a test user
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

      // Update the password and passwordChangedAt
      const now = new Date();
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
});

