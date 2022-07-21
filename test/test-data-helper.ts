/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { join, resolve } from "path";

const fs = jest.requireActual("fs");

export const readE2eTestData = ({ name, dataType = "json" }: { name: string; dataType: string }): string => {
    return fs.readFileSync(resolve(__dirname, "__data__", dataType, `${name}.${dataType}`)).toString();
};

export const resolvedTestDataPath = (packageName: string) => {
    const testSubPath = join("test", "__data__");
    const path = resolve(join(".", testSubPath));
    return path.includes(join("qs-magellan", testSubPath))
        ? path.replace(join("qs-magellan", testSubPath), join("qs-magellan", "packages", packageName, testSubPath))
        : path;
};
