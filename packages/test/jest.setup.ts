/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

// Global test cleanup to ensure all processes are terminated
process.on("exit", () => {
    // Kill any remaining child processes
    const { execSync } = require("child_process");
    try {
        // Kill any remaining magellan serve processes
        execSync('pkill -f "magellan.js serve" || true', { stdio: "ignore" });
        execSync('pkill -f "magellan serve" || true', { stdio: "ignore" });
    } catch (e) {
        // Ignore errors - processes might not exist
    }
});

// Set up longer timeout for integration tests
jest.setTimeout(60000);

// Suppress console warnings during tests unless explicitly needed
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    console.warn = originalWarn;
    console.error = originalError;
});
