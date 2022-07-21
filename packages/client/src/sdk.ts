/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import type {NamespaceMapping, TransportHandler} from "./configuration";
import {addNamespace, addTransport} from "./configuration";

export class Sdk {
    public addNamespace(name: string, mapping: NamespaceMapping): this | never {
        addNamespace(name, mapping);
        return this;
    }

    public addTransport(name: string, transport: TransportHandler): this | never {
        addTransport(name, transport);
        return this;
    }
}