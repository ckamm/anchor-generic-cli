import {
  array,
  command,
  multioption,
  option,
  positional,
  restPositionals,
  run,
  string,
  subcommands,
} from "cmd-ts";
import { handleInstruction } from "./handleInstruction";
import { KvArg, PubkeyArg } from "./util";

const cmd_instruction = command({
  name: "instruction",
  args: {
    instructionName: positional({ type: string, displayName: "name" }),
    programId: option({ type: PubkeyArg, long: "program" }),
    signers: multioption({ type: array(string), long: "signer" }),
    kvArgsList: restPositionals({
      type: KvArg,
      displayName: "account and data args",
    }),
  },
  handler: handleInstruction,
});

const app = subcommands({
  name: "commands",
  cmds: { instruction: cmd_instruction },
});

async function main() {
  run(app, process.argv.slice(2));
}

main();
