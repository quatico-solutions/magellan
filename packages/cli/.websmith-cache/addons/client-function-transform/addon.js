"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const addon_helpers_1 = require("../magellan-shared/addon-helpers");
const ClientAddon_1 = require("./ClientAddon");
const activate = (ctx) => {
    (0, addon_helpers_1.validateRuntimeLibrary)("@quatico/magellan-client", ctx);
    ctx.registerProcessor((name, content) => (0, ClientAddon_1.createTransformer)(name, content, ctx));
};
exports.activate = activate;
