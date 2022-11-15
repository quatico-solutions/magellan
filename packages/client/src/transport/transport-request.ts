/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { Context } from "../configuration";
import { resolveNamespace } from "../configuration";
import { deserialize, packInput, RemoteFunction, Serialization } from "@quatico/magellan-shared";

export const transportRequest = async <O>(
    func: RemoteFunction,
    ctx: Context = { headers: new Headers() },
    serialization: Serialization = { serialize: packInput, deserialize }
): Promise<O> => {
    const { name, data = {}, namespace = "default" } = func;

    if (!name) {
        throw new Error('Cannot invoke remote function without "name" property.');
    }

    let payload: string;
    try {
        payload = serialization.serialize(data);
    } catch (err) {
        throw new Error(`Cannot serialize input parameter for remote function: "${name}".`);
    }

    const { endpoint, transport } = resolveNamespace(namespace);

    const result = await transport({ name, payload, namespace, endpoint }, ctx);

    try {
        return serialization.deserialize(result);
    } catch (err) {
        throw new Error(`Cannot deserialize response from remote function: "${name}".`);
    }
};
