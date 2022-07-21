/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { TransportHandler } from "./Configuration";

export type ResolvedNamespace = {
    name: string;
    endpoint: string;
    transport: TransportHandler;
};