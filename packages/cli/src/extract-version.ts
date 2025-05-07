/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";

export const getVersion = () => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json")).toString()).version ?? "unknown";
