/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { deserialize, packInput, RemoteFunction, Serialization } from "@quatico/magellan-shared";
import type { Context } from "./transport";
import { transportRequest } from "./transport";

export const remoteInvoke = async <O = void>(
    func: RemoteFunction,
    ctx: Context = { headers: {} },
    serialization: Serialization = { serialize: packInput, deserialize }
): Promise<O> => {
    return transportRequest<O>(func, ctx, serialization);
};
