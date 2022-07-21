/* eslint-disable no-console */
import { createFs, resetFs } from "./test/fusion-fs";
import { readE2eTestData } from "./test/test-data-helper";

export { readE2eTestData };

console.debug = () => undefined;
console.info = () => undefined;
console.log = () => undefined;

jest.mock("fs", () => {
    return createFs(jest.requireActual("fs"));
});

afterEach(() => {
    jest.clearAllMocks();
    resetFs();
});
