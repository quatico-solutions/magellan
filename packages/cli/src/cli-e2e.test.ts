/* eslint-disable  @typescript-eslint/no-require-imports */
/* eslint-disable  @typescript-eslint/no-var-requires */
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type Compiler } from "@quatico/websmith-core";
import { Command } from "commander";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { addCompileCommand } from "./compiler/command";
import { ModuleResolver } from "./compiler/module-resolver";

/**
 * End-to-End Integration Tests
 *
 * These tests verify the complete Magellan flow:
 * 1. Compile service functions with --server
 * 2. Compile client proxies with --client
 * 3. Start an Express server with compiled functions
 * 4. Make HTTP requests through the full stack
 * 5. Verify context propagation and parameter handling
 */

const getTestDirs = () => {
    const testId = expect.getState().currentTestName?.replace(/[^a-zA-Z0-9]/g, "_") || "unknown";
    const timestamp = Date.now();
    const uniqueId = `${testId}_${timestamp}`;
    const PROJECT_DIR = path.resolve(__dirname, "..", `test-e2e-${uniqueId}`);
    const OUTPUT_DIR = path.resolve(PROJECT_DIR, "dist");
    const SOURCE_DIR = path.join(PROJECT_DIR, "src");
    const CLIENT_DIR = path.join(OUTPUT_DIR, "client");
    const SERVER_DIR = path.join(OUTPUT_DIR, "server");
    return { PROJECT_DIR, OUTPUT_DIR, SOURCE_DIR, CLIENT_DIR, SERVER_DIR };
};

jest.mock("./compiler/module-resolver", () => ({
    ModuleResolver: {
        resolve: jest.fn(),
        resolveAddonsDir: jest.fn(),
        resolveRelative: jest.fn(),
    },
}));

let testDirs: ReturnType<typeof getTestDirs>;
const mockModuleResolver = jest.mocked(ModuleResolver);

describe("Magellan End-to-End Integration", () => {
    let originalCwd: string;

    beforeEach(() => {
        testDirs = getTestDirs();
        originalCwd = process.cwd();

        // Clean up and create test directories
        try {
            fs.rmSync(testDirs.PROJECT_DIR, { recursive: true, force: true });
        } catch (_error) {
            // Ignore if directory doesn't exist
        }

        fs.mkdirSync(testDirs.SOURCE_DIR, { recursive: true });
        fs.mkdirSync(testDirs.CLIENT_DIR, { recursive: true });
        fs.mkdirSync(testDirs.SERVER_DIR, { recursive: true });

        mockModuleResolver.resolveAddonsDir.mockReturnValue(path.resolve(__dirname, "../../addons/lib"));
        mockModuleResolver.resolveAddonsDir.mockClear();
    });

    afterEach(() => {
        // Restore working directory
        try {
            if (originalCwd && originalCwd !== process.cwd()) {
                process.chdir(originalCwd);
            }
        } catch (error) {
            console.warn(`Failed to restore working directory: ${error}`);
        }

        // Clean up test directories
        if (testDirs) {
            try {
                fs.rmSync(testDirs.PROJECT_DIR, { recursive: true, force: true });
            } catch (_error) {
                // Ignore cleanup errors
            }
        }
    });

    it("should handle full client-to-server flow with context propagation", async () => {
        // Step 1: Create a service function
        createSourceFile(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            export interface UserInput {
                userId: string;
            }

            export interface UserData {
                userId: string;
                name: string;
                requestId?: string;
            }

            // @service()
            export const getUser = async (input: UserInput, context?: Context, _serialization?: Serialization): Promise<UserData> => {
                return {
                    userId: input.userId,
                    name: "John Doe",
                    requestId: context?.server?.["x-request-id"] as string | undefined,
                };
            };
            `,
            "user-service.ts"
        );

        // Step 2: Compile server-side code
        createTsConfigFile({
            outDir: testDirs.SERVER_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });

        executeCompiler(`--server --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

        // Verify server compilation produced natural signature
        const serverCode = getOutput("server/user-service.js");
        expect(serverCode).toBeDefined();
        expect(serverCode).toContain("const getUser =");
        expect(serverCode).toContain("async (input, context, _serialization)"); // Natural signature, no destructuring
        expect(serverCode).not.toContain("{ input }"); // Should NOT have object destructuring

        // Step 3: Compile client-side proxies
        createTsConfigFile({
            outDir: testDirs.CLIENT_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });

        executeCompiler(`--client --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

        // Verify client compilation produced remoteInvoke call
        const clientCode = getOutput("client/user-service.js");
        expect(clientCode).toBeDefined();
        expect(clientCode).toContain("remoteInvoke");
        expect(clientCode).toContain("data: input"); // Client passes parameters directly (unwrapped)

        // Step 4: Start Express server with compiled function
        const app = express();
        const { Sdk } = require("@quatico/magellan-server");
        const { createFunctionRoute } = require("@quatico/magellan-server");

        // Load the compiled server function
        // We need to clear require cache to ensure fresh load
        const serverFunctionPath = path.join(testDirs.SERVER_DIR, "user-service.js");
        delete require.cache[require.resolve(serverFunctionPath)];
        const { getUser } = require(serverFunctionPath);

        const sdk = new Sdk();
        sdk.registerFunction("getUser", getUser);

        // Use multer to parse multipart/form-data
        const multer = require("multer");
        app.use(multer().any());
        app.use("/api", createFunctionRoute(sdk));

        // Step 5: Make HTTP request through the full stack
        // Use supertest which works directly with the Express app (no need to actually start server)
        const request = require("supertest");

        const res = await request(app)
            .post("/api")
            .set("Accept", "application/json")
            .set("x-request-id", "test-request-123")
            .field("name", "getUser")
            .field("data", JSON.stringify({ userId: "user-123" })) // Client passes parameters directly (unwrapped)
            .field("namespace", "default");

        expect(res.status).toBe(200);

        // Step 6: Verify the response
        const { unpackPayload } = require("@quatico/magellan-shared");
        const result = unpackPayload(res.body);

        expect(result.data).toEqual({
            userId: "user-123",
            name: "John Doe",
            requestId: "test-request-123", // Context was propagated!
        });
    }, 30000); // 30 second timeout for this comprehensive test

    it("should handle direct SDK invocation with unwrapped parameters", async () => {
        // Step 1: Create a service function
        createSourceFile(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            export interface OrderInput {
                orderNumber: string;
            }

            export interface OrderData {
                orderNumber: string;
                status: string;
                customerId?: string;
            }

            // @service()
            export const getOrderDetails = async (input: OrderInput, context?: Context, _serialization?: Serialization): Promise<OrderData> => {
                return {
                    orderNumber: input.orderNumber,
                    status: "shipped",
                    customerId: context?.server?.customerId as string | undefined,
                };
            };
            `,
            "order-service.ts"
        );

        // Step 2: Compile server-side code
        createTsConfigFile({
            outDir: testDirs.SERVER_DIR,
            noEmit: false,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.Node10,
        });

        executeCompiler(`--server --project ${path.join(testDirs.PROJECT_DIR, "tsconfig.json")}`);

        // Step 3: Load compiled function and test direct invocation
        const serverFunctionPath = path.join(testDirs.SERVER_DIR, "order-service.js");
        delete require.cache[require.resolve(serverFunctionPath)];
        const { getOrderDetails } = require(serverFunctionPath);

        // Step 4: Direct SDK invocation (e.g., in BDD tests)
        const { Sdk } = require("@quatico/magellan-server");
        const sdk = new Sdk();
        sdk.registerFunction("getOrderDetails", getOrderDetails);

        // Direct invocation with unwrapped parameters - this is what BDD tests do
        const result = await sdk.invokeFunction(
            "getOrderDetails",
            { orderNumber: "ORD-12345" }, // Unwrapped input - no { input: ... } wrapper needed!
            "default",
            { server: { customerId: "CUST-999" } }
        );

        // Step 5: Verify result
        expect(result).toEqual({
            orderNumber: "ORD-12345",
            status: "shipped",
            customerId: "CUST-999", // Context was propagated!
        });
    });

    // Helper functions
    const executeCompiler = (args = "", compiler?: Compiler) => {
        process.chdir(testDirs.PROJECT_DIR);
        const argArray = args.split(/\s+/).filter(arg => arg.length > 0);
        addCompileCommand(new Command(), compiler).parse(argArray, { from: "user" });
    };

    const createTsConfigFile = (config: ts.CompilerOptions) => {
        const normalizedConfig = {
            ...config,
            ...(config.target !== undefined && {
                target: ts.ScriptTarget[config.target] === "Latest" ? "esnext" : ts.ScriptTarget[config.target].toLowerCase(),
            }),
            ...(config.module !== undefined && { module: ts.ModuleKind[config.module].toLowerCase() }),
            ...(config.moduleResolution !== undefined && {
                moduleResolution: ts.ModuleResolutionKind[config.moduleResolution].toLowerCase(),
            }),
        };

        const tsConfig = {
            compilerOptions: normalizedConfig,
            include: ["src/**/*"],
            exclude: ["node_modules", "dist"],
        };

        fs.writeFileSync(path.resolve(testDirs.PROJECT_DIR, "tsconfig.json"), JSON.stringify(tsConfig, null, 2), { encoding: "utf-8" });
    };

    const createSourceFile = (fileContent: string, fileName: string) => {
        fs.writeFileSync(path.resolve(testDirs.SOURCE_DIR, fileName), fileContent, { encoding: "utf-8" });
    };

    const getOutput = (filePath: string): string | undefined => {
        const fullPath = path.join(testDirs.OUTPUT_DIR, filePath);
        return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf-8") : undefined;
    };
});
