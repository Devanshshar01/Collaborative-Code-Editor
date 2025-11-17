import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.console = {
    ...console,
    error: jest.fn(), // Suppress error logs in tests
    warn: jest.fn(),
};
