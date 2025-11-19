"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const addon_helpers_1 = require("../magellan-shared/addon-helpers");
const ServerAddon_1 = require("./ServerAddon");
const activate = (ctx) => {
    (0, addon_helpers_1.validateRuntimeLibrary)("@quatico/magellan-server", ctx);
    ctx.registerProcessor((name, content) => (0, ServerAddon_1.createTransformer)(name, content, ctx));
};
exports.activate = activate;
