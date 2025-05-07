/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type Context, deserialize, packInput, type RemoteFunction, type Serialization } from "@quatico/magellan-shared";
import { transportRequest } from "./transport";

export const remoteInvoke = async <O = void>(
    func: RemoteFunction,
    ctx: Context = { client: { headers: {} } },
    serialization: Serialization = { serialize: packInput, deserialize }
): Promise<O> => {
    return transportRequest<O>(func, ctx, serialization);
};
