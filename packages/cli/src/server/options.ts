/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

export interface ServerOptions {
    debug: boolean;
    serverModuleDir: string;
    staticDir: string;
    port: number;
}

export const getPort = ({ port }: Partial<ServerOptions>): number => (typeof port === "number" && !isNaN(port) ? port : 3000);

export const getServerModuleDir = ({ serverModuleDir }: Partial<ServerOptions>): string =>
    typeof serverModuleDir === "string" ? serverModuleDir : "./server-esm";

export const createOptions = (args: Partial<ServerOptions>, staticDir: string): ServerOptions => ({
    staticDir: staticDir,
    serverModuleDir: getServerModuleDir(args),
    debug: args.debug ?? false,
    port: getPort(args),
});
