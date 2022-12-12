/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { readFileSync } from "fs";
import { join } from "path";

export const getVersion = () => JSON.parse(readFileSync(join(__dirname, "..", "package.json")).toString()).version ?? "unknown";
