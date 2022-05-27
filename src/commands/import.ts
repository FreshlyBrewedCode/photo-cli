import { Command, Flags, CliUx } from "@oclif/core";
import { useConfig } from "../lib/config";
import { ensureDirectory, exists, glob, isDirectory } from "../lib/utils";
import * as Mustache from "mustache";
import { analyzeImages, getProjectInfo } from "../lib/analyze";
import * as yaml from "yaml";
import { defaultTempalteProps } from "../lib/template";
import PhotoCommand from "../lib/PhotoCommand";
import { SingleBar } from "cli-progress";
import { copyFile, rename } from "fs/promises";
import * as chalk from "chalk";
import { move } from "fs-extra";
import { pathToFileURL } from "url";
import path = require("path");

export default class Import extends PhotoCommand {
  static description =
    "Imports files from the input directory to the output directory using a path template.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    // flag with a value (-n, --name=VALUE)
    input: Flags.string({
      char: "i",
      description: "input path",
      required: false,
    }),
    output: Flags.string({
      char: "o",
      description: "output path",
      required: false,
    }),
    template: Flags.string({
      char: "t",
      description: "name of the template config",
      required: false,
    }),
    preset: Flags.string({
      char: "P",
      description: "name of the import preset",
      required: false,
    }),
    project: Flags.string({
      char: "p",
      description: "the project name of the import",
      required: false,
    }),
    // dryRun: Flags.boolean({ char: "d" }),
    confirm: Flags.boolean({
      char: "c",
      description: "performs the import without additional user confirmation",
    }),
    move: Flags.boolean({
      char: "m",
      description: "move files instead of copy",
    }),
    force: Flags.boolean({
      char: "f",
      description: "overwrite existing files in output directory",
    }),
    ...this.defaultFlags,
  };

  static args = [{ name: "preset" }];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Import);
    const { loadConfig } = useConfig(this);

    this.startAction("Loading config");

    // Load config
    const { config, getPreset, getTemplate } = await loadConfig();
    const preset = getPreset(args.preset ?? "default");
    const template = getTemplate(
      flags.template ?? preset.template ?? "default"
    );

    // Get input/output directories
    const inputDir = flags.input ?? preset.input;
    const outputDir = flags.output ?? preset.output ?? process.cwd();

    if (inputDir === undefined || !(await isDirectory(inputDir))) {
      this.error(
        "No valid input directory. Provide a valid directory using the --input flag or the input option in the preset."
      );
    }
    await ensureDirectory(outputDir);
    this.stopAction();

    // Parse input templates
    let templateProps = {
      ...defaultTempalteProps,
      input: inputDir,
      output: outputDir,
      project: flags.project,
    };

    let templates = template
      .map((t) => ({
        ...t,
        files: [] as string[],
        fileInfo: {} as Record<string, any>,
        projectInfo: {} as Record<string, any>,
      }))
      .filter((t) => t.from !== undefined && t.to !== undefined)
      .map((t) => {
        t.from = Mustache.render(t.from as string, templateProps, undefined, {
          escape: (t) => t,
        });
        return t;
      });

    // Get input files
    this.startAction("Finding files");
    for (let i = 0; i < templates.length; i++) {
      this.logDebug(`From ${templates[i].from}`);
      templates[i].files = await glob(templates[i].from as string, {});
    }
    templates = templates.filter((t) => t.files.length > 0);

    const allFiles = templates.flatMap((t) => t.files);
    this.logDebug(`All files: ${allFiles.join(",")}`);
    this.stopAction(`${allFiles.length}`);

    if (allFiles.length <= 0) {
      this.log(chalk.green("No files to import."));
      this.exit();
    }

    // Analyze files
    this.startAction("Analyzing files");
    for (let i = 0; i < templates.length; i++) {
      let t = templates[i];
      this.logDebug(`Analyzing files: ${t.files.join(",")}`);
      templates[i].fileInfo = await analyzeImages(this, t.files);
      this.logDebug(JSON.stringify(t.fileInfo, null, 2));

      templates[i].projectInfo = getProjectInfo(t.fileInfo);
    }
    this.stopAction();

    // Parse output templates
    const files = templates.flatMap((t) =>
      t.files.map((f) => ({
        template: t,
        path: path.resolve(f),
        outputPath: Mustache.render(
          t.to as string,
          {
            ...templateProps,
            ...t.projectInfo,
            ...t.fileInfo[f],
          },
          undefined,
          { escape: (t) => t }
        ),
      }))
    );

    // Confirm import
    let currentFile = 0;
    for (let file of files) {
      this.log(
        `[${++currentFile}/${allFiles.length}] ${file.path} -> ${
          file.outputPath
        }`
      );
    }
    this.log();

    if (
      !(
        flags.confirm ||
        (await CliUx.ux.confirm(
          chalk.yellow(
            `${flags.move ? "Move" : "Copy"} ${currentFile} files (y/n)?`
          )
        ))
      )
    ) {
      this.exit();
    }

    // Copy/Move files
    currentFile = 0;
    let skippedFiles = 0;
    const showProgress = !this.verbose;

    this.progressFormat =
      "Importing [{bar}] {value}/{total} | {percentage}% | ETA: {eta_formatted}";
    if (showProgress) this.progress.start(allFiles.length, currentFile);

    for (let file of files) {
      let skip = false;
      await ensureDirectory(file.outputPath);
      if (!flags.force) {
        if (await exists(file.outputPath)) {
          skippedFiles++;
          skip = true;
          this.logDebug(
            `Skipping ${file.outputPath} because it already exists`
          );
        }
      }
      if (!skip) {
        if (flags.move) await move(file.path, file.outputPath);
        else await copyFile(file.path, file.outputPath);
      }

      if (showProgress) this.progress.update(++currentFile);
    }
    if (showProgress) this.progress.stop();

    this.stopAction();

    this.log();
    this.log(
      chalk.green(
        `Successfully imported ${currentFile - skippedFiles}/${
          allFiles.length
        } files ${skippedFiles > 0 ? `(skipped ${skippedFiles} files)` : ""}`
      )
    );
  }
}
