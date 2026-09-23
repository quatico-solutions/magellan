"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientImports = void 0;
const magellan_shared_1 = require("../magellan-shared");
const transformer_client_1 = require("./transformer-client");
const create_import_1 = require("./create-import");
/**
 * Creates the necessary import declarations for client functions.
 */
const createClientImports = (factory) => {
    return [
        // import { remoteInvoke } from "@quatico/magellan-client";
        (0, create_import_1.createImport)(factory, transformer_client_1.REMOTE_INVOKE_PARAM_NAME, "@quatico/magellan-client"),
        // import { type Context } from "@quatico/magellan-shared";
        (0, create_import_1.createImport)(factory, magellan_shared_1.CONTEXT_TYPE_NAME, "@quatico/magellan-shared", true),
        // import { type Serialization } from "@quatico/magellan-shared";
        (0, create_import_1.createImport)(factory, magellan_shared_1.SERIALIZATION_TYPE_NAME, "@quatico/magellan-shared", true),
    ];
};
exports.createClientImports = createClientImports;
