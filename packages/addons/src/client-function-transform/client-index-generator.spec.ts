/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext } from "@quatico/websmith-api";
import type { System } from "typescript";
import { createClientIndexGenerator } from "./client-index-generator";

describe("createClientIndexGenerator", () => {
    const createMockContext = (
        files: Record<string, string>,
        outDir: string = "/project/lib"
    ): { context: AddonContext; writtenFiles: Map<string, string> } => {
        const writtenFiles = new Map<string, string>();

        const mockSystem: Partial<System> = {
            fileExists: (path: string) => path in files || writtenFiles.has(path),
            readFile: (path: string) => files[path] || writtenFiles.get(path),
            writeFile: (path: string, content: string) => {
                writtenFiles.set(path, content);
            },
        };

        const context = {
            getSystem: () => mockSystem as System,
            getCompilerOptions: () => ({ outDir }),
            getProfileConfig: () => ({}),
            getReporter: () => ({ reportDiagnostic: jest.fn() }),
        } as unknown as AddonContext;

        return { context, writtenFiles };
    };

    it("should generate index.js with exported async functions", () => {
        const jsContent = `
            "use strict";
            Object.defineProperty(exports, "__esModule", { value: true });
            exporgetDate = void 0;
            const magellan_client_1 = require("@quatico/magellan-client");
            export const getDate = async (_) => {
                return (0, magellan_client_1.remoteInvoke)({ name: "getDate", data: {}, namespace: "default" });
            };
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/service.js": jsContent,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/service.js"], context);

        expect(writtenFiles.has("/project/lib/index.js")).toBe(true);
        const indexContent = writtenFiles.get("/project/lib/index.js")!;
        expect(indexContent).toContain('export { getDate } from "./service"');
    });

    it("should generate index.d.ts alongside index.js", () => {
        const jsContent = `
            export const fetchData = async (params) => {
                return remoteInvoke({ name: "fetchData", data: params, namespace: "default" });
            };
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/data-service.js": jsContent,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/data-service.js"], context);

        expect(writtenFiles.has("/project/lib/index.d.ts")).toBe(true);
        const dtsContent = writtenFiles.get("/project/lib/index.d.ts")!;
        expect(dtsContent).toContain('export { fetchData } from "./data-service"');
    });

    it("should group multiple functions from same file", () => {
        const jsContent = `
            export const getUser = async (id) => {
                return remoteInvoke({ name: "getUser", data: { id }, namespace: "default" });
            };
            export const updateUser = async (data) => {
                return remoteInvoke({ name: "updateUser", data, namespace: "default" });
            };
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/user-service.js": jsContent,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/user-service.js"], context);

        const indexContent = writtenFiles.get("/project/lib/index.js")!;
        expect(indexContent).toContain('export { getUser, updateUser } from "./user-service"');
    });

    it("should handle multiple files", () => {
        const userServiceJs = `
            export const getUser = async (id) => {
                return remoteInvoke({ name: "getUser", data: { id }, namespace: "default" });
            };
        `;

        const productServiceJs = `
            export const getProduct = async (id) => {
                return remoteInvoke({ name: "getProduct", data: { id }, namespace: "default" });
            };
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/user-service.js": userServiceJs,
            "/project/lib/product-service.js": productServiceJs,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/user-service.js", "/project/lib/product-service.js"], context);

        const indexContent = writtenFiles.get("/project/lib/index.js")!;
        expect(indexContent).toContain('export { getUser } from "./user-service"');
        expect(indexContent).toContain('export { getProduct } from "./product-service"');
    });

    it("should handle files in subdirectories", () => {
        const jsContent = `
            export const getCategory = async (id) => {
                return remoteInvoke({ name: "getCategory", data: { id }, namespace: "default" });
            };
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/services/category-service.js": jsContent,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/services/category-service.js"], context);

        const indexContent = writtenFiles.get("/project/lib/index.js")!;
        expect(indexContent).toContain('export { getCategory } from "./services/category-service"');
    });

    it("should not generate anything when no files provided", () => {
        const { context, writtenFiles } = createMockContext({});

        const generator = createClientIndexGenerator();
        generator([], context);

        expect(writtenFiles.size).toBe(0);
    });

    it("should not generate anything when no outDir configured", () => {
        const jsContent = `
            export const getData = async () => {
                return remoteInvoke({ name: "getData", data: {}, namespace: "default" });
            };
        `;

        const writtenFiles = new Map<string, string>();

        const mockSystem: Partial<System> = {
            fileExists: (path: string) => path === "/project/lib/service.js",
            readFile: (path: string) => (path === "/project/lib/service.js" ? jsContent : undefined),
            writeFile: (path: string, content: string) => {
                writtenFiles.set(path, content);
            },
        };

        const context = {
            getSystem: () => mockSystem as System,
            getCompilerOptions: () => ({}), // No outDir
            getProfileConfig: () => ({}),
            getReporter: () => ({ reportDiagnostic: jest.fn() }),
        } as unknown as AddonContext;

        const generator = createClientIndexGenerator();
        generator(["/project/lib/service.js"], context);

        expect(writtenFiles.size).toBe(0);
    });

    it("should skip non-async exported functions", () => {
        const jsContent = `
            export const helper = (x) => x * 2;
            export const asyncService = async (data) => {
                return remoteInvoke({ name: "asyncService", data, namespace: "default" });
            };
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/mixed.js": jsContent,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/mixed.js"], context);

        const indexContent = writtenFiles.get("/project/lib/index.js")!;
        expect(indexContent).toContain("asyncService");
        expect(indexContent).not.toContain("helper");
    });

    it("should handle export function declaration syntax", () => {
        const jsContent = `
            export async function processOrder(order) {
                return remoteInvoke({ name: "processOrder", data: order, namespace: "default" });
            }
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/order-service.js": jsContent,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/order-service.js"], context);

        const indexContent = writtenFiles.get("/project/lib/index.js")!;
        expect(indexContent).toContain('export { processOrder } from "./order-service"');
    });

    it("should skip existing index.js files in input", () => {
        const serviceJs = `
            export const getData = async () => {
                return remoteInvoke({ name: "getData", data: {}, namespace: "default" });
            };
        `;

        const existingIndexJs = `
            export * from "./service";
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/service.js": serviceJs,
            "/project/lib/index.js": existingIndexJs,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/service.js", "/project/lib/index.js"], context);

        const indexContent = writtenFiles.get("/project/lib/index.js")!;
        // Should overwrite with new generated content, not include old exports
        expect(indexContent).toContain('export { getData } from "./service"');
        expect(indexContent).not.toContain('export * from "./service"');
    });

    it("should include auto-generated header comment", () => {
        const jsContent = `
            export const getData = async () => {
                return remoteInvoke({ name: "getData", data: {}, namespace: "default" });
            };
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/service.js": jsContent,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/service.js"], context);

        const indexContent = writtenFiles.get("/project/lib/index.js")!;
        expect(indexContent).toContain("Auto-generated");
        expect(indexContent).toContain("Do not edit manually");
    });

    it("should filter out .d.ts and .map files", () => {
        const jsContent = `
            export const getData = async () => {
                return remoteInvoke({ name: "getData", data: {}, namespace: "default" });
            };
        `;

        const { context, writtenFiles } = createMockContext({
            "/project/lib/service.js": jsContent,
        });

        const generator = createClientIndexGenerator();
        generator(["/project/lib/service.js", "/project/lib/service.d.ts", "/project/lib/service.js.map"], context);

        const indexContent = writtenFiles.get("/project/lib/index.js")!;
        expect(indexContent).toContain('export { getData } from "./service"');
        // Should only have one export line
        const exportLines = indexContent.split("\n").filter(l => l.startsWith("export"));
        expect(exportLines.length).toBe(1);
    });
});
