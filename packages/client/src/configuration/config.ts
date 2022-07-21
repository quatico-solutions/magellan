/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { formdataFetch } from "../transport";
import { Configuration } from "./Configuration";

const config: Configuration = {
    namespaces: { default: { endpoint: "/api", transport: "default" } },
    transports: { default: formdataFetch },
};
export default config;
