/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext } from "@quatico/websmith-api";
import { validateRuntimeLibrary } from "../magellan-shared/addon-helpers";
import { type MagellanConfig } from "../magellan-shared/magellan-config";
import { createClientIndexGenerator } from "./client-index-generator";
import { createTransformer } from "./ClientAddon";

/**
 * This addon does not need TypeScript type information.
 * Setting to false enables 10-20x faster compilation via transpileModule fast path.
 */
export const needsTypeInfo = false;

export const activate = (ctx: AddonContext<MagellanConfig>) => {
    validateRuntimeLibrary("@quatico/magellan-client", ctx);
    ctx.registerProcessor((name: string, content: string) => createTransformer(name, content, ctx));
    ctx.registerResultProcessor(createClientIndexGenerator());
};
