import { CliUx, Command, Flags } from "@oclif/core";
import { Input, ParserOutput } from "@oclif/core/lib/interfaces";
import * as chalk from "chalk";
import { SingleBar } from "cli-progress";

export default abstract class PhotoCommand extends Command {
  verbose: boolean = false;
  progress: SingleBar = CliUx.ux.progress({}) as SingleBar;

  set progressFormat(format: string) {
    this.progress = CliUx.ux.progress({ format }) as SingleBar;
  }

  static defaultFlags = {
    verbose: Flags.boolean({ char: "v" }),
  };

  protected async parse<F, A extends { [name: string]: any }>(
    options?: Input<F>,
    argv?: string[]
  ): Promise<ParserOutput<F, A>> {
    const output = await super.parse<F, A>(options, argv);
    this.verbose = (output.flags as any)["verbose"] === true;
    return output;
  }

  public logDebug(message: string) {
    if (this.verbose) this.log(chalk.blueBright(`VERBOSE: ${message}`));
  }

  public startAction(message: string) {
    CliUx.ux.action.start(message);
  }

  public stopAction(message?: string) {
    CliUx.ux.action.stop(message);
  }
}
