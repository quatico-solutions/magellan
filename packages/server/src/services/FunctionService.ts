/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import {transportRequest} from "../transport";
import {ServerFunction} from "./ServerFunction";
import type {RemoteFunction} from "@quatico/magellan-shared";

export class FunctionService {
    constructor(private transport = transportRequest, private functions: Map<string, ServerFunction> = new Map()) {}

    public registerFunction<I, O>(name: string, fn: ServerFunction<I, O>): this {
        if (!fn) {
            throw new Error(`Function "${name}" is not a function.`);
        }
        if (!name) {
            throw new Error(`Cannot register function without a name.`);
        }

        this.functions.set(name, fn);
        return this;
    }

    public invokeFunction<O>({name, data, namespace = "default"}: RemoteFunction): Promise<O> {
        const func = this.functions.get(name);
        return func ? func(data) : this.transport({name, data, namespace});
    }
}