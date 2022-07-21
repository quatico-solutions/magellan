/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type {TransportFunction} from "@quatico/magellan-shared";
import {Context} from "./Context";

export type Configuration = {
    namespaces: Record<string, NamespaceMapping>;
    transports: Record<string, TransportHandler>;
};

export type TransportHandler = {
    (func: TransportFunction, ctx: Context): Promise<string>;
};

export type NamespaceMapping = {
    endpoint: string;
    transport?: string;
};