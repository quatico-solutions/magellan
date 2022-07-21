/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { Schema, _ } from "ajv";
// NOTE: import Ajv, { _ } from "ajv"; // Draft 07, the 2019 is for draft-09
import Ajv2019 from "ajv/dist/2019";
import fs from "fs";
import { resolve } from "path";

export const validate = ({
    schemaName,
    payload,
    schemaLocation,
    repository,
}: {
    schemaName: string;
    payload: unknown;
    schemaLocation?: string;
    repository?: (schema: string) => Schema;
}): boolean => {
    const ajv = new Ajv2019({ allErrors: true, allowDate: true, code: { formats: _`require(${schemaLocation})` } });
    schemaLocation = schemaLocation ?? "";

    const schema = repository ? repository(schemaName) : readSchema(schemaName, schemaLocation);
    const validation = ajv.compile(schema);
    const result = validation(payload);
    if (validation.errors) {
        validation.errors.forEach(it => {
            // eslint-disable-next-line no-console
            console.error(it);
            throw it;
        });
    }

    return result;
};

export const readSchema = (name: string, schemaLocation: string): Schema => {
    return JSON.parse(fs.readFileSync(resolve(`${schemaLocation}/${name}.json`)).toString());
};
