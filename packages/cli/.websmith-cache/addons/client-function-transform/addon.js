"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = exports.needsTypeInfo = void 0;
const addon_helpers_1 = require("../magellan-shared/addon-helpers");
const client_index_generator_1 = require("./client-index-generator");
const ClientAddon_1 = require("./ClientAddon");
/**
 * This addon does not need TypeScript type information.
 * Setting to false enables 10-20x faster compilation via transpileModule fast path.
 */
exports.needsTypeInfo = false;
const activate = (ctx) => {
    (0, addon_helpers_1.validateRuntimeLibrary)("@quatico/magellan-client", ctx);
    ctx.registerProcessor((name, content) => (0, ClientAddon_1.createTransformer)(name, content, ctx));
    ctx.registerResultProcessor((0, client_index_generator_1.createClientIndexGenerator)());
};
exports.activate = activate;
