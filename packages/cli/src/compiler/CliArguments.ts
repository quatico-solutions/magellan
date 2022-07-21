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
    // functionsDir: string;
    hostname: string;
    port: number;
    project: string;
    // serverModuleDir: string;
    // sourceMap?: boolean;
    targets: string;
    watch: boolean;
}
