/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { AddonContext } from "@quatico/websmith-api";
import { type MagellanConfig } from "../magellan-shared/magellan-config";
import { createServerTransformer } from "./transformer-server";
import { createBaseTransformer } from "../magellan-shared/Addon";

export const createTransformer = (fileName: string, content: string, ctx: AddonContext<MagellanConfig>): string | never => {
    return createBaseTransformer(fileName, content, ctx, "service-function-generate", createServerTransformer);
};
