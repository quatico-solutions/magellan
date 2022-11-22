/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { deserialize, packInput, RemoteFunction, Serialization } from "@quatico/magellan-shared";
import { Headers } from "node-fetch";
import type { Context } from "../api";
import { resolveNamespace } from "../configuration";

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

    try {
        const result = await transport({ name, payload, namespace, endpoint }, ctx);
        return serialization.deserialize(result);
    } catch (err) {
        throw new Error(`Cannot deserialize response from remote function: "${name}". Reason: "${err}".`);
    }
};
