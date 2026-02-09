// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_PATH = ':memory:'; // Use in-memory database for tests

// Mock console to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Global test utilities
global.testUtils = {
    generateToken: (userId, role = 'teacher', department = 'CS') => {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            { userId, role, department },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    },

    createTestUser: async (db) => {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('Test@123', 10);

        const result = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO teachers (name, email, password, department, post) VALUES (?, ?, ?, ?, ?)',
                ['Test User', 'test@test.com', hashedPassword, 'CS', 'Assistant Professor'],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });

        return result.id;
    }
};
