"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const websmith_testing_1 = require("@quatico/websmith-testing");
const node_path_1 = __importDefault(require("node:path"));
beforeEach(() => {
    jest.spyOn(process.stdout, "write").mockImplementation(() => true);
});
describe("FoobarAddon", () => {
    it("should compile source files", () => {
        const results = (0, websmith_testing_1.compilationEnv)("./__TEST__")
            .addAddon("client-function-transform", node_path_1.default.join(__dirname, ".."))
            .addProjectFromSource({
            "bar.ts": `console.log("Hello, Bar!");`,
            "foo.ts": `export class Foo<T> {
                    constructor(public value: T) {
                        console.log("Hello, Foo!", JSON.stringify(value));
                    }
                }`,
        })
            .compile();
        expect(results.getCompiledFiles().getPaths()).toEqual([
            "/__TEST__/dist/bar.js",
            "/__TEST__/dist/bar.d.ts",
            "/__TEST__/dist/foo.js",
            "/__TEST__/dist/foo.d.ts",
        ]);
        expect(results.getCompiledFile("foo.js")?.getContent()).toMatchInlineSnapshot(`
            "export class Foo {
                value;
                constructor(value) {
                    this.value = value;
                    console.log("Hello, Foo!", JSON.stringify(value));
                }
            }
            "
        `);
    });
});
