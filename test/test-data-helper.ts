/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { resolve } from "path";

const fs = jest.requireActual("fs");

export const readE2eTestData = ({ name, dataType = "json" }: { name: string; dataType: string }): string => {
    return fs.readFileSync(resolve(__dirname, "__data__", dataType, `${name}.${dataType}`)).toString();
};
