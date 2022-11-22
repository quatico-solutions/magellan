/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { RemoteFunction, Serialization } from "@quatico/magellan-shared";
import { deserialize, packInput } from "@quatico/magellan-shared";
import type { Context } from "./transport";
import { transportRequest } from "./transport";

export const remoteInvoke = async <O>(
    func: RemoteFunction,
    ctx: Context = { headers: new Headers() },
    serialization: Serialization = { serialize: packInput, deserialize }
): Promise<O> => {
    return transportRequest(func, ctx, serialization);
};
