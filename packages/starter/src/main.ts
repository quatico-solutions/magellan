#!/usr/bin/env node
import { cancel, intro, isCancel, log, select, text } from "@clack/prompts";
import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

async function main(currentDir = process.cwd()) {
    intro(" create-magellan ");

    const projectNamePlaceholder = "magellan-demo";
    const name = await text({
        message: "What do you want to name your project?",
        placeholder: projectNamePlaceholder,
        initialValue: projectNamePlaceholder,
        validate(value) {
            if (value.length === 0) {
                return "A name is required!";
            }
        },
    });

    if (isCancel(name)) {
        cancel("Operation cancelled");
        return process.exit(0);
    }

    const projectDir = `${currentDir}/${name}`;
    await mkdir(projectDir).catch(() => {
        cancel(`Project ${name} already exists`);
        return process.exit(0);
    });

    const projectType = await select({
        message: "Pick a project type.",
        options: [{ value: "react-typescript-webpack", label: "React, TypeScript, Webpack" }],
    });

    if (isCancel(projectType)) {
        cancel("Operation cancelled");
        return process.exit(0);
    }

    const templatesDir = join(__dirname, "templates");
    const pathToTemplate = join(templatesDir, String(projectType));
    await cp(pathToTemplate, projectDir, { recursive: true }).catch(() => {
        cancel(`Failed to copy template ${projectType}.`);
        return process.exit(0);
    });

    log.success(`Success! Project '${name}' has been scaffolded.`);

    log.info("Next steps:");
    log.info(`1. Run "cd ${name}" to enter the project directory`);
    log.info(`2. Run "pnpm install" to install dependencies`);
    log.info(`3. Run "pnpm run start" to see the magic happen`);
}

(async () => {
    // eslint-disable-next-line no-console
    await main(process.cwd()).catch(console.error);
})();
