/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { TargetConfig } from "@quatico/websmith-api";

export interface MagellanConfig extends TargetConfig {
    functionsDir: string;
    configFilePath?: string;
    config?: string;
    debug: boolean;
    hostname: string;
    port: number;
    project: string;
    targets?: Record<string, CompilationConfig>;
}

export type CompilationConfig = {
    addons?: string[];
    writeFile?: boolean;
    options?: ts.CompilerOptions;
};

export type CompilerOptions = {
    configFilePath?: string;
    functionsDir: string;
    addons?: {
        client?: string[];
        server?: string[];
        all?: string[];
    };

    targets?: {
        client?: CompilationOptions;
        server?: CompilationOptions;
        all?: CompilationOptions;
    };

    addonsDir: string;
    buildDir?: string;
    config?: string;
    debug: boolean;
    hostname: string;
    port: number;
    project: string;
    serverModuleDir: string; // FIXME: No longer required because we integrate this into the CompilationOptions.options.outDir of the server target.
    sourceMap?: boolean; // FIXME: No longer required because we integrate this into the CompilationOptions.options.outDir of the targets.
    target: string;
    watch: boolean;
};

export type CompilationOptions = {
    addons?: string[];
    writeFile?: boolean;
    options?: ts.CompilerOptions;
};
