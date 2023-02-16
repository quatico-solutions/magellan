/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { deserialize, packInput, RemoteFunction, Serialization } from "@quatico/magellan-shared";
import type { Context } from "./Context";
import { resolveNamespace } from "./namespace";

export const transportRequest = async <O>(
    func: RemoteFunction,
    ctx: Context = { headers: {} },
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
        // eslint-disable-next-line no-console
        process.env.NODE_ENV === "development" && console.error(`Cannot serialize input parameter for remote function: "${name}".`);
        return Promise.reject("Serialization failed");
    }

    const { endpoint, transport } = resolveNamespace(namespace);

    const result = await transport({ name, payload, namespace, endpoint }, ctx);

    try {
        const { data, error } = serialization.deserialize(result);
        if (error?.error) {
            // eslint-disable-next-line no-console
            console.error(new Error(error.error));
        }
        return error ? Promise.reject(error.message) : (data as O);
    } catch (err) {
        // eslint-disable-next-line no-console
        process.env.NODE_ENV === "development" && console.error(`Cannot deserialize response from remote function: "${name}".`);
        return Promise.reject("Deserialization failed");
    }
};