/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext } from "@quatico/websmith-api";
import { createBaseTransformer } from "../magellan-shared/Addon";
import { type MagellanConfig } from "../magellan-shared/magellan-config";
import { createClientTransformer } from "./transformer-client";

export const createTransformer = (fileName: string, content: string, ctx: AddonContext<MagellanConfig>): string | never => {
    return createBaseTransformer(fileName, content, ctx, "client-function-transform", createClientTransformer);
};
