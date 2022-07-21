/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { AddonContext, TargetConfig } from "@quatico/websmith-api";
import { validateRuntimeLibrary } from "../magellan-shared/addon-helpers";
import { createTransformer } from "./ClientAddon";

export const activate = (ctx: AddonContext<TargetConfig>) => {
    validateRuntimeLibrary("@quatico/magellan-client");
    ctx.registerProcessor((name: string, content: string) => createTransformer(name, content, ctx));
};
