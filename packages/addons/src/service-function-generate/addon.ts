/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext } from "@quatico/websmith-api";
import { validateRuntimeLibrary } from "../magellan-shared/addon-helpers";
import { type MagellanConfig } from "../magellan-shared/magellan-config";
import { createTransformer } from "./ServerAddon";

export const activate = (ctx: AddonContext<MagellanConfig>) => {
    validateRuntimeLibrary("@quatico/magellan-server");
    ctx.registerProcessor((name: string, content: string) => createTransformer(name, content, ctx));
};
