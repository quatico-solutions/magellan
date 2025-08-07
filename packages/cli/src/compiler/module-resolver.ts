/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import path from "path";

/**
 * Wrapper around require.resolve for easier testing
 */
export class ModuleResolver {
    /**
     * Resolves a module path using require.resolve
     */
    static resolve(modulePath: string): string {
        return require.resolve(modulePath);
    }

    /**
     * Resolves the addons directory specifically
     */
    static resolveAddonsDir(): string {
        try {
            return path.resolve(this.resolve("@quatico/magellan-addons/package.json"), "../lib");
        } catch (_ignored) {
            // Fallback to relative path during development/testing
            return path.resolve(__dirname, "../../addons/lib");
        }
    }

    /**
     * Resolves a path relative to a resolved module
     */
    static resolveRelative(modulePath: string, relativePath: string): string {
        return path.resolve(this.resolve(modulePath), relativePath);
    }
}
