"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransformer = void 0;
const base_transformer_1 = require("../magellan-shared/base-transformer");
const transformer_client_1 = require("./transformer-client");
const createTransformer = (fileName, content, ctx) => {
    return (0, base_transformer_1.createBaseTransformer)(fileName, content, ctx, "client-function-transform", transformer_client_1.createClientTransformer);
};
exports.createTransformer = createTransformer;
