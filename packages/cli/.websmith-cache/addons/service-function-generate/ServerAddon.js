"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransformer = void 0;
const transformer_server_1 = require("./transformer-server");
const base_transformer_1 = require("../magellan-shared/base-transformer");
const createTransformer = (fileName, content, context) => {
    return (0, base_transformer_1.createBaseTransformer)(fileName, content, context, "service-function-generate", context => (0, transformer_server_1.createServerTransformer)(context));
};
exports.createTransformer = createTransformer;
