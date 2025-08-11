/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext } from "@quatico/websmith-api";
import { type MagellanConfig } from "../magellan-shared/magellan-config";
import { createServerTransformer } from "./transformer-server";
import { createBaseTransformer } from "../magellan-shared/base-transformer";

export const createTransformer = (fileName: string, content: string, context: AddonContext<MagellanConfig>): string | never => {
    return createBaseTransformer(fileName, content, context, "service-function-generate", context => createServerTransformer(context));
};
