import { Command, Flags } from "@oclif/core";
import { mkdir, stat, writeFile } from "fs/promises";
import { defaultConfig, useConfig } from "../lib/config";
import { ensureDirectory, exists } from "../lib/utils";
import * as YAML from "yaml";
import { exec } from "child_process";
import path = require("path");

export default class Config extends Command {
  static description = "Edit the photo-cli config.";

  static flags = {};

  static args = [];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Config);
    const { configPath } = useConfig(this);

    if (!(await exists(configPath))) {
      await ensureDirectory(this.config.configDir);

      this.log("No config file found. Creating default config.");
      await writeFile(configPath, YAML.stringify(defaultConfig), {
        encoding: "utf-8",
      });
    }

    // Open config folder
    const absolutePath = path.resolve(configPath);
    this.log(`${absolutePath}`);
    exec(`start "" "${path.dirname(absolutePath)}"`);
  }
}
