/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

export interface CliArguments {
    addonsDir: string;
    config?: string;
    debug: boolean;
    // functionsDir: string;        MOVED to addConfig
    hostname: string;
    port: number;
    project: string;
    // serverModuleDir: string;     MOVED to serve
    // sourceMap?: boolean;         REMOVED
    targets: string;
    watch: boolean;
}
