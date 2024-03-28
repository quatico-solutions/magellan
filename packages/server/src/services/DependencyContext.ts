/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import type { TransportHandler } from "@quatico/magellan-shared";
import type { TransportRequest } from "../api";

export type DependencyContext = {
    defaultTransportRequest: TransportRequest;
    defaultTransportHandler: TransportHandler;
};

export const initDependencyContext = (diContext: DependencyContext) => {
    global.__qsMagellanDI__ = diContext;
};

export const getDependencyContext = (): DependencyContext | never => {
    if (global.__qsMagellanDI__ === undefined) {
        throw new Error("Dependency Context not initialized");
    }
    return global.__qsMagellanDI__;
};
