import { addCompileCommand as addCompileCommandFromWebsmith } from "@quatico/websmith-compiler";
import { Command } from "commander";

export const addCompileCommand = (parent = new Command()): Command => {
    return addCompileCommandFromWebsmith(parent.command("compile"));
};
