/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { TransportFunction } from "./TransportFunction";

export type TransportHandler = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (func: TransportFunction, ctx: any): Promise<string>;
};
