/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { deserialize, RemoteFunction, Serialization, serialize } from "@quatico/magellan-shared";
import type { Context } from "../api";
import { resolveNamespace } from "../configuration";

export const transportRequest = async <O>(
    func: RemoteFunction,
    ctx: Context = { headers: {} },
    serialization: Serialization = { serialize, deserialize }
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
        const { data, error } = serialization.deserialize(result);
        if (error?.error) {
            // eslint-disable-next-line no-console
            console.error(`Function request to "${name}" failed with error ${error.error}`);
        }
        return error ? Promise.reject(error.message) : (data as O);
    } catch (err) {
        throw new Error(`Cannot deserialize response from invoke function: "${name}". Reason: "${err}".`);
    }
};
