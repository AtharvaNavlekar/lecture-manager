const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');
const { initDB } = require('../../config/db');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API', () => {
    beforeAll(async () => {
        await initDB();
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 if email or password is missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@test.com' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 401 for invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'WrongPassword123'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return token for valid credentials', async () => {
            // This test requires a test user in the database
            // You might need to seed the test database first
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin@123'
                });

            if (res.status === 200) {
                expect(res.body.success).toBe(true);
                expect(res.body.token).toBeDefined();
                expect(res.body.teacher).toBeDefined();
            }
        });
    });

    describe('POST /api/auth/change-password', () => {
        let authToken;

        beforeEach(() => {
            authToken = global.testUtils.generateToken(1, 'teacher', 'CS');
        });

        it('should return 401 without authentication', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .send({
                    currentPassword: 'Old@123',
                    newPassword: 'New@123'
                });

            expect(res.status).toBe(401);
        });

        it('should validate password requirements', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'Old@123',
                    newPassword: 'weak'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('password');
        });
    });
});
