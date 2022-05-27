import { Command } from "@oclif/core";
import { readFile } from "fs/promises";
import path = require("path");
import { parse } from "yaml";
import { exists } from "./utils";

interface Config {
  presets: Record<string, Preset>;
  templates: Record<string, Template[]>;
}

interface Preset {
  input?: string;
  output?: string;
  template: string;
}

interface Template {
  from?: string;
  to?: string;
  create?: string;
}

export const useConfig = (cmd: Command) => {
  const configPath = path.join(cmd.config.configDir, "config.yaml");

  const ensureConfig = async () => {
    if (!(await exists(configPath)))
      cmd.error(
        "Unable to load config file. Run 'photo config' to create a config file."
      );
  };

  const loadConfig = async () => {
    await ensureConfig();
    const config = parse(
      await readFile(configPath, { encoding: "utf-8" })
    ) as Config;

    const getPreset = (preset: string = "default") => {
      const p = config.presets[preset];
      if (p === undefined)
        cmd.error(
          `Unable to load preset. The preset '${preset}' could not be found in the config.`
        );
      return p;
    };

    const getTemplate = (template: string = "default") => {
      const t = config.templates[template];
      if (t === undefined)
        cmd.error(
          `Unable to load template. The template '${template}' could not be found in the config.`
        );
      return t;
    };

    return {
      config,
      getPreset,
      getTemplate,
    };
  };

  return {
    configPath,
    loadConfig,
  };
};

export const defaultConfig = {
  presets: {
    default: {
      tempalte: "default",
    },
  },
  templates: {
    default: [
      {
        from: "{{input}}/*.jpg",
        to: "{{userprofile}}/Pictures/{{filename}}",
      },
    ],
  },
};
